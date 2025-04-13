import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import DatePicker from 'react-native-date-picker';
import { Picker } from '@react-native-picker/picker';

interface Media {
  url: string;
  date: string;
  sender: string;
  name: string;
  id: string;
  type: 'image' | 'video' | 'file' | 'link';
}

interface Props {
  onClose: () => void;
  conversationId: string;
  isVisible: boolean;
}

const StoragePage: React.FC<Props> = ({ onClose, conversationId, isVisible }) => {
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
  const [fullScreenImage, setFullScreenImage] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [previewFile, setPreviewFile] = useState<Media | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const videoRef = useRef<any>(null);

  // Mock Data with Unique IDs
  const mockData = {
    images: [
      {
        url: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        date: "2023-04-13",
        sender: "Người dùng A",
        name: "Image 1",
        id: "img1",
        type: "image",
      },
      {
        url: "https://www.w3schools.com/html/mov_bbb.mp4", // Updated URL for testing
        date: "2023-04-13",
        sender: "Người dùng B",
        name: "Video 1",
        id: "vid1",
        type: "video",
      },
      {
        url: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        date: "2023-04-12",
        sender: "Người dùng A",
        name: "Image 2",
        id: "img2",
        type: "image",
      },
      {
        url: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        date: "2023-04-13",
        sender: "Người dùng A",
        name: "Image 3",
        id: "img3",
        type: "image",
      },
      {
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        date: "2023-04-13",
        sender: "Người dùng B",
        name: "Video 2",
        id: "vid2",
        type: "video",
      },
      {
        url: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        date: "2023-04-12",
        sender: "Người dùng A",
        name: "Image 4",
        id: "img4",
        type: "image",
      },
      {
        url: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        date: "2023-04-13",
        sender: "Người dùng A",
        name: "Image 5",
        id: "img5",
        type: "image",
      },
      {
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        date: "2023-04-13",
        sender: "Người dùng B",
        name: "Video 3",
        id: "vid3",
        type: "video",
      },
      {
        url: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        date: "2023-04-12",
        sender: "Người dùng A",
        name: "Image 6",
        id: "img6",
        type: "image",
      },
      {
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        date: "2023-04-12",
        sender: "Người dùng B",
        name: "Video 4",
        id: "vid4",
        type: "video",
      },
    ],
    files: [
      {
        url: "https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx",
        date: "2023-04-13",
        sender: "Người dùng A",
        name: "Document.pdf",
        id: "file1",
        type: "file",
      },
      {
        url: "https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx",
        date: "2023-04-12",
        sender: "Người dùng B",
        name: "Report.docx",
        id: "file2",
        type: "file",
      },
    ],
    links: [
      {
        url: "https://example.com/link1",
        date: "2023-04-13",
        sender: "Người dùng A",
        name: "Link 1",
        id: "link1",
        type: "link",
      },
      {
        url: "https://example.com/link2",
        date: "2023-04-12",
        sender: "Người dùng B",
        name: "Link 2",
        id: "link2",
        type: "link",
      },
    ],
  };

  useEffect(() => {
    setData(mockData);
  }, [conversationId]);

  const filteredData = useMemo(() => {
    return (data[activeTab] || []).filter(
      ({ sender, date }) =>
        (filterSender === "Tất cả" || sender === filterSender) &&
        (!startDate || new Date(date) >= startDate) &&
        (!endDate || new Date(date) <= endDate)
    );
  }, [data, activeTab, filterSender, startDate, endDate]);

  const getUniqueSenders = () => ["Tất cả", ...new Set(data[activeTab].map((item) => item.sender))];

  const handleDateFilter = (days: number) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    setStartDate(pastDate);
    setEndDate(today);
  };

  const downloadMedia = async (url: string, filename: string) => {
    Alert.alert("Thông báo", `Tải xuống: ${filename}`);
  };

  useEffect(() => {
    if (fullScreenImage && fullScreenImage.type === 'video' && videoRef.current) {
      videoRef.current.playAsync().catch((error: any) => {
        console.error("Lỗi khi phát video:", error);
      });
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch((error: any) => {
          console.error("Lỗi khi tạm dừng video:", error);
        });
      }
    };
  }, [fullScreenImage]);

  useEffect(() => {
    if (fullScreenImage) {
      const index = data.images.findIndex((item) => item.id === fullScreenImage.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [fullScreenImage, data.images]);

  const handleSwipe = (index: number) => {
    if (videoRef.current) {
      videoRef.current.pauseAsync().catch((error: any) => {
        console.error("Lỗi khi tạm dừng video:", error);
      });
    }
    setCurrentIndex(index);
    setFullScreenImage(data.images[index]);
  };

  const handleDeleteSelected = () => {
    const newData = {
      images: data.images.filter((item) => !selectedItems.includes(item.id)),
      files: data.files.filter((item) => !selectedItems.includes(item.id)),
      links: data.links.filter((item) => !selectedItems.includes(item.id)),
    };
    setData(newData);
    setSelectedItems([]);
    setIsSelecting(false);
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
      <DatePicker
        modal
        open={showStartDatePicker}
        date={startDate || new Date()}
        onConfirm={(date) => {
          setShowStartDatePicker(false);
          setStartDate(date);
        }}
        onCancel={() => setShowStartDatePicker(false)}
        mode="date"
      />
      <DatePicker
        modal
        open={showEndDatePicker}
        date={endDate || new Date()}
        onConfirm={(date) => {
          setShowEndDatePicker(false);
          setEndDate(date);
        }}
        onCancel={() => setShowEndDatePicker(false)}
        mode="date"
      />
    </View>
  );

  const DateSection = ({ date, data }: { date: string; data: Media[] }) => (
    <View style={styles.dateSection}>
      <Text style={styles.dateSectionTitle}>
        Ngày {date.split("-").reverse().join(" Tháng ")}
      </Text>
      <View style={activeTab === "images" ? styles.imageGrid : styles.list}>
        {data.filter((item) => item.date === date).map((item, index) => (
          <View key={item.id + index} style={styles.itemContainer}>
            {activeTab === "images" ? (
              <View style={styles.imageItem}>
                {isSelecting && (
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      if (selectedItems.includes(item.id)) {
                        setSelectedItems(selectedItems.filter((id) => id !== item.id));
                      } else {
                        setSelectedItems([...selectedItems, item.id]);
                      }
                    }}
                  >
                    <Ionicons
                      name={selectedItems.includes(item.id) ? "checkbox" : "square-outline"}
                      size={24}
                      color={selectedItems.includes(item.id) ? "#3B82F6" : "#666"}
                    />
                  </TouchableOpacity>
                )}
                {item.type === "image" ? (
                  <Image
                    source={{ uri: item.url }}
                    style={styles.mediaItem}
                    onError={(e) => console.log("Error loading image:", e.nativeEvent.error)}
                  />
                ) : (
                  <Video
                    source={{ uri: item.url }}
                    style={styles.mediaItem}
                    useNativeControls={false}
                    isMuted={true}
                    resizeMode="cover"
                    onError={(error) => console.log("Video Error (Thumbnail):", error)}
                  />
                )}
                <TouchableOpacity
                  style={styles.imageOverlay}
                  onPress={() => setFullScreenImage(item)}
                />
              </View>
            ) : activeTab === "files" ? (
              <View style={styles.fileItem}>
                <TouchableOpacity onPress={() => setPreviewFile(item)}>
                  <Text style={styles.fileName}>{item.name || "Không có tên"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => downloadMedia(item.url, item.name)}>
                  <Ionicons name="download-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.linkItem}>
                {isSelecting && (
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => {
                      if (selectedItems.includes(item.id)) {
                        setSelectedItems(selectedItems.filter((id) => id !== item.id));
                      } else {
                        setSelectedItems([...selectedItems, item.id]);
                      }
                    }}
                  >
                    <Ionicons
                      name={selectedItems.includes(item.id) ? "checkbox" : "square-outline"}
                      size={24}
                      color={selectedItems.includes(item.id) ? "#3B82F6" : "#666"}
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.linkContent}>
                  <Text style={styles.linkName}>{item.name}</Text>
                  <Text style={styles.linkUrl}>{item.url}</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kho lưu trữ</Text>
          {isSelecting ? (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleDeleteSelected}>
                <Text style={styles.deleteText}>Xóa ({selectedItems.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setIsSelecting(false); setSelectedItems([]); }}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsSelecting(true)}>
              <Text style={styles.selectText}>Chọn</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
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

        {/* Fullscreen Modal for Images/Videos */}
        <Modal
          isVisible={!!fullScreenImage}
          onBackdropPress={() => setFullScreenImage(null)}
          style={styles.modal}
          useNativeDriver
        >
          {!fullScreenImage ? (
            <View />
          ) : (
            <View style={styles.fullScreenContainer}>
              <Swiper
                index={currentIndex}
                onIndexChanged={handleSwipe}
                loop={false}
                showsPagination={false}
                style={styles.swiper}
              >
                {data.images.map((item, index) => (
                  <View key={item.id} style={styles.fullScreenMediaContainer}>
                    {item.type === 'image' ? (
                      <Image
                        source={{ uri: item.url }}
                        style={styles.fullScreenMedia}
                        resizeMode="contain"
                      />
                    ) : (
                      <Video
                        ref={videoRef}
                        source={{ uri: item.url }}
                        style={styles.fullScreenMedia}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        onError={(error) => console.log("Video Error (Fullscreen):", error)}
                      />
                    )}
                  </View>
                ))}
              </Swiper>

              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setFullScreenImage(null)}
                >
                  <Ionicons name="close-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => downloadMedia(fullScreenImage.url, fullScreenImage.name)}
                >
                  <Ionicons name="download-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>

        {/* Preview Modal for Files */}
        <Modal
          isVisible={!!previewFile}
          onBackdropPress={() => setPreviewFile(null)}
          style={styles.modal}
          useNativeDriver
        >
          {previewFile && (
            <View style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>{previewFile.name || "Xem nội dung"}</Text>
                <TouchableOpacity onPress={() => setPreviewFile(null)}>
                  <Ionicons name="close-outline" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewPlaceholder}>
                  Preview not fully supported on mobile. Please download to view.
                </Text>
                <Text style={styles.previewUrl}>{previewFile.url}</Text>
              </View>
              <TouchableOpacity
                style={styles.previewDownloadButton}
                onPress={() => downloadMedia(previewFile.url, previewFile.name)}
              >
                <Text style={styles.downloadText}>Tải xuống</Text>
              </TouchableOpacity>
            </View>
          )}
        </Modal>

        {/* Filters */}
        <View style={styles.filterboarderContainer}>
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

        {/* Data Sections */}
        <ScrollView style={styles.scrollView}>
          {[...new Set(filteredData.map(({ date }) => date))].map((date) => (
            <DateSection key={date} date={date} data={filteredData} />
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
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 14,
  },
  cancelText: {
    color: '#666',
    fontSize: 14,
  },
  selectText: {
    color: '#3B82F6',
    fontSize: 14,
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
  swiper: {
    flex: 1,
  },
  fullScreenMediaContainer: {
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
    marginBottom: 16,
  },
  dateSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  list: {
    gap: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageItem: {
    position: 'relative',
  },
  checkbox: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 10,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
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
  linkName: {
    fontSize: 14,
    fontWeight: '500',
  },
  linkUrl: {
    fontSize: 12,
    color: '#3B82F6',
  },
});

export default StoragePage;