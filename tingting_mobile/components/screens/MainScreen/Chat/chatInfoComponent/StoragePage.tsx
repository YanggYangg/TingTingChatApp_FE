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

/**
 * Component for displaying and managing media storage (images, videos, files, links).
 */
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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Media[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const gridVideoRefs = useRef<Record<string, Video>>({});
  const fullScreenVideoRef = useRef<Video>(null);

  const [data, setData] = useState<{
    images: Media[];
    files: Media[];
    links: Media[];
  }>({
    images: [],
    files: [],
    links: [],
  });

  /**
   * Fetch media, files, and links from the server.
   */
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
      socket.emit(event, { conversationId }, (response: any) => {
        if (response?.success) {
          setData((prev) => ({
            ...prev,
            [key]: formatData(response.data, type),
          }));
        } else {
          Alert.alert('Lỗi', `Không thể tải ${key}: ${response?.message || 'Lỗi không xác định'}`);
        }
        completed++;
        if (completed === requests.length) setLoading(false);
      });
    });
  }, [conversationId, socket]);

  /**
   * Format raw server data into Media objects.
   */
  const formatData = useCallback(
    (items: any[], dataType: string): Media[] => {
      if (!Array.isArray(items)) return [];

      return items
        .flatMap((item) => {
          const urls = Array.isArray(item?.linkURL)
            ? item.linkURL.filter((url: string) => url && typeof url === 'string')
            : typeof item?.linkURL === 'string'
            ? [item.linkURL]
            : [];
          return urls.map((url: string, urlIndex: number) => ({
            id: `${item?._id}_${urlIndex}`,
            messageId: item?._id,
            urlIndex,
            linkURL: url,
            name: item?.content || `${dataType}_${urlIndex + 1}`,
            type:
              item?.messageType === 'video'
                ? 'video'
                : dataType === 'file'
                ? 'file'
                : dataType === 'link'
                ? 'link'
                : 'image',
            date: item?.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : 'Unknown',
            sender:
              otherUser && item?.userId !== userId
                ? `${otherUser.firstname} ${otherUser.surname}`.trim()
                : item?.userId === userId
                ? 'Bạn'
                : 'Unknown',
            userId: item?.userId || 'unknown',
          }));
        })
        .filter((item) => item.linkURL);
    },
    [otherUser, userId]
  );

  /**
   * Handle socket events and data updates.
   */
  useEffect(() => {
    if (!socket || !conversationId || !isVisible) return;

    fetchData();

    const handleDataUpdate = (key: 'images' | 'files' | 'links', type: string) => (items: any[]) => {
      setData((prev) => ({
        ...prev,
        [key]: formatData(items, type),
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
  }, [socket, conversationId, isVisible, fetchData, onDelete, onDataUpdated, formatData]);

  /**
   * Pause videos when switching full-screen mode.
   */
  useEffect(() => {
    if (fullScreenMedia) {
      Object.values(gridVideoRefs.current).forEach((ref) => ref?.pauseAsync().catch(() => {}));
    } else {
      fullScreenVideoRef.current?.pauseAsync().catch(() => {});
    }
  }, [fullScreenMedia]);

  /**
   * Delete selected items using socket event.
   */
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

      const deletionPromises = selectedItems.map((item) =>
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
            isMessageDeleted: results.find((r: any) => r.item.messageId === item.messageId && r.item.urlIndex === item.urlIndex)?.isMessageDeleted || false,
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

  /**
   * Download media or file to the device.
   */
  const downloadMedia = useCallback(async (url: string, type: string, filename?: string) => {
    try {
      const fileName = filename || url.split('/').pop() || (type === 'image' ? 'image.jpg' : type === 'video' ? 'video.mp4' : 'file');
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
  }, []);

  /**
   * Open a downloaded file on the device.
   */
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

  /**
   * Get MIME type based on file extension.
   */
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

  /**
   * Open a URL in the browser.
   */
  const handleOpenLink = useCallback((linkURL: string) => {
    if (!linkURL || linkURL === '#') {
      Alert.alert('Lỗi', 'Liên kết không hợp lệ.');
      return;
    }
    Linking.openURL(linkURL).catch(() => Alert.alert('Lỗi', 'Không thể mở liên kết.'));
  }, []);

  /**
   * Filter and sort data based on active tab, sender, date, and search.
   */
  const filteredData = useMemo(() => {
    const currentData = activeTab === 'images' ? data.images : activeTab === 'files' ? data.files : data.links;
    return currentData
      .filter((item) => {
        if (filterSender !== 'All' && item.sender !== filterSender) return false;
        if (startDate && new Date(item.date) < new Date(startDate)) return false;
        if (endDate && new Date(item.date) > new Date(endDate)) return false;
        if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeTab, data, filterSender, startDate, endDate, searchText]);

  /**
   * Get unique senders for filtering.
   */
  const uniqueSenders = useMemo(() => {
    const senders = new Set<string>();
    [...data.images, ...data.files, ...data.links].forEach((item) => senders.add(item.sender));
    return ['All', ...Array.from(senders)];
  }, [data]);

  /**
   * Toggle selection of an item.
   */
  const toggleSelectItem = useCallback((item: Media) => {
    setSelectedItems((prev) =>
      prev.some((selected) => selected.id === item.id)
        ? prev.filter((selected) => selected.id !== item.id)
        : [...prev, item]
    );
  }, []);

  /**
   * Handle swiper index change.
   */
  const handleSwipe = useCallback((index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(filteredData[index]);
  }, [filteredData]);

  /**
   * Debounced search handler.
   */
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
          {['images', 'files', 'links'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as 'images' | 'files' | 'links')}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'images' ? 'Hình ảnh/Video' : tab === 'files' ? 'Tệp' : 'Liên kết'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm theo tên..."
              value={searchText}
              onChangeText={handleSearch}
            />
          </View>
          <View style={styles.filterRow}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filterSender}
                onValueChange={setFilterSender}
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
              <Text style={styles.dateFilterText}>Lọc theo ngày</Text>
            </TouchableOpacity>
          </View>
          {showDateFilter && (
            <View style={styles.dateFilterContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="Ngày bắt đầu (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
              />
              <TextInput
                style={styles.dateInput}
                placeholder="Ngày kết thúc (YYYY-MM-DD)"
                value={endDate}
                onChangeText={setEndDate}
              />
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => {
                  setStartDate('');
                  setEndDate('');
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
          {isSelecting && selectedItems.length > 0 && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSelected}>
              <Text style={styles.deleteButtonText}>Xóa ({selectedItems.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.contentContainer} contentContainerStyle={{ paddingBottom: 20 }}>
          {filteredData.length === 0 ? (
            <Text style={styles.noDataText}>Không có {activeTab === 'images' ? 'hình ảnh/video' : activeTab === 'files' ? 'tệp' : 'liên kết'}.</Text>
          ) : (
            <View style={activeTab === 'images' ? styles.grid : styles.list}>
              {filteredData.map((item) => (
                <View key={item.id} style={activeTab === 'images' ? styles.gridItem : styles.listItem}>
                  {isSelecting && (
                    <TouchableOpacity
                      style={styles.selectCheckbox}
                      onPress={() => toggleSelectItem(item)}
                    >
                      <Ionicons
                        name={selectedItems.some((selected) => selected.id === item.id) ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={selectedItems.some((selected) => selected.id === item.id) ? '#007bff' : '#666'}
                      />
                    </TouchableOpacity>
                  )}
                  {activeTab === 'images' && (
                    <TouchableOpacity onPress={() => setFullScreenMedia(item)}>
                      {item.type === 'image' ? (
                        <Image source={{ uri: item.linkURL }} style={styles.mediaItem} />
                      ) : (
                        <>
                          <Video
                            ref={(ref) => (gridVideoRefs.current[item.id] = ref)}
                            source={{ uri: item.linkURL }}
                            style={styles.mediaItem}
                            isMuted={true}
                            resizeMode="cover"
                          />
                          <View style={styles.playIconContainer}>
                            <Ionicons name="play-circle-outline" size={30} color="#fff" />
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
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
                        <Text style={styles.linkMeta}>
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
                style={styles.downloadButton}
                onPress={() => downloadMedia(fullScreenMedia.linkURL, fullScreenMedia.type, fullScreenMedia.name)}
              >
                <Ionicons name="download-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <Swiper
                index={currentIndex}
                onIndexChanged={handleSwipe}
                loop={false}
                showsPagination={false}
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
                        />
                      ) : (
                        <Video
                          ref={item.id === fullScreenMedia.id ? fullScreenVideoRef : null}
                          source={{ uri: item.linkURL }}
                          style={styles.fullScreenMedia}
                          useNativeControls
                          resizeMode="contain"
                        />
                      )}
                      <Text style={styles.mediaName}>{item.name}</Text>
                    </View>
                  ))}
              </Swiper>
            </View>
          )}
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { margin: 0, justifyContent: 'flex-end' },
  container: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 10, borderTopRightRadius: 10, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#007bff' },
  tabText: { fontSize: 14, color: '#666' },
  activeTabText: { color: '#007bff', fontWeight: '600' },
  filterContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 5, paddingHorizontal: 10, marginBottom: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 40, fontSize: 14 },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerContainer: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 5, marginRight: 10 },
  picker: { height: 40, fontSize: 14 },
  dateFilterButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f0ff', padding: 10, borderRadius: 5 },
  dateFilterText: { marginLeft: 5, color: '#007bff', fontSize: 14 },
  dateFilterContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  dateInput: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 5, fontSize: 14 },
  clearDateButton: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 },
  clearDateText: { color: '#333', fontSize: 14 },
  actionContainer: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', justifyContent: 'space-between' },
  actionButton: { padding: 10, backgroundColor: '#e0e0e0', borderRadius: 5 },
  actionButtonActive: { backgroundColor: '#007bff' },
  actionButtonText: { color: '#333', fontSize: 14 },
  deleteButton: { padding: 10, backgroundColor: '#ff4444', borderRadius: 5 },
  deleteButtonText: { color: '#fff', fontSize: 14 },
  contentContainer: { flex: 1, padding: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  list: { gap: 10 },
  gridItem: { width: '30%', position: 'relative' },
  listItem: { position: 'relative' },
  mediaItem: { width: '100%', height: 100, borderRadius: 5 },
  fileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5 },
  fileIcon: { marginRight: 10 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600' },
  fileMeta: { fontSize: 12, color: '#666' },
  downloadButton: { padding: 5 },
  linkItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5 },
  linkInfo: { flex: 1 },
  linkName: { fontSize: 14, fontWeight: '600' },
  linkUrl: { fontSize: 12, color: '#007bff' },
  linkMeta: { fontSize: 12, color: '#666' },
  linkActionButton: { padding: 5 },
  selectCheckbox: { position: 'absolute', top: 5, left: 5, zIndex: 10 },
  playIconContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  fullScreenModal: { margin: 0 },
  fullScreenContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullScreenMedia: { width: '100%', height: '90%' },
  closeButton: { position: 'absolute', top: 16, left: 16, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  downloadButton: { position: 'absolute', top: 16, right: 16, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  swiperSlide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mediaName: { color: '#fff', fontSize: 16, marginTop: 10, textAlign: 'center', position: 'absolute', bottom: 20 },
  noDataText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
});

export default StoragePage;