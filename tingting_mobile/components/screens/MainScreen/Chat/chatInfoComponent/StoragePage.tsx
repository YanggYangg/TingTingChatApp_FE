import React, { useState, useMemo } from 'react';
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

interface Media {
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

  // Thêm state cho tính năng chọn/xóa
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<Media[]>([]);

  // Mock Data bên trong StoragePage
  const mockData = {
    images: [
      {
        src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
        name: 'House 1',
        type: 'image' as const,
        date: '2025-04-13',
        sender: 'Người dùng A',
      },
      {
        src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        name: 'Big Buck Bunny',
        type: 'video' as const,
        date: '2025-04-13',
        sender: 'Người dùng B',
      },
      {
        src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
        name: 'Room 1',
        type: 'image' as const,
        date: '2025-04-12',
        sender: 'Người dùng A',
      },
    ],
    files: [
      {
        src: 'https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx',
        name: 'File1.pdf',
        type: 'file' as const,
        date: '2025-04-10',
        sender: 'Người dùng A',
      },
      {
        src: 'https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx',
        name: 'File2.doc',
        type: 'file' as const,
        date: '2025-04-09',
        sender: 'Người dùng B',
      },
    ],
    links: [
      {
        src: 'https://example.com/link1',
        name: 'Link 1',
        type: 'link' as const,
        date: '2025-04-10',
        sender: 'Người dùng A',
      },
      {
        src: 'https://example.com/link2',
        name: 'Link 2',
        type: 'link' as const,
        date: '2025-04-09',
        sender: 'Người dùng B',
      },
    ],
  };

  // Hàm xử lý xóa các mục đã chọn
  const handleDeleteSelected = () => {
    const newData = { ...mockData };
    selectedItems.forEach((item) => {
      newData[activeTab] = newData[activeTab].filter((dataItem) => dataItem.src !== item.src);
    });
    mockData[activeTab] = newData[activeTab]; // Cập nhật lại mockData
    setSelectedItems([]);
    setIsSelecting(false);
    Alert.alert('Thành công', `Đã xóa ${selectedItems.length} mục.`);
  };

  // Hàm xử lý chọn/bỏ chọn mục
  const toggleSelectItem = (item: Media) => {
    if (selectedItems.some((selected) => selected.src === item.src)) {
      setSelectedItems(selectedItems.filter((selected) => selected.src !== item.src));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const filteredData = useMemo(() => {
    const items = mockData[activeTab] || [];
    return items.filter(
      (item: Media) =>
        (filterSender === 'Tất cả' || item.sender === filterSender) &&
        (!startDate || (item.date && new Date(item.date) >= startDate)) &&
        (!endDate || (item.date && new Date(item.date) <= endDate))
    );
  }, [mockData, activeTab, filterSender, startDate, endDate]);

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
    try {
      const extensionMap: { [key: string]: string } = {
        '.jpg': '.jpg',
        '.jpeg': '.jpg',
        '.png': '.png',
        '.mp4': '.mp4',
        '.pdf': '.pdf',
        '.doc': '.doc',
        '.xls': '.xls',
      };

      let extension = '.bin';
      for (const [key, value] of Object.entries(extensionMap)) {
        if (url.includes(key)) {
          extension = value;
          break;
        }
      }

      if (extension === '.bin') {
        const nameParts = filename.split('.');
        extension = nameParts.length > 1 ? `.${nameParts[nameParts.length - 1]}` : '.bin';
      }

      const sanitizedFilename = filename.includes(extension) ? filename : `${filename}${extension}`;
      const fileUri = `${FileSystem.documentDirectory}${sanitizedFilename}`;

      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Lỗi', 'Không có quyền truy cập thư viện ảnh/video.');
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('StoragePage', asset, false);
      Alert.alert('Thành công', `Đã tải xuống và lưu: ${sanitizedFilename}`);
    } catch (error) {
      console.error('Lỗi tải xuống:', error);
      Alert.alert('Lỗi', `Không thể tải xuống file: ${error.message}`);
    }
  };

  const handleSwipe = (index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(mockData.images[index]);
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
              key={`${item.src}-${index}`}
              style={[
                styles.itemContainer,
                isSelecting && selectedItems.some((selected) => selected.src === item.src)
                  ? styles.selectedItem
                  : null,
              ]}
              onPress={() =>
                isSelecting ? toggleSelectItem(item) : activeTab === 'images' ? setFullScreenMedia(item) : setPreviewFile(item)
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
                      selectedItems.some((selected) => selected.src === item.src)
                        ? 'checkbox'
                        : 'checkbox-outline'
                    }
                    size={24}
                    color={
                      selectedItems.some((selected) => selected.src === item.src)
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
                {mockData.images.map((item, index) => (
                  <View key={`${item.src}-${index}`} style={styles.swiperSlide}>
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
              {getUniqueSenders(mockData[activeTab]).map((sender) => (
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
                allImages={mockData.images}
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