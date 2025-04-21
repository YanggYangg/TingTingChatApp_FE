import React, { useState, useEffect, useMemo, useRef } from 'react';
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
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';

interface Media {
  id: string;
  linkURL: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  date?: string;
  sender?: string;
  userId: String;
}

interface Props {
  conversationId: string;
  userId: string;
  isVisible: boolean;
  onClose: () => void;
  onDataUpdated?: () => void; // Callback để thông báo cập nhật dữ liệu
}

const StoragePage: React.FC<Props> = ({ conversationId, userId, isVisible, onClose, onDataUpdated }) => {
  const [activeTab, setActiveTab] = useState<'images' | 'files' | 'links'>('images');
  const [filterSender, setFilterSender] = useState<string>('Tất cả');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState<boolean>(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Media[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);
  const gridVideoRefs = useRef<Record<string, Video>>({});
  const fullScreenVideoRef = useRef<Video>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  const [data, setData] = useState<{
    images: Media[];
    files: Media[];
    links: Media[];
  }>({
    images: [],
    files: [],
    links: [],
  });

  // Hàm tải dữ liệu từ API
  const fetchData = async () => {
    try {
      const mediaResponse = await Api_chatInfo.getChatMedia(conversationId);
      const mediaData = Array.isArray(mediaResponse) ? mediaResponse : mediaResponse?.data?.media || [];
      const images = mediaData
        .filter((item: any) => item.messageType === 'image' || item.messageType === 'video')
        .map((item: any) => ({
          id: item._id,
          linkURL: item.linkURL,
          name: item.content || 'Không có tiêu đề',
          type: item.messageType as 'image' | 'video',
          date: item.createdAt?.split('T')[0] || 'Không có ngày',
          sender: item.userId || 'Không rõ người gửi',
        }));

      const filesResponse = await Api_chatInfo.getChatFiles(conversationId);
      const filesData = Array.isArray(filesResponse) ? filesResponse : filesResponse?.data?.files || [];
      const files = filesData
        .filter((item: any) => item.messageType === 'file')
        .map((item: any) => ({
          id: item._id,
          linkURL: item.linkURL,
          name: item.content || 'Không có tiêu đề',
          type: 'file' as const,
          date: item.createdAt?.split('T')[0] || 'Không có ngày',
          sender: item.userId || 'Không rõ người gửi',
        }));

      const linksResponse = await Api_chatInfo.getChatLinks(conversationId);
      const linksData = Array.isArray(linksResponse) ? linksResponse : linksResponse?.data?.links || [];
      const links = linksData
        .filter((item: any) => item.messageType === 'link')
        .map((item: any) => ({
          id: item._id,
          linkURL: item.linkURL,
          name: item.content || 'Không có tiêu đề',
          type: 'link' as const,
          date: item.createdAt?.split('T')[0] || 'Không có ngày',
          sender: item.userId || 'Không rõ người gửi',
        }));

      setData({ images, files, links });
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
      setData({ images: [], files: [], links: [] });
    }
  };

  // Tải dữ liệu khi mở StoragePage
  useEffect(() => {
    if (!conversationId || !isVisible) return;
    fetchData();
  }, [conversationId, isVisible]);

  // Quản lý trạng thái video
  useEffect(() => {
    if (fullScreenMedia) {
      // Dừng tất cả video trong grid khi mở fullscreen
      Object.values(gridVideoRefs.current).forEach((ref) => {
        ref?.pauseAsync().catch(() => {});
      });
    } else {
      // Dừng video fullscreen khi đóng modal
      fullScreenVideoRef.current?.pauseAsync().catch(() => {});
      // Đảm bảo video trong grid không phát
      Object.values(gridVideoRefs.current).forEach((ref) => {
        ref?.pauseAsync().catch(() => {});
      });
    }
  }, [fullScreenMedia]);

  // Xử lý xóa các mục đã chọn
  const handleDeleteSelected = async () => {
    try {
      const messageIds = selectedItems.map(item => item.id);
      const response = await Api_chatInfo.deleteMessage({ messageIds });
  
      // Nếu Api_chatInfo.deleteMessage trả về JSON trực tiếp
      if (response?.message) { // Kiểm tra xem response có thuộc tính message không
        console.log('[DELETE] Phản hồi API (thành công):', response);
  
        // Cập nhật trạng thái và hiển thị thông báo thành công
        const updatedData = { ...data };
        ['images', 'files', 'links'].forEach(tab => {
          updatedData[tab] = updatedData[tab].filter(item => !selectedItems.some(selected => selected.id === item.id));
        });
        setData(updatedData);
        setSelectedItems([]);
        setIsSelecting(false);
        Alert.alert('Thành công', response.message || `Đã xóa ${selectedItems.length} mục.`);
  
        if (onDataUpdated) {
          onDataUpdated();
        }
      } else {
        console.error('[DELETE] Phản hồi API không mong đợi:', response);
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa. Phản hồi không hợp lệ.');
      }
  
    } catch (error) {
      console.error('Lỗi khi xóa mục:', error);
      Alert.alert('Lỗi', 'Không thể xóa các mục. Vui lòng thử lại.');
    }
  };
  // Chọn/bỏ chọn mục
  const toggleSelectItem = (item: Media) => {
    if (selectedItems.some((selected) => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter((selected) => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Lọc dữ liệu
  const filteredData = useMemo(() => {
    const items = data[activeTab] || [];
    const filtered = items.filter(
      (item: Media) =>
        (filterSender === 'Tất cả' || item.sender === filterSender) &&
        (!startDate || (item.date && new Date(item.date) >= startDate)) &&
        (!endDate || (item.date && new Date(item.date) <= endDate)) &&
        (!isSearching ||
          item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.linkURL?.toLowerCase().includes(searchText.toLowerCase()))
    );
    console.log(`filteredData trong tab ${activeTab}:`, filtered);
    return filtered;
  }, [data, activeTab, filterSender, startDate, endDate, isSearching, searchText]);

  // Lấy danh sách media đã lọc cho tab "images" để sử dụng trong modal
  const filteredImages = useMemo(() => {
    return filteredData.filter((item: Media) => item.type === 'image' || item.type === 'video');
  }, [filteredData]);

  // Nhóm dữ liệu theo ngày để render
  const groupedData = useMemo(() => {
    const groups: { [key: string]: Media[] } = {};
    filteredData.forEach((item) => {
      const dateKey = item.date || 'Không xác định';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({ date, data: groups[date] }));
  }, [filteredData]);

  const getUniqueSenders = (items: Media[]): string[] => {
    const senders = items.map((item) => item.sender || 'Không xác định');
    return ['Tất cả', ...new Set(senders)];
  };

  const handleQuickDateFilter = (days: number) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    setStartDate(pastDate);
    setEndDate(today);
  };

  const handleResetDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // Tải xuống media (ảnh, video) và lưu vào thư viện
  const downloadMedia = async (url: string, type: 'image' | 'video', name: string) => {
    try {
      const fileName = url.split('/').pop() || (type === 'image' ? `${name}.jpg` : `${name}.mp4`);
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.createAssetAsync(uri);
        Alert.alert('Thành công', `${type === 'image' ? 'Ảnh' : 'Video'} đã được lưu vào thư viện!`);
      } else {
        Alert.alert('Lỗi', 'Không có quyền truy cập vào thư viện để lưu.');
      }
    } catch (error: any) {
      console.error(`Tải ${type} thất bại:`, error);
      Alert.alert('Lỗi', `Không thể tải xuống ${type === 'image' ? 'ảnh' : 'video'}. Vui lòng thử lại.`);
    }
  };

  // Tải xuống tệp tin và mở tệp
  const downloadMediaFile = async (url: string, name: string) => {
    try {
      const fileName = url.split('/').pop() || name || 'downloaded_file';
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      Alert.alert('Thành công', `Đã tải xuống "${fileName}".`, [
        { text: 'OK' },
        { text: 'Mở tệp', onPress: () => openFile(uri, fileName) },
      ]);
    } catch (error: any) {
      console.error('Lỗi khi tải file:', error);
      Alert.alert('Lỗi', `Không thể tải xuống "${name}". Vui lòng thử lại.`);
    }
  };

  const getMimeTypeFromExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'pdf':
        return 'application/pdf';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  };

  const openFile = async (fileUri: string, fileName: string) => {
    try {
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await Linking.openURL(contentUri);
      } else if (Platform.OS === 'ios') {
        await Linking.openURL(fileUri);
      }
    } catch (error: any) {
      console.error('Lỗi khi mở file:', error);
      Alert.alert('Lỗi', `Không thể mở tệp "${fileName}". Hãy kiểm tra xem bạn đã cài đặt ứng dụng phù hợp để mở tệp này chưa.`);
    }
  };

  const handleSwipe = (index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(filteredImages[index]);
    setVideoError(null);
    // Dừng video hiện tại trước khi chuyển slide
    fullScreenVideoRef.current?.pauseAsync().catch(() => {});
  };

  const openFullScreenMedia = (item: Media) => {
    const index = filteredImages.findIndex((media) => media.id === item.id);
    if (index !== -1) {
      setCurrentIndex(index);
      setFullScreenMedia(item);
    }
  };

  const DateFilter = () => (
    <View style={styles.dateFilterContainer}>
      <View style={styles.dateSuggestionHeader}>
        <TouchableOpacity
          style={styles.dateSuggestionButton}
          onPress={() => setShowDateSuggestions(!showDateSuggestions)}
        >
          <Text style={styles.dateSuggestionText}>Gợi ý thời gian</Text>
        </TouchableOpacity>
        {(startDate || endDate) && (
          <TouchableOpacity onPress={handleResetDateFilter}>
            <Text style={styles.resetFilterText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>
      {showDateSuggestions && (
        <View style={styles.dateSuggestions}>
          {[7, 30, 90].map((days) => (
            <TouchableOpacity
              key={days}
              style={styles.dateSuggestionItem}
              onPress={() => handleQuickDateFilter(days)}
            >
              <Text style={styles.dateSuggestionItemText}>{days} ngày trước</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.datePickerContainer}>
        <Text style={styles.datePickerLabel}>Chọn khoảng thời gian</Text>
        <View style={styles.datePickerRow}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.datePickerText}>
              {startDate ? startDate.toISOString().split('T')[0] : 'Từ ngày'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.datePickerText}>
              {endDate ? endDate.toISOString().split('T')[0] : 'Đến ngày'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}
    </View>
  );

  const DateSection = ({
    date,
    data: dateData,
  }: {
    date: string;
    data: Media[];
  }) => (
    <View style={styles.dateSection}>
      <Text style={styles.dateSectionTitle}>
        Ngày{' '}
        {date === 'Không xác định'
          ? 'Không xác định'
          : date.split('-').reverse().join(' Tháng ')}
      </Text>
      <View style={activeTab === 'images' ? styles.grid : styles.list}>
        {dateData.map((item: Media) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.itemContainer,
              isSelecting && selectedItems.some((selected) => selected.id === item.id)
                ? styles.selectedItem
                : null,
            ]}
            onPress={() =>
              isSelecting
                ? toggleSelectItem(item)
                : activeTab === 'images'
                ? openFullScreenMedia(item)
                : activeTab === 'files'
                ? downloadMediaFile(item.linkURL, item.name)
                : Linking.openURL(item.linkURL).catch(() => Alert.alert('Lỗi', 'Không thể mở liên kết.'))
            }
          >
            {activeTab === 'images' ? (
              <>
                {item.type === 'image' ? (
                  <Image source={{ uri: item.linkURL }} style={styles.mediaItem} />
                ) : (
                  <View style={styles.videoThumbnailContainer}>
                    <Video
                      ref={(ref) => (gridVideoRefs.current[item.id] = ref)}
                      source={{ uri: item.linkURL }}
                      style={styles.mediaItem}
                      useNativeControls={false}
                      isMuted={true}
                      resizeMode="cover"
                      isLooping
                      shouldPlay={false} // Không phát video trong grid
                      onError={(error) => console.error('Lỗi tải video nhỏ:', error)}
                    />
                    <View style={styles.playIconOverlay}>
                      <Ionicons
                        name="play-circle-outline"
                        size={30}
                        color="#fff"
                        accessibilityLabel="Phát video"
                      />
                    </View>
                  </View>
                )}
              </>
            ) : activeTab === 'files' ? (
              <View style={styles.fileItem}>
                <Text style={styles.fileName}>{item.name || 'Không có tên'}</Text>
                {!isSelecting && (
                  <TouchableOpacity onPress={() => downloadMediaFile(item.linkURL, item.name)}>
                    <Ionicons name="download-outline" size={24} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.linkItem}>
                <Text style={styles.linkUrl}>{item.linkURL}</Text>
              </View>
            )}
            {isSelecting && (
              <View style={styles.checkbox}>
                <Ionicons
                  name={
                    selectedItems.some((selected) => selected.id === item.id)
                      ? 'checkbox'
                      : 'checkbox-outline'
                  }
                  size={24}
                  color={
                    selectedItems.some((selected) => selected.id === item.id)
                      ? '#3B82F6'
                      : '#666'
                  }
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose} style={styles.modal} useNativeDriver>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kho lưu trữ</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setIsSearching(!isSearching)}>
              <Ionicons name="search" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <View style={styles.selectionContainer}>
              {isSelecting ? (
                <>
                  <TouchableOpacity onPress={handleDeleteSelected}>
                    <Text style={styles.deleteButton}>Xóa ({selectedItems.length})</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsSelecting(false);
                      setSelectedItems([]);
                    }}
                  >
                    <Text style={styles.cancelButton}>Hủy</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={() => setIsSelecting(true)}>
                  <Text style={styles.selectButton}>Chọn</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {isSearching && (
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder={`Tìm kiếm trong ${
                activeTab === 'images' ? 'ảnh/video' : activeTab === 'files' ? 'files' : 'links'
              }`}
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity onPress={() => setIsSearching(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabContainer}>
          {(['images', 'files', 'links'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab);
                setIsSelecting(false);
                setSelectedItems([]);
                setIsSearching(false);
                setSearchText('');
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'images' ? 'Ảnh/Video' : tab === 'files' ? 'Files' : 'Links'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Modal
          isVisible={!!fullScreenMedia}
          onBackdropPress={() => {
            setFullScreenMedia(null);
            setVideoError(null);
          }}
          style={styles.modal}
          useNativeDriver
        >
          {fullScreenMedia && (
            <View style={styles.fullScreenContainer}>
              <Swiper
                key={currentIndex}
                index={currentIndex}
                onIndexChanged={handleSwipe}
                loop={false}
                showsPagination={false}
              >
                {filteredImages.map((item) => (
                  <View key={item.id} style={styles.swiperSlide}>
                    {item.type === 'image' ? (
                      <Image
                        source={{ uri: item.linkURL }}
                        style={styles.fullScreenMedia}
                        resizeMode="contain"
                      />
                    ) : (
                      <>
                        {videoError ? (
                          <View style={styles.videoErrorContainer}>
                            <Text style={styles.videoErrorText}>
                              Không thể tải video: {videoError}
                            </Text>
                          </View>
                        ) : (
                          <Video
                            ref={fullScreenVideoRef}
                            source={{ uri: item.linkURL }}
                            style={styles.fullScreenVideo}
                            useNativeControls={false}
                            resizeMode="contain"
                            isLooping
                            shouldPlay={currentIndex === filteredImages.findIndex((img) => img.id === item.id)}
                            onPlaybackStatusUpdate={(status) => {
                              if (!status.isLoaded && status.error) {
                                setVideoError('Lỗi tải video.');
                                console.log('Video Error (Fullscreen):', item.linkURL, status.error);
                              }
                            }}
                            onError={(error: any) => {
                              setVideoError('Không thể phát video.');
                              console.log('Video Error (Fullscreen):', item.linkURL, error);
                            }}
                          />
                        )}
                        <Text style={styles.mediaName}>{item.name}</Text>
                      </>
                    )}
                  </View>
                ))}
              </Swiper>
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    setFullScreenMedia(null);
                    setVideoError(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    downloadMedia(fullScreenMedia.linkURL, fullScreenMedia.type, fullScreenMedia.name)
                  }
                >
                  <Ionicons name="download-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>

        <View style={styles.filterContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filterSender}
              onValueChange={(itemValue) => setFilterSender(itemValue)}
              style={styles.picker}
            >
              {getUniqueSenders(data[activeTab]).map((sender) => (
                <Picker.Item key={sender} label={sender} value={sender} />
              ))}
            </Picker>
          </View>
          <TouchableOpacity
            style={styles.dateFilterButton}
            onPress={() => setShowDateFilter(!showDateFilter)}
          >
            <Text style={styles.dateFilterButtonText}>Ngày gửi</Text>
          </TouchableOpacity>
        </View>

        {showDateFilter && <DateFilter />}

        <ScrollView style={styles.scrollView}>
          {groupedData.map(({ date, data }) => (
            <DateSection key={date} date={date} data={data} />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectButton: {
    fontSize: 14,
    color: '#3B82F6',
  },
  deleteButton: {
    fontSize: 14,
    color: '#EF4444',
  },
  cancelButton: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swiperSlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMedia: {
    width: '100%',
    height: '90%',
  },
  fullScreenVideo: {
    width: '100%',
    height: '90%',
    maxHeight: '100%',
  },
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 60,
  },
  iconButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  mediaName: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
  },
  picker: {
    height: 40,
    color: '#333',
  },
  dateFilterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateFilterButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dateFilterContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 8,
    marginBottom: 16,
  },
  dateSuggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateSuggestionButton: {
    padding: 8,
  },
  dateSuggestionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetFilterText: {
    fontSize: 14,
    color: '#3B82F6',
    padding: 8,
  },
  dateSuggestions: {
    marginTop: 8,
  },
  dateSuggestionItem: {
    padding: 8,
  },
  dateSuggestionItemText: {
    fontSize: 14,
    color: '#333',
  },
  datePickerContainer: {
    marginTop: 8,
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#333',
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 8,
    gap: 8,
  },
  datePickerText: {
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  dateSection: {
    marginBottom: 15,
  },
  dateSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  list: {
    gap: 8,
  },
  itemContainer: {
    position: 'relative',
  },
  selectedItem: {
    backgroundColor: '#E0F7FA',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 5,
  },
  checkbox: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  videoThumbnailContainer: {
    position: 'relative',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    zIndex: 10,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
  },
  fileName: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    flex: 1,
  },
  linkItem: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
  },
  linkUrl: {
    fontSize: 12,
    color: '#3B82F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
});

export default StoragePage;