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
  Linking,
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [data, setData] = useState<{
    images: Media[];
    files: Media[];
    links: Media[];
  }>({
    images: [],
    files: [],
    links: [],
  });

  // Xóa thông báo sau 3 giây
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Tải dữ liệu từ API
  useEffect(() => {
    if (!conversationId || !isVisible) return;

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
        setNotification({ type: 'error', message: 'Không thể tải dữ liệu.' });
        Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
        setData({ images: [], files: [], links: [] });
      }
    };

    fetchData();
  }, [conversationId, isVisible]);

  // Xử lý xóa các mục đã chọn
  const handleDeleteSelected = async () => {
    try {
      for (const item of selectedItems) {
        await Api_chatInfo.deleteChatItem(conversationId, item.id);
      }

      setData((prevData) => ({
        ...prevData,
        [activeTab]: prevData[activeTab].filter(
          (dataItem) => !selectedItems.some((selected) => selected.id === dataItem.id)
        ),
      }));

      setSelectedItems([]);
      setIsSelecting(false);
      setNotification({ type: 'success', message: `Đã xóa ${selectedItems.length} mục.` });
      Alert.alert('Thành công', `Đã xóa ${selectedItems.length} mục.`);
    } catch (error) {
      console.error('Lỗi khi xóa mục:', error);
      setNotification({ type: 'error', message: 'Không thể xóa các mục.' });
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

  // Tải xuống media (ảnh, video) và lưu vào thư viện
  const downloadMedia = async (url: string, type: 'image' | 'video', name: string) => {
    try {
      const fileName = url.split('/').pop() || (type === 'image' ? `${name}.jpg` : `${name}.mp4`);
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.createAssetAsync(uri);
        setNotification({ type: 'success', message: `${type === 'image' ? 'Ảnh' : 'Video'} đã được lưu vào thư viện!` });
        Alert.alert('Thành công', `${type === 'image' ? 'Ảnh' : 'Video'} đã được lưu vào thư viện!`);
      } else {
        setNotification({ type: 'error', message: 'Không có quyền truy cập vào thư viện.' });
        Alert.alert('Lỗi', 'Không có quyền truy cập vào thư viện để lưu.');
      }
    } catch (error: any) {
      console.error(`Tải ${type} thất bại:`, error);
      setNotification({ type: 'error', message: `Không thể tải xuống ${type === 'image' ? 'ảnh' : 'video'}.` });
      Alert.alert('Lỗi', `Không thể tải xuống ${type === 'image' ? 'ảnh' : 'video'}. Vui lòng thử lại.`);
    }
  };

  // Tải xuống tệp tin và mở tệp
  const downloadMediaFile = async (url: string, name: string) => {
    try {
      const fileName = url.split('/').pop() || name || 'downloaded_file';
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);

      setNotification({ type: 'success', message: `Đã tải xuống "${fileName}".` });
      Alert.alert('Thành công', `Đã tải xuống "${fileName}".`, [
        { text: 'OK' },
        { text: 'Mở tệp', onPress: () => openFile(uri, fileName) },
      ]);
    } catch (error: any) {
      console.error('Lỗi khi tải file:', error);
      setNotification({ type: 'error', message: `Không thể tải xuống "${name}".` });
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
        const mimeType = getMimeTypeFromExtension(fileName);
        await Linking.openURL(contentUri);
      } else if (Platform.OS === 'ios') {
        await Linking.openURL(fileUri);
      }
    } catch (error: any) {
      console.error('Lỗi khi mở file:', error);
      setNotification({ type: 'error', message: `Không thể mở tệp "${fileName}".` });
      Alert.alert('Lỗi', `Không thể mở tệp "${fileName}". Hãy kiểm tra xem bạn đã cài đặt ứng dụng phù hợp để mở tệp này chưa.`);
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
                ? setFullScreenMedia(item)
                : activeTab === 'files'
                ? setPreviewFile(item)
                : Linking.openURL(item.linkURL).catch(() =>
                    Alert.alert('Lỗi', 'Không thể mở liên kết.')
                  )
            }
          >
            {activeTab === 'images' ? (
              <>
                {item.type === 'image' ? (
                  <Image source={{ uri: item.linkURL }} style={styles.mediaItem} />
                ) : (
                  <View style={styles.videoThumbnailContainer}>
                    <Image
                      source={{ uri: item.linkURL }}
                      style={styles.mediaItem}
                      onError={() => (
                        <Image
                          source={{
                            uri: 'https://placehold.co/80x80/000000/FFFFFF/png?text=Video',
                          }}
                          style={styles.mediaItem}
                        />
                      )}
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

        {notification && (
          <Text
            style={[
              styles.notificationText,
              { color: notification.type === 'success' ? 'green' : 'red' },
            ]}
          >
            {notification.message}
          </Text>
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
                {data.images.map((item) => (
                  <View key={item.id} style={styles.swiperSlide}>
                    {item.type === 'image' ? (
                      <Image
                        source={{ uri: item.linkURL }}
                        style={styles.fullScreenMedia}
                        resizeMode="contain"
                      />
                    ) : (
                      <Video
                        source={{ uri: item.linkURL }}
                        style={styles.fullScreenMedia}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        shouldPlay={currentIndex === data.images.findIndex((img) => img.id === item.id)}
                        onPlaybackStatusUpdate={(status) => {
                          if (!status.isLoaded && status.error) {
                            console.log('Video Error (Fullscreen):', status.error);
                          }
                        }}
                        onError={(error: any) => console.log('Video Error (Fullscreen):', error)}
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
                    downloadMedia(fullScreenMedia.linkURL, fullScreenMedia.type, fullScreenMedia.name)
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
                  Xem trước không được hỗ trợ đầy đủ trên thiết bị di động. Vui lòng tải xuống để xem.
                </Text>
                <Text style={styles.previewUrl}>{previewFile.linkURL}</Text>
              </View>
              <TouchableOpacity
                style={styles.previewDownloadButton}
                onPress={() => downloadMediaFile(previewFile.linkURL, previewFile.name)}
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
                data={filteredData.filter((item) => (item.date || 'Không xác định') === date)}
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
  notificationText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
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
    height: '90%',
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
    marginBottom: 20,
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
});

export default StoragePage;