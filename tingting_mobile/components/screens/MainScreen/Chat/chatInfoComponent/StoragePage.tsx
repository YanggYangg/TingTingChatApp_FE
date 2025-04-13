import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import DateTimePicker from '@react-native-community/datetimepicker'; // Thư viện mới để chọn ngày

interface Media {
  src: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  date?: string;
  sender?: string;
}
interface links {
  src: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  date?: string;
  sender?: string;
}

interface files {
  linkURL: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  date?: string;
  sender?: string;
}


interface Props {
  onClose: () => void;
  conversationId: string;
  isVisible: boolean;
  files: Media[];
}

const StoragePage: React.FC<Props> = ({ onClose, conversationId, isVisible, files }) => {
  const [activeTab, setActiveTab] = useState<"images" | "files" | "links">("images");
  const [filterSender, setFilterSender] = useState("Tất cả");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showDateSuggestions, setShowDateSuggestions] = useState(false);
  const [data, setData] = useState<{ images: Media[], files: Media[], links: Media[] }>({
    images: [],
    files: [],
    links: [],
  });
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [previewFile, setPreviewFile] = useState<Media | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const videoRefs = useRef<{ [key: string]: any }>({});

  // Mock Data
  const mockData = {
    images: files.length > 0
      ? files.map((item) => ({
          ...item,
          date: item.date || "2023-04-13",
          sender: item.sender || "Người dùng A",
        }))
      : [
          {
            src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
            name: "House 1",
            type: "image",
            date: "2023-04-13",
            sender: "Người dùng A",
          },
          {
            src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            name: "Big Buck Bunny",
            type: "video",
            date: "2023-04-13",
            sender: "Người dùng B",
          },
          {
            src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
            name: "Room 1",
            type: "image",
            date: "2023-04-12",
            sender: "Người dùng A",
          },
          {
            src: "https://images.unsplash.com/photo-1586023492125-27b2c04593d1",
            name: "Living Room",
            type: "image",
            date: "2023-04-11",
            sender: "Người dùng C",
          },
          {
            src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            name: "Elephants Dream",
            type: "video",
            date: "2023-04-10",
            sender: "Người dùng B",
          },
          {
            src: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c",
            name: "Kitchen",
            type: "image",
            date: "2023-04-09",
            sender: "Người dùng A",
          },
          {
            src: "https://images.unsplash.com/photo-1560448204-603b3ec8d7d7",
            name: "Bedroom",
            type: "image",
            date: "2023-04-08",
            sender: "Người dùng D",
          },
          {
            src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            name: "For Bigger Blazes",
            type: "video",
            date: "2023-04-07",
            sender: "Người dùng B",
          },
          {
            src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
            name: "House 2",
            type: "image",
            date: "2023-04-06",
            sender: "Người dùng A",
          },
          {
            src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            name: "For Bigger Escapes",
            type: "video",
            date: "2023-04-05",
            sender: "Người dùng B",
          },
          {
            src: "https://images.unsplash.com/photo-1586023492125-27b2c04593d1",
            name: "Living Room 2",
            type: "image",
            date: "2023-04-04",
            sender: "Người dùng C",
          },
          {
            src: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c",
            name: "Kitchen 2",
            type: "image",
            date: "2023-04-03",
            sender: "Người dùng A",
          },
        ],
    files: [
      {
        src: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        name: "Dummy.pdf",
        type: "file",
        date: "2023-04-13",
        sender: "Người dùng A",
      },
      {
        src: "https://file-examples.com/storage/fea80a4b6c66f5b1d0f2c2/2017/02/file-sample_100kB.doc",
        name: "Sample.doc",
        type: "file",
        date: "2023-04-12",
        sender: "Người dùng B",
      },
      {
        src: "https://file-examples.com/storage/fea80a4b6c66f5b1d0f2c2/2017/02/file_example_XLS_10.xls",
        name: "Sample.xls",
        type: "file",
        date: "2023-04-11",
        sender: "Người dùng C",
      },
      {
        src: "https://file-examples.com/storage/fea80a4b6c66f5b1d0f2c2/2017/02/file-sample_150kB.pdf",
        name: "Sample.pdf",
        type: "file",
        date: "2023-04-10",
        sender: "Người dùng A",
      },
      {
        src: "https://file-examples.com/storage/fea80a4b6c66f5b1d0f2c2/2017/02/file-sample_500kB.doc",
        name: "Document.doc",
        type: "file",
        date: "2023-04-09",
        sender: "Người dùng B",
      },
    ],
    links: [
      {
        src: "https://www.example.com/link1",
        name: "Example Link 1",
        type: "link",
        date: "2023-04-13",
        sender: "Người dùng A",
      },
      {
        src: "https://www.example.com/link2",
        name: "Example Link 2",
        type: "link",
        date: "2023-04-12",
        sender: "Người dùng B",
      },
      {
        src: "https://www.example.com/link3",
        name: "Example Link 3",
        type: "link",
        date: "2023-04-11",
        sender: "Người dùng C",
      },
      {
        src: "https://www.example.com/link4",
        name: "Example Link 4",
        type: "link",
        date: "2023-04-10",
        sender: "Người dùng A",
      },
    ],
  };

  useEffect(() => {
    setData(mockData);
  }, [conversationId, files]);

  const filteredData = (data[activeTab] || []).filter(
    (item: Media) =>
      (filterSender === "Tất cả" || (item.sender && item.sender === filterSender)) &&
      (!startDate || (item.date && new Date(item.date) >= startDate)) &&
      (!endDate || (item.date && new Date(item.date) <= endDate))
  );

  const getUniqueSenders = () =>
    ["Tất cả", ...new Set(data[activeTab].map((item: Media) => item.sender || "Không xác định"))];

  const handleDateFilter = (days: number) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    setStartDate(pastDate);
    setEndDate(today);
  };

  const downloadMediaFile = async (url: string, filename: string) => {
    try {
      let extension = '';
      if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
        extension = url.includes('.png') ? '.png' : '.jpg';
      } else if (url.includes('.mp4')) {
        extension = '.mp4';
      } else if (url.includes('.pdf')) {
        extension = '.pdf';
      } else if (url.includes('.doc')) {
        extension = '.doc';
      } else if (url.includes('.xls')) {
        extension = '.xls';
      } else {
        const nameParts = filename.split('.');
        extension = nameParts.length > 1 ? `.${nameParts[nameParts.length - 1]}` : '.bin';
      }

      const sanitizedFilename = filename.includes(extension) ? filename : `${filename}${extension}`;
      const fileUri = `${FileSystem.documentDirectory}${sanitizedFilename}`;
      
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert("Lỗi", "Không có quyền truy cập thư viện ảnh/video.");
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('StoragePage', asset, false);
      Alert.alert("Thành công", `Đã tải xuống và lưu: ${sanitizedFilename}`);
    } catch (error) {
      console.error("Lỗi tải xuống:", error);
      Alert.alert("Lỗi", "Không thể tải xuống file: " + error.message);
    }
  };

  const downloadMedia = async (url: string, filename: string) => {
    await downloadMediaFile(url, filename);
  };

  const handleSwipe = (index: number) => {
    Object.values(videoRefs.current).forEach((ref) => {
      if (ref) {
        ref.pauseAsync().catch((error: any) => {
          console.error("Lỗi khi tạm dừng video:", error);
        });
      }
    });

    setCurrentIndex(index);
    setFullScreenMedia(data.images[index]);

    const newItem = data.images[index];
    if (newItem.type === 'video' && videoRefs.current[newItem.src]) {
      videoRefs.current[newItem.src].playAsync().catch((error: any) => {
        console.error("Lỗi khi phát video:", error);
      });
    }
  };

  const DateFilter = () => (
    <View style={styles.dateFilterContainer}>
      <TouchableOpacity
        style={styles.dateSuggestionButton}
        onPress={() => setShowDateSuggestions(!showDateSuggestions)}
      >
        <Text style={styles.dateSuggestionText}>Gợi ý thời gian</Text>
      </TouchableOpacity>
      {showDateSuggestions && (
        <View style={styles.dateSuggestions}>
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
      <View style={styles.datePickerContainer}>
        <Text style={styles.datePickerLabel}>Chọn khoảng thời gian</Text>
        <View style={styles.datePickerRow}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.datePickerText}>
              {startDate ? startDate.toISOString().split("T")[0] : "Từ ngày"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.datePickerText}>
              {endDate ? endDate.toISOString().split("T")[0] : "Đến ngày"}
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
            if (selectedDate) {
              setStartDate(selectedDate);
            }
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
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );

  const DateSection = ({ date, data: dateData, allImages }: { date: string; data: Media[]; allImages: Media[] }) => (
    <View style={styles.dateSection}>
      <Text style={styles.dateSectionTitle}>
        Ngày {date === "Không xác định" ? "Không xác định" : date.split("-").reverse().join(" Tháng ")}
      </Text>
      <View style={activeTab === "images" ? styles.grid : styles.list}>
        {dateData.filter((item: Media) => (item.date || "Không xác định") === date).map((item: Media, index: number) => (
          <View key={`${item.src}-${index}`} style={styles.itemContainer}>
            {activeTab === "images" ? (
              <TouchableOpacity onPress={() => {
                setFullScreenMedia(item);
                const index = allImages.findIndex((i) => i.src === item.src);
                if (index !== -1) {
                  setCurrentIndex(index);
                }
              }}>
                {item.type === 'image' ? (
                  <Image
                    source={{ uri: item.src }}
                    style={styles.mediaItem}
                    onError={(e) => console.log("Error loading image:", e.nativeEvent.error)}
                  />
                ) : (
                  <View style={styles.videoThumbnailContainer}>
                    <Image
                      source={{ uri: 'https://placehold.co/80x80/000000/FFFFFF/png?text=Video' }}
                      style={styles.mediaItem}
                      onError={(e) => console.log("Error loading placeholder:", e.nativeEvent.error)}
                    />
                    <View style={styles.playIconOverlay}>
                      <Ionicons name="play-circle-outline" size={30} color="#fff" accessibilityLabel="Phát video" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ) : activeTab === "files" ? (
              <View style={styles.fileItem}>
                <TouchableOpacity onPress={() => setPreviewFile(item)}>
                  <Text style={styles.fileName}>{item.name || "Không có tên"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => downloadMedia(item.src, item.name)}>
                  <Ionicons name="download-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.linkItem}>
                <View style={styles.linkContent}>
                  <Text style={styles.linkUrl}>{item.src}</Text>
                </View>
              </View>
            )}
          </View>
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
        </View>

        <View style={styles.tabContainer}>
          {["images", "files", "links"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab as "images" | "files" | "links")}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === "images" ? "Ảnh/Video" : tab === "files" ? "Files" : "Links"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Modal
          isVisible={!!fullScreenMedia}
          onBackdropPress={() => {
            Object.values(videoRefs.current).forEach((ref) => {
              if (ref) {
                ref.pauseAsync().catch((error: any) => {
                  console.error("Lỗi khi tạm dừng video:", error);
                });
              }
            });
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
                  <View key={`${item.src}-${index}`} style={styles.swiperSlide}>
                    {item.type === 'image' ? (
                      <Image
                        source={{ uri: item.src }}
                        style={styles.fullScreenMedia}
                        resizeMode="contain"
                        onError={(e) => console.log("Error loading image:", e.nativeEvent.error)}
                      />
                    ) : (
                      <Video
                        ref={(ref) => (videoRefs.current[item.src] = ref)}
                        source={{ uri: item.src }}
                        style={styles.fullScreenMedia}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        shouldPlay={currentIndex === index}
                        onPlaybackStatusUpdate={(status) => {
                          if (!status.isLoaded && status.error) {
                            console.log("Video Error (Fullscreen):", status.error);
                          }
                        }}
                        onError={(error: any) => console.log("Video Error (Fullscreen):", error)}
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
                    Object.values(videoRefs.current).forEach((ref) => {
                      if (ref) {
                        ref.pauseAsync().catch((error: any) => {
                          console.error("Lỗi khi tạm dừng video:", error);
                        });
                      }
                    });
                    setFullScreenMedia(null);
                    setCurrentIndex(0);
                  }}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => downloadMediaFile(fullScreenMedia.src, fullScreenMedia.name)}
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
                onPress={() => downloadMedia(previewFile.src, previewFile.name)}
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
              {getUniqueSenders().map((sender) => (
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
          {[...new Set(filteredData.map((item: Media) => item.date || "Không xác định"))]
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map((date: string) => (
              <DateSection key={date} date={date} data={filteredData} allImages={data.images} />
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
  dateSuggestionButton: {
    padding: 8,
  },
  dateSuggestionText: {
    fontSize: 14,
    fontWeight: '600',
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