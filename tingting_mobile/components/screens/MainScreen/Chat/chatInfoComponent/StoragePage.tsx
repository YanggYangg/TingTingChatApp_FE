import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Linking,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as IntentLauncher from 'expo-intent-launcher';
import debounce from 'lodash/debounce';
import { Api_Profile } from '../../../../../apis/api_profile';
import ShareModal from './ShareModal';

interface Media {
  id: string;
  messageId: string;
  urlIndex: number;
  linkURL: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  date: string;
  sender: string;
  userId: string;
}

interface UserProfile {
  _id: string;
  firstname: string;
  surname: string;
  avatar: string | null;
}

interface Props {
  conversationId: string;
  userId: string;
  socket: any;
  otherUser?: { firstname: string; surname: string; avatar?: string } | null;
  isVisible: boolean;
  onClose: () => void;
  onDelete?: (items: { messageId: string; urlIndex: number; isMessageDeleted: boolean }[]) => void;
  onDataUpdated?: () => void;
}

const StoragePage: React.FC<Props> = ({
  conversationId,
  userId,
  socket,
  otherUser,
  isVisible,
  onClose,
  onDelete,
  onDataUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'files' | 'links'>('images');
  const [filterSender, setFilterSender] = useState<string>('All');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState<boolean>(false);
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Media[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const gridVideoRefs = useRef<Record<string, Video>>({});
  const fullScreenVideoRef = useRef<Video>(null);
  const [mediaToForward, setMediaToForward] = useState<Media | null>(null);

  const [data, setData] = useState<{
    images: Media[];
    files: Media[];
    links: Media[];
  }>({
    images: [],
    files: [],
    links: [],
  });

  // Fetch user profile
  const fetchUserProfile = useCallback(
    async (userId: string) => {
      if (userProfiles[userId]) return userProfiles[userId];
      try {
        const response = await Api_Profile.getProfile(userId);
        const user = response?.data?.user as UserProfile;
        const profile = user || { _id: userId, firstname: 'Không tìm thấy', surname: '', avatar: null };
        setUserProfiles((prev) => ({ ...prev, [userId]: profile }));
        return profile;
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        const profile = { _id: userId, firstname: 'Không tìm thấy', surname: '', avatar: null };
        setUserProfiles((prev) => ({ ...prev, [userId]: profile }));
        return profile;
      }
    },
    [userProfiles]
  );

  // Fetch media, files, and links
  const fetchData = useCallback(() => {
    if (!conversationId || !socket) {
      setData({ images: [], files: [], links: [] });
      setLoading(false);
      Alert.alert('Lỗi', 'Thiếu thông tin để tải dữ liệu.');
      return;
    }

    setLoading(true);
    const requests = [
      { event: 'getChatMedia', key: 'images', type: 'media' },
      { event: 'getChatFiles', key: 'files', type: 'file' },
      { event: 'getChatLinks', key: 'links', type: 'link' },
    ];

    let completed = 0;
    requests.forEach(({ event, key, type }) => {
      socket.emit(event, { conversationId }, async (response: any) => {
        if (response?.success && Array.isArray(response.data)) {
          const formattedData = await Promise.all(
            response.data.flatMap((item: any) =>
              (Array.isArray(item?.linkURL) ? item.linkURL : [item?.linkURL])
                .filter((url: string) => url && typeof url === 'string' && url.startsWith('http'))
                .map(async (url: string, urlIndex: number) => {
                  const senderProfile =
                    item.userId === userId
                      ? { firstname: 'Bạn', surname: '' }
                      : await fetchUserProfile(item.userId);
                  return {
                    id: `${item?._id}_${urlIndex}`,
                    messageId: item?._id,
                    urlIndex,
                    linkURL: url,
                    // name: item?.content || `${type}_${urlIndex + 1}`,
                    type:
                      item?.messageType === 'video'
                        ? 'video'
                        : type === 'file'
                          ? 'file'
                          : type === 'link'
                            ? 'link'
                            : 'image',
                    date: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Unknown',
                    sender:
                      item.userId === userId
                        ? 'Bạn'
                        : `${senderProfile.firstname} ${senderProfile.surname}`.trim() || 'Người dùng',
                    userId: item?.userId || 'unknown',
                  };
                })
            )
          );
          setData((prev) => ({
            ...prev,
            [key]: formattedData.filter((item) => item.linkURL),
          }));
        } else {
          console.error(`Error loading ${key}:`, response?.message || 'Invalid data');
          Alert.alert('Lỗi', `Không thể tải ${key}: ${response?.message || 'Lỗi không xác định'}`);
        }
        completed++;
        if (completed === requests.length) setLoading(false);
      });
    });
  }, [conversationId, socket, userId, fetchUserProfile]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !conversationId || !isVisible) return;

    fetchData();

    const handleDataUpdate = (key: 'images' | 'files' | 'links', type: string) => async (items: any[]) => {
      const formattedData = await Promise.all(
        items.flatMap((item) =>
          (Array.isArray(item?.linkURL) ? item.linkURL : [item?.linkURL])
            .filter((url: string) => url && typeof url === 'string' && url.startsWith('http'))
            .map(async (url: string, urlIndex: number) => {
              const senderProfile =
                item.userId === userId ? { firstname: 'Bạn', surname: '' } : await fetchUserProfile(item.userId);
              return {
                id: `${item?._id}_${urlIndex}`,
                messageId: item?._id,
                urlIndex,
                linkURL: url,
                // name: item?.content || `${type}_${urlIndex + 1}`,
                type:
                  item?.messageType === 'video'
                    ? 'video'
                    : type === 'file'
                      ? 'file'
                      : type === 'link'
                        ? 'link'
                        : 'image',
                date: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Unknown',
                sender:
                  item.userId === userId
                    ? 'Bạn'
                    : `${senderProfile.firstname} ${senderProfile.surname}`.trim() || 'Người dùng',
                userId: item?.userId || 'unknown',
              };
            })
        )
      );
      setData((prev) => ({
        ...prev,
        [key]: formattedData.filter((item) => item.linkURL),
      }));
      if (onDataUpdated) onDataUpdated();
    };

    socket.on('chatMedia', handleDataUpdate('images', 'media'));
    socket.on('chatFiles', handleDataUpdate('files', 'file'));
    socket.on('chatLinks', handleDataUpdate('links', 'link'));

    socket.on('messageDeleted', ({ messageId, urlIndex, isMessageDeleted }: any) => {
      setData((prev) => {
        const newData = { ...prev };
        if (isMessageDeleted) {
          newData.images = newData.images.filter((item) => item.messageId !== messageId);
          newData.files = newData.files.filter((item) => item.messageId !== messageId);
          newData.links = newData.links.filter((item) => item.messageId !== messageId);
        } else {
          newData.images = newData.images.filter(
            (item) => !(item.messageId === messageId && item.urlIndex === urlIndex)
          );
          newData.files = newData.files.filter(
            (item) => !(item.messageId === messageId && item.urlIndex === urlIndex)
          );
          newData.links = newData.links.filter(
            (item) => !(item.messageId === messageId && item.urlIndex === urlIndex)
          );
        }
        return newData;
      });
      if (onDelete) {
        onDelete([{ messageId, urlIndex, isMessageDeleted }]);
      }
      if (onDataUpdated) onDataUpdated();
    });

    socket.on('error', (error: any) => {
      Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    });

    return () => {
      socket.off('chatMedia');
      socket.off('chatFiles');
      socket.off('chatLinks');
      socket.off('messageDeleted');
      socket.off('error');
    };
  }, [socket, conversationId, isVisible, fetchData, onDelete, onDataUpdated]);

  // Pause videos when switching full-screen mode
  useEffect(() => {
    if (fullScreenMedia) {
      Object.values(gridVideoRefs.current).forEach((ref) => ref?.pauseAsync().catch(() => { }));
    } else {
      fullScreenVideoRef.current?.pauseAsync().catch(() => { });
    }
  }, [fullScreenMedia]);

  // Delete selected items
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một mục để xóa.');
      return;
    }

    try {
      const previousData = { ...data };
      const deletedItemsSet = new Set<{ messageId: string; urlIndex: number; isMessageDeleted: boolean }>();

      // Optimistic update
      const newData = { ...data };
      selectedItems.forEach((item) => {
        newData[activeTab] = newData[activeTab].filter((i) => i.id !== item.id);
        deletedItemsSet.add({ messageId: item.messageId, urlIndex: item.urlIndex, isMessageDeleted: false });
      });
      setData(newData);

      const deletionPromises = selectedItems.map(
        (item) =>
          new Promise((resolve) => {
            socket.emit(
              'deleteMessageChatInfo',
              { messageId: item.messageId, urlIndex: item.urlIndex },
              (response: any) => {
                if (response?.success) {
                  resolve({
                    success: true,
                    item,
                    isMessageDeleted: response.data?.isMessageDeleted || false,
                  });
                } else {
                  resolve({ success: false, message: response?.message || `Không thể xóa mục ${item.id}` });
                }
              }
            );
          })
      );

      const results = await Promise.all(deletionPromises);
      const failedDeletions = results.filter((result: any) => !result.success);

      if (failedDeletions.length > 0) {
        const errorMessages = failedDeletions.map((result: any) => result.message).join('; ');
        Alert.alert('Lỗi', `Không thể xóa một số mục: ${errorMessages}`);
        setData(previousData);
      } else {
        if (onDelete) {
          const deletedItems = Array.from(deletedItemsSet).map((item) => ({
            messageId: item.messageId,
            urlIndex: item.urlIndex,
            isMessageDeleted:
              results.find(
                (r: any) => r.item.messageId === item.messageId && r.item.urlIndex === item.urlIndex
              )?.isMessageDeleted || false,
          }));
          onDelete(deletedItems);
        }
        setSelectedItems([]);
        setIsSelecting(false);
        Alert.alert('Thành công', `Đã xóa ${selectedItems.length} mục thành công.`);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', `Không thể xóa mục: ${error.message || 'Lỗi không xác định'}`);
      setData(previousData);
    }
  };

  // Handle forward action
  const handleForwardSelected = () => {
    if (selectedItems.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một mục để chuyển tiếp.');
      return;
    }
    setIsShareModalOpen(true);
  };

  // Handle share modal close
  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setSelectedItems([]);
    setIsSelecting(false);
  };

  // Handle share action from ShareModal
  const handleShare = (conversationIds: string[], content?: string) => {
    Alert.alert('Thành công', `Đã chuyển tiếp ${selectedItems.length} mục thành công!`);
    setSelectedItems([]);
    setIsSelecting(false);
    setIsShareModalOpen(false);
  };

  const handleForwardClick = useCallback((item: Media) => {
    setMediaToForward(item);
    setIsShareModalOpen(true);
  }, []);

  // Download media or file
  const downloadMedia = useCallback(
    async (url: string, type: string, filename?: string) => {
      try {
        const fileName =
          filename ||
          url.split('/').pop() ||
          (type === 'image' ? 'image.jpg' : type === 'video' ? 'video.mp4' : 'file');
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const { uri } = await FileSystem.downloadAsync(url, fileUri);

        if (type === 'image' || type === 'video') {
          const permission = await MediaLibrary.requestPermissionsAsync();
          if (!permission.granted) throw new Error('Không có quyền truy cập thư viện.');
          await MediaLibrary.createAssetAsync(uri);
          Alert.alert('Thành công', `${type === 'image' ? 'Hình ảnh' : 'Video'} đã được lưu!`);
        } else {
          Alert.alert('Thành công', `Tệp "${fileName}" đã được tải xuống.`);
          await openFile(uri, fileName);
        }
      } catch (error: any) {
        Alert.alert('Lỗi', `Không thể tải ${type}: ${error.message || 'Lỗi không xác định'}`);
      }
    },
    [openFile]
  );

  // Open a downloaded file
  const openFile = useCallback(async (fileUri: string, fileName: string) => {
    if (Platform.OS === 'android') {
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: getMimeTypeFromExtension(fileName) || 'application/octet-stream',
        });
      } catch (error: any) {
        Alert.alert('Lỗi', `Không thể mở tệp "${fileName}": ${error.message}`);
      }
    } else {
      Alert.alert('Thành công', `Tệp "${fileName}" đã được tải xuống. Kiểm tra ứng dụng Tệp.`);
    }
  }, []);

  // Get MIME type
  const getMimeTypeFromExtension = useCallback((fileName: string): string | null => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pdf: 'application/pdf',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      mp4: 'video/mp4',
    };
    return mimeTypes[extension!] || null;
  }, []);

  // Open a URL
  const handleOpenLink = useCallback((linkURL: string) => {
    if (!linkURL || linkURL === '#') {
      Alert.alert('Lỗi', 'Liên kết không hợp lệ.');
      return;
    }
    Linking.openURL(linkURL).catch(() => Alert.alert('Lỗi', 'Không thể mở liên kết.'));
  }, []);

  // Filter and sort data
  const filteredData = useMemo(() => {
    const currentData = activeTab === 'images' ? data.images : activeTab === 'files' ? data.files : data.links;
    return currentData
      .filter((item) => {
        if (filterSender !== 'All' && item.sender !== filterSender) return false;
        if (startDate && new Date(item.date) < startDate) return false;
        if (endDate && new Date(item.date) > endDate) return false;
        if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeTab, data, filterSender, startDate, endDate, searchText]);

  // Get unique senders
  const uniqueSenders = useMemo(() => {
    const senders = new Set<string>();
    [...data.images, ...data.files, ...data.links].forEach((item) => senders.add(item.sender));
    return ['All', ...Array.from(senders).sort()];
  }, [data]);

  // Toggle selection
  const toggleSelectItem = useCallback((item: Media) => {
    setSelectedItems((prev) =>
      prev.some((selected) => selected.id === item.id)
        ? prev.filter((selected) => selected.id !== item.id)
        : [...prev, item]
    );
  }, []);

  // Select or deselect all
  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredData]);
    }
  }, [filteredData, selectedItems]);

  // Handle date filter
  const handleDateFilter = useCallback((days: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);
    setStartDate(pastDate);
    setEndDate(today);
    setShowDateSuggestions(false);
  }, []);

  // Handle date input
  const handleDateInput = useCallback((text: string, isStartDate: boolean) => {
    if (!text) {
      if (isStartDate) setStartDate(null);
      else setEndDate(null);
      return;
    }

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(text)) return;

    const date = new Date(text);
    if (isNaN(date.getTime())) {
      Alert.alert('Lỗi', 'Ngày không hợp lệ. Vui lòng nhập theo định dạng YYYY-MM-DD.');
      return;
    }

    if (isStartDate) {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  }, []);

  // Handle swiper index change
  const handleSwipe = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      setFullScreenMedia(filteredData[index]);
    },
    [filteredData]
  );

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((text: string) => {
      setSearchText(text);
    }, 300),
    []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <>
      <Modal isVisible={isVisible} onBackdropPress={onClose} onBackButtonPress={onClose} style={styles.modal}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Kho lưu trữ</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'images' && styles.activeTab]}
              onPress={() => setActiveTab('images')}
            >
              <Text style={[styles.tabText, activeTab === 'images' && styles.activeTabText]}>Hình ảnh/Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'files' && styles.activeTab]}
              onPress={() => setActiveTab('files')}
            >
              <Text style={[styles.tabText, activeTab === 'files' && styles.activeTabText]}>Files</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'links' && styles.activeTab]}
              onPress={() => setActiveTab('links')}
            >
              <Text style={[styles.tabText, activeTab === 'links' && styles.activeTabText]}>Links</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterContainer}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm..."
                value={searchText}
                onChangeText={handleSearch}
              />
            </View>

            <View style={styles.filterRow}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filterSender}
                  onValueChange={(value) => setFilterSender(value)}
                  style={styles.picker}
                >
                  {uniqueSenders.map((sender) => (
                    <Picker.Item key={sender} label={sender} value={sender} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity
                style={styles.dateFilterButton}
                onPress={() => setShowDateFilter(!showDateFilter)}
              >
                <Ionicons name="calendar-outline" size={20} color="#007bff" />
                <Text style={styles.dateFilterText}>Chọn ngày</Text>
              </TouchableOpacity>
            </View>

            {showDateFilter && (
              <View style={styles.dateFilterContainer}>
                <TouchableOpacity
                  style={styles.dateSuggestionButton}
                  onPress={() => setShowDateSuggestions(!showDateSuggestions)}
                >
                  <Text style={styles.dateSuggestionText}>Gợi ý thời gian</Text>
                </TouchableOpacity>
                {showDateSuggestions && (
                  <View style={styles.dateSuggestionList}>
                    {[7, 30, 90].map((days) => (
                      <TouchableOpacity
                        key={days}
                        style={styles.dateSuggestionItem}
                        onPress={() => handleDateFilter(days)}
                      >
                        <Text style={styles.dateSuggestionItemText}>{days} ngày trước</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <Text style={styles.dateRangeLabel}>Chọn khoảng thời gian</Text>
                <View style={styles.dateInputContainer}>
                  <View style={styles.dateInputWrapper}>
                    <Ionicons name="calendar-outline" size={16} color="#666" style={styles.dateInputIcon} />
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      value={startDate ? startDate.toISOString().split('T')[0] : ''}
                      onChangeText={(text) => handleDateInput(text, true)}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.dateInputWrapper}>
                    <Ionicons name="calendar-outline" size={16} color="#666" style={styles.dateInputIcon} />
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      value={endDate ? endDate.toISOString().split('T')[0] : ''}
                      onChangeText={(text) => handleDateInput(text, false)}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                  }}
                >
                  <Text style={styles.clearDateText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, isSelecting && styles.actionButtonActive]}
              onPress={() => {
                setIsSelecting(!isSelecting);
                setSelectedItems([]);
              }}
            >
              <Text style={styles.actionButtonText}>{isSelecting ? 'Hủy' : 'Chọn'}</Text>
            </TouchableOpacity>
            {isSelecting && (
              <TouchableOpacity
                style={[styles.actionButton, selectedItems.length === filteredData.length && styles.actionButtonActive]}
                onPress={toggleSelectAll}
              >
                <Text style={styles.actionButtonText}>
                  {selectedItems.length === filteredData.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Text>
              </TouchableOpacity>
            )}
            {mediaToForward && (
              <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => {
                  setIsShareModalOpen(false);
                  setMediaToForward(null);
                }}
                onShare={(conversationIds: string[], content?: string) => {
                  socket.emit(
                    'forwardMessage',
                    {
                      messageId: mediaToForward.messageId,
                      targetConversationIds: conversationIds,
                      userId,
                      content: content || '',
                    },
                    (response: any) => {
                      if (response?.success) {
                        Alert.alert('Thành công', 'Đã chuyển tiếp thành công!');
                        setIsShareModalOpen(false);
                        setMediaToForward(null);
                      } else {
                        Alert.alert('Lỗi', `Không thể chuyển tiếp: ${response?.message || 'Lỗi không xác định'}`);
                      }
                    }
                  );
                }}
                messageToForward={mediaToForward.linkURL || mediaToForward.name}
                userId={userId}
                messageId={mediaToForward.messageId}
              />
            )}
            {isSelecting && selectedItems.length > 0 && (
              <>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSelected}>
                  <Text style={styles.deleteButtonText}>Xóa ({selectedItems.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.forwardButton} onPress={handleForwardSelected}>
                  <Text style={styles.forwardButtonText}>Chuyển tiếp ({selectedItems.length})</Text>
                </TouchableOpacity>
              </>
            )}
            {mediaToForward && (
              <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => {
                  setIsShareModalOpen(false);
                  setMediaToForward(null);
                }}
                onShare={(conversationIds: string[], content?: string) => {
                  socket.emit(
                    'forwardMessage',
                    {
                      messageId: mediaToForward.messageId,
                      targetConversationIds: conversationIds,
                      userId,
                      content: content || '',
                    },
                    (response: any) => {
                      if (response?.success) {
                        Alert.alert('Thành công', 'Đã chuyển tiếp thành công!');
                        setIsShareModalOpen(false);
                        setMediaToForward(null);
                      } else {
                        Alert.alert('Lỗi', `Không thể chuyển tiếp: ${response?.message || 'Lỗi không xác định'}`);
                      }
                    }
                  );
                }}
                messageToForward={mediaToForward.linkURL || mediaToForward.name}
                userId={userId}
                messageId={mediaToForward.messageId}
              />
            )}
          </View>

          <ScrollView style={styles.contentContainer}>
            {filteredData.length === 0 ? (
              <Text style={styles.noDataText}>Không có {activeTab} nào.</Text>
            ) : (
              <View style={activeTab === 'images' ? styles.grid : styles.list}>
                {filteredData.map((item) => (
                  <View key={item.id} style={activeTab === 'images' ? styles.gridItem : styles.listItem}>
                    {isSelecting && (
                      <TouchableOpacity style={styles.selectCheckbox} onPress={() => toggleSelectItem(item)}>
                        <Ionicons
                          name={selectedItems.some((selected) => selected.id === item.id) ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={selectedItems.some((selected) => selected.id === item.id) ? '#007bff' : '#666'}
                        />
                      </TouchableOpacity>
                    )}
                    {activeTab === 'images' && (
                      <>
                        {item.type === 'image' ? (
                          <TouchableOpacity onPress={() => setFullScreenMedia(item)}>
                            <Image
                              source={{ uri: item.linkURL }}
                              style={styles.mediaItem}
                              onError={(e) => console.error(`Error loading image ${item.id}:`, e)}
                            />
                          </TouchableOpacity>
                        ) : item.linkURL && item.linkURL.startsWith('http') ? (
                          <TouchableOpacity onPress={() => setFullScreenMedia(item)}>
                            <Video
                              ref={(ref) => {
                                if (ref) gridVideoRefs.current[item.id] = ref;
                              }}
                              source={{ uri: item.linkURL }}
                              style={styles.mediaItem}
                              useNativeControls={false}
                              isMuted={true}
                              resizeMode="cover"
                              onError={(e) => {
                                console.error(`Error loading video ${item.id}:`, e);
                                setVideoError('Không thể tải video.');
                              }}
                            />
                            <View style={styles.playIconContainer}>
                              <Ionicons name="play-circle-outline" size={30} color="#fff" />
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.errorText}>Video không hợp lệ</Text>
                        )}
                      </>
                    )}
                    {activeTab === 'files' && (
                      <View style={styles.fileItem}>
                        <Ionicons name="document-outline" size={24} color="#007bff" style={styles.fileIcon} />
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileName}>{item.name}</Text>
                          <Text style={styles.fileMeta}>
                            {item.sender} • {item.date}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={() => downloadMedia(item.linkURL, 'file', item.name)}
                        >
                          <Ionicons name="download-outline" size={24} color="#007bff" />
                        </TouchableOpacity>
                      </View>
                    )}
                    {activeTab === 'links' && (
                      <View style={styles.linkItem}>
                        <View style={styles.linkInfo}>
                          <Text style={styles.linkName}>{item.name}</Text>
                          <TouchableOpacity onPress={() => handleOpenLink(item.linkURL)}>
                            <Text style={styles.linkUrl}>{item.linkURL}</Text>
                          </TouchableOpacity>
                          <Text style={styles.fileMeta}>
                            {item.sender} • {item.date}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.linkActionButton}
                          onPress={() => handleOpenLink(item.linkURL)}
                        >
                          <Ionicons name="link" size={24} color="#007bff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <Modal
            isVisible={!!fullScreenMedia}
            onBackdropPress={() => setFullScreenMedia(null)}
            onBackButtonPress={() => setFullScreenMedia(null)}
            style={styles.fullScreenModal}
          >
            {fullScreenMedia && (
              <View style={styles.fullScreenContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenMedia(null)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.forwardButton1, { top: 40, right: 60 }]}
                  onPress={() => handleForwardClick(fullScreenMedia)}
                >
                  <Ionicons name="share-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.downloadButton, { top: 40, right: 20 }]}
                  onPress={() => downloadMedia(fullScreenMedia.linkURL, fullScreenMedia.type, fullScreenMedia.name)}
                >
                  <Ionicons name="download-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <Swiper
                  index={currentIndex}
                  onIndexChanged={handleSwipe}
                  loop={false}
                  showsPagination={true} // Hiển thị chấm điều hướng
                  dotColor="#555"
                  activeDotColor="#fff"
                  scrollEnabled={true}
                >
                  {filteredData
                    .filter((item) => item.type !== 'file' && item.type !== 'link')
                    .map((item) => (
                      <View key={item.id} style={styles.swiperSlide}>
                        {item.type === 'image' ? (
                          <Image
                            source={{ uri: item.linkURL }}
                            style={styles.fullScreenMedia}
                            resizeMode="contain"
                            onError={(e) => console.error(`Error loading image ${item.id}:`, e)}
                          />
                        ) : item.type === 'video' && item.linkURL && item.linkURL.startsWith('http') ? (
                          <View style={styles.fullScreenVideoContainer}>
                            <Video
                              ref={item.id === fullScreenMedia.id ? fullScreenVideoRef : null}
                              source={{ uri: item.linkURL }}
                              style={styles.fullScreenMedia}
                              useNativeControls // Sử dụng điều khiển gốc
                              resizeMode="contain"
                              onError={(e) => {
                                console.error(`Error loading full-screen video ${item.id}:`, e);
                                setVideoError('Không thể tải video.');
                              }}
                              isLooping
                            />
                          </View>
                        ) : (
                          <Text style={styles.errorText}>Video không hợp lệ</Text>
                        )}
                        <Text style={styles.mediaName}>{item.name || item.linkURL}</Text>
                      </View>
                    ))}
                </Swiper>
              </View>
            )}
          </Modal>
        </View>
      </Modal>

      {selectedItems.length > 0 && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={handleShareModalClose}
          onShare={handleShare}
          messageToForward={selectedItems[0]?.linkURL || selectedItems[0]?.name}
          userId={userId}
          messageId={selectedItems[0]?.messageId}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  filterContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    marginRight: 10,
  },
  picker: {
    height: 40,
    fontSize: 14,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f0ff',
    padding: 10,
    borderRadius: 5,
  },
  dateFilterText: {
    marginLeft: 5,
    color: '#007bff',
    fontSize: 14,
  },
  dateFilterContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    elevation: 2,
  },
  dateSuggestionButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  dateSuggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dateSuggestionList: {
    marginTop: 5,
  },
  dateSuggestionItem: {
    padding: 10,
    borderRadius: 5,
  },
  dateSuggestionItemText: {
    fontSize: 12,
    color: '#333',
  },
  dateRangeLabel: {
    fontSize: 12,
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  dateInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    paddingHorizontal: 8,
  },
  dateInputIcon: {
    marginRight: 5,
  },
  dateInput: {
    flex: 1,
    height: 32,
    fontSize: 12,
    color: '#333',
  },
  clearDateButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  clearDateText: {
    color: '#333',
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#007bff',
  },
  actionButtonText: {
    color: '#333',
    fontSize: 14,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: '#ff4444',
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  forwardButton: {
    padding: 10,
    backgroundColor: '#28a745',
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  forwardButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  list: {
    gap: 10,
  },
  gridItem: {
    width: '30%',
    position: 'relative',
  },
  listItem: {
    position: 'relative',
  },
  mediaItem: {
    width: '100%',
    height: 100,
    borderRadius: 5,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  fileIcon: {
    marginRight: 10,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: 12,
    color: '#666',
  },
  downloadButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    borderRadius: 20,
    padding: 8,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  linkInfo: {
    flex: 1,
  },
  linkName: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: 12,
    color: '#007bff',
  },
  linkActionButton: {
    padding: 5,
  },
  selectCheckbox: {
    position: 'absolute',
    top: 5,
    left: 5,
    zIndex: 10,
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenModal: {
    margin: 0,
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMedia: {
    width: '100%',
    height: '100%', // Đảm bảo chiếm toàn bộ chiều cao
    alignSelf: 'center',
  },
  fullScreenVideoContainer: {
    width: '100%',
    height: '100%', // Đảm bảo video chiếm toàn bộ chiều cao
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 10,
  },
  forwardButton1: {
    position: 'absolute',
    top: 40,
    right: 60,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 10,
  },
  downloadButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 10,
  },
  swiperSlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaName: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    position: 'absolute',
    bottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ff0000',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },

});

export default StoragePage;