import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Api_chatInfo} from '../../../../../apis/Api_chatInfo';

interface Media {
  id: string; // Thêm id để hỗ trợ xóa
  src: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  date?: string;
  sender?: string;
}

interface Props {
  conversationId: string;
  isVisible: boolean;
  onClose: () => void;
}

const StoragePage: React.FC<Props> = ({ conversationId, isVisible, onClose }) => {
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
  const [previewFile, setPreviewFile] = useState<Media | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Media[]>([]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  

  // State để lưu dữ liệu từ API
  const [data, setData] = useState<{
    images: Media[];
    files: Media[];
    links: Media[];
  }>({
    images: [],
    files: [],
    links: [],
  });

  // Lấy dữ liệu từ API khi component mount hoặc conversationId thay đổi
  useEffect(() => {
    if (!conversationId || !isVisible) return;

    const fetchData = async () => {
      try {
        // Lấy media (ảnh và video)
        const mediaResponse = await Api_chatInfo.getChatMedia(conversationId);
        const mediaData = Array.isArray(mediaResponse) ? mediaResponse : mediaResponse?.data?.media || [];
        const images = mediaData
          .filter((item: any) => item.messageType === 'image' || item.messageType === 'video')
          .map((item: any) => ({
            id: item._id,
            src: item.linkURL,
            name: item.content || 'Không có tiêu đề',
            type: item.messageType as 'image' | 'video',
            date: item.createdAt?.split('T')[0] || 'Không có ngày',
            sender: item.userId || 'Không rõ người gửi',
          }));

        // Lấy files
        const filesResponse = await Api_chatInfo.getChatFiles(conversationId);
        const filesData = Array.isArray(filesResponse) ? filesResponse : filesResponse?.data?.files || [];
        const files = filesData
          .filter((item: any) => item.messageType === 'file')
          .map((item: any) => ({
            id: item._id,
            src: item.linkURL,
            name: item.content || 'Không có tiêu đề',
            type: 'file' as const,
            date: item.createdAt?.split('T')[0] || 'Không có ngày',
            sender: item.userId || 'Không rõ người gửi',
          }));

        // Lấy links
        const linksResponse = await Api_chatInfo.getChatLinks(conversationId);
        const linksData = Array.isArray(linksResponse) ? linksResponse : linksResponse?.data?.links || [];
        const links = linksData
          .filter((item: any) => item.messageType === 'link')
          .map((item: any) => ({
            id: item._id,
            src: item.linkURL,
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

    fetchData();
  }, [conversationId, isVisible]);

  // Hàm xử lý xóa các mục đã chọn
  const handleDeleteSelected = async () => {
    try {
      // Gọi API để xóa từng mục
      for (const item of selectedItems) {
        await Api_chatInfo.deleteChatItem(conversationId, item.id);
      }

      // Cập nhật lại dữ liệu sau khi xóa
      setData((prevData) => ({
        ...prevData,
        [activeTab]: prevData[activeTab].filter(
          (dataItem) => !selectedItems.some((selected) => selected.id === dataItem.id)
        ),
      }));

      setSelectedItems([]);
      setIsSelecting(false);
      Alert.alert('Thành công', `Đã xóa ${selectedItems.length} mục.`);
    } catch (error) {
      console.error('Lỗi khi xóa mục:', error);
      Alert.alert('Lỗi', 'Không thể xóa các mục. Vui lòng thử lại.');
    }
  };

  // Hàm xử lý chọn/bỏ chọn mục
  const toggleSelectItem = (item: Media) => {
    if (selectedItems.some((selected) => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter((selected) => selected.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const filteredData = useMemo(() => {
    const items = data[activeTab] || [];
    return items.filter(
      (item: Media) =>
        (filterSender === 'Tất cả' || item.sender === filterSender) &&
        (!startDate || (item.date && new Date(item.date) >= startDate)) &&
        (!endDate || (item.date && new Date(item.date) <= endDate))
    );
  }, [data, activeTab, filterSender, startDate, endDate]);

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

  const downloadMediaFile = async (url: string, filename: string) => {
    if (isDownloading) {
      Alert.alert('Thông báo', 'Đang tải file khác, vui lòng đợi.');
      return;
    }

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert('Lỗi', 'Không có kết nối mạng. Vui lòng kiểm tra lại.');
      return;
    }

    setIsDownloading(true);
    try {
      const extensionMap: { [key: string]: string } = {
        '.jpg': '.jpg',
        '.jpeg': '.jpg',
        '.png': '.png',
        '.mp4': '.mp4',
        '.mkv': '.mkv',
        '.pptx': '.pptx',
        '.docx': '.docx',
      };

      let extension = '.bin';
      for (const [key, value] of Object.entries(extensionMap)) {
        if (url.toLowerCase().includes(key)) {
          extension = value;
          break;
        }
      }

      if (extension === '.bin') {
        const nameParts = filename.split('.');
        extension = nameParts.length > 1 ? `.${nameParts[nameParts.length - 1]}` : '.bin';
      }

      const timestamp = new Date().getTime();
      const sanitizedFilename = filename.includes(extension)
        ? `${filename.split(extension)[0]}_${timestamp}${extension}`
        : `${filename}_${timestamp}${extension}`;
      const fileUri = `${FileSystem.documentDirectory}${sanitizedFilename}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Tiến trình tải: ${Math.round(progress * 100)}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      if (!uri) throw new Error('Tải xuống thất bại.');

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Lỗi', 'Không có quyền truy cập thư viện ảnh/video.');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('StoragePage', asset, false);
      Alert.alert('Thành công', `Đã lưu file: ${sanitizedFilename} vào album StoragePage.`);
    } catch (error) {
      console.error('Lỗi tải xuống:', error);
      Alert.alert('Lỗi', `Không thể tải file: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSwipe = (index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(data.images[index]);
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
    allImages,
  }: {
    date: string;
    data: Media[];
    allImages: Media[];
  }) => (
    <View style={styles.dateSection}>
      <Text style={styles.dateSectionTitle}>
        Ngày{' '}
        {date === 'Không xác định'
          ? 'Không xác định'
          : date.split('-').reverse().join(' Tháng ')}
      </Text>
      <View style={activeTab === 'images' ? styles.grid : styles.list}>
        {dateData
          .filter((item: Media) => (item.date || 'Không xác định') === date)
          .map((item: Media, index: number) => (
            <TouchableOpacity
              key={`${item.id}-${index}`}
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
                  ? setFullScreenMedia(item)
                  : setPreviewFile(item)
              }
            >
              {activeTab === 'images' ? (
                <>
                  {item.type === 'image' ? (
                    <Image
                      source={{ uri: item.src }}
                      style={styles.mediaItem}
                      onError={(e) =>
                        console.log('Error loading image:', e.nativeEvent.error)
                      }
                    />
                  ) : (
                    <View style={styles.videoThumbnailContainer}>
                      <Image
                        source={{
                          uri: 'https://placehold.co/80x80/000000/FFFFFF/png?text=Video',
                        }}
                        style={styles.mediaItem}
                        onError={(e) =>
                          console.log(
                            'Error loading placeholder:',
                            e.nativeEvent.error
                          )
                        }
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
                    <TouchableOpacity onPress={() => downloadMediaFile(item.src, item.name)}>
                      <Ionicons name="download-outline" size={24} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.linkItem}>
                  <View style={styles.linkContent}>
                    <Text style={styles.linkUrl}>{item.src}</Text>
                  </View>
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
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      useNativeDriver
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kho lưu trữ</Text>
          <View style={styles.selectionContainer}>
            {isSelecting ? (
              <>
                <TouchableOpacity onPress={handleDeleteSelected}>
                  <Text style={styles.deleteButton}>
                    Xóa ({selectedItems.length})
                  </Text>
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

        <View style={styles.tabContainer}>
          {(['images', 'files', 'links'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab);
                setIsSelecting(false);
                setSelectedItems([]);
              }}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab === 'images' ? 'Ảnh/Video' : tab === 'files' ? 'Files' : 'Links'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Modal
          isVisible={!!fullScreenMedia}
          onBackdropPress={() => {
            setFullScreenMedia(null);
            setCurrentIndex(0);
          }}
          style={styles.modal}
          useNativeDriver
        >
          {fullScreenMedia && (
            <View style={styles.fullScreenContainer}>
              <Swiper
                index={currentIndex}
                onIndexChanged={handleSwipe}
                loop={false}
                showsPagination={false}
              >
                {data.images.map((item, index) => (
                  <View key={`${item.id}-${index}`} style={styles.swiperSlide}>
                    {item.type === 'image' ? (
                      <Image
                        source={{ uri: item.src }}
                        style={styles.fullScreenMedia}
                        resizeMode="contain"
                        onError={(e) =>
                          console.log('Error loading image:', e.nativeEvent.error)
                        }
                      />
                    ) : (
                      <Video
                        source={{ uri: item.src }}
                        style={styles.fullScreenMedia}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        shouldPlay={currentIndex === index}
                        onPlaybackStatusUpdate={(status) => {
                          if (!status.isLoaded && status.error) {
                            console.log('Video Error (Fullscreen):', status.error);
                          }
                        }}
                        onError={(error: any) =>
                          console.log('Video Error (Fullscreen):', error)
                        }
                      />
                    )}
                    <Text style={styles.mediaName}>{item.name}</Text>
                  </View>
                ))}
              </Swiper>
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    setFullScreenMedia(null);
                    setCurrentIndex(0);
                  }}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    downloadMediaFile(fullScreenMedia.src, fullScreenMedia.name)
                  }
                >
                  <Ionicons name="download-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>

        <Modal
          isVisible={!!previewFile}
          onBackdropPress={() => setPreviewFile(null)}
          style={styles.modal}
          useNativeDriver
        >
          {previewFile && (
            <View style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>Xem nội dung</Text>
                <TouchableOpacity onPress={() => setPreviewFile(null)}>
                  <Ionicons name="close-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewPlaceholder}>
                  Preview not fully supported on mobile. Please download to view.
                </Text>
                <Text style={styles.previewUrl}>{previewFile.src}</Text>
              </View>
              <TouchableOpacity
                style={styles.previewDownloadButton}
                onPress={() => downloadMediaFile(previewFile.src, previewFile.name)}
              >
                <Text style={styles.downloadText}>Tải xuống</Text>
              </TouchableOpacity>
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
          {[...new Set(filteredData.map((item: Media) => item.date || 'Không xác định'))]
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map((date: string) => (
              <DateSection
                key={date}
                date={date}
                data={filteredData}
                allImages={data.images}
              />
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
  },
  swiperSlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMedia: {
    width: '100%',
    height: '100%',
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
    backgroundColor: '#4B5563',
    borderRadius: 20,
    padding: 8,
  },
  mediaName: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  previewUrl: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 8,
    textAlign: 'center',
  },
  previewDownloadButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 5,
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    flex: 1,
    gap: 8,
  },
  linkContent: {
    flex: 1,
  },
  linkUrl: {
    fontSize: 12,
    color: '#3B82F6',
  },
});

export default StoragePage;