import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';

interface Media {
  src: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
}

interface Props {
  onClose: () => void;
  conversationId: string;
  isVisible: boolean;
  files: Media[];
}

const StoragePage: React.FC<Props> = ({ onClose, conversationId, isVisible, files }) => {
  const [activeTab, setActiveTab] = useState<"images" | "files" | "links">("images");
  const [data, setData] = useState<{ images: Media[], files: Media[], links: Media[] }>({
    images: [],
    files: [],
    links: [],
  });
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [previewFile, setPreviewFile] = useState<Media | null>(null);

  // Manage video refs dynamically for each video in the Swiper
  const videoRefs = useRef<{ [key: string]: any }>({});

  // Mock Data with src, name, and type
  const mockData = {
    images: files.length > 0 ? files : [
      {
        src: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        name: "Image 1",
        type: "image",
      },
      {
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        name: "Video 1",
        type: "video",
      },
      {
        src: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        name: "Image 2",
        type: "image",
      },
      {
        src: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        name: "Image 3",
        type: "image",
      },
      {
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        name: "Video 2",
        type: "video",
      },
      {
        src: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        name: "Image 4",
        type: "image",
      },
      {
        src: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        name: "Image 5",
        type: "image",
      },
      {
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        name: "Video 3",
        type: "video",
      },
      {
        src: "https://saigonbanme.vn/wp-content/uploads/2024/12/301-hinh-anh-co-gai-ngoi-buon-tam-trang-duoi-mua.jpg",
        name: "Image 6",
        type: "image",
      },
      {
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        name: "Video 4",
        type: "video",
      },
    ],
    files: [
      {
        src: "https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx",
        name: "Document.pdf",
        type: "file",
      },
      {
        src: "https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx",
        name: "Report.docx",
        type: "file",
      },
    ],
    links: [
      {
        src: "https://example.com/link1",
        name: "Link 1",
        type: "link",
      },
      {
        src: "https://example.com/link2",
        name: "Link 2",
        type: "link",
      },
    ],
  };

  useEffect(() => {
    setData(mockData);
  }, [conversationId, files]);

  const downloadMedia = async (url: string, filename: string) => {
    Alert.alert("Thông báo", `Tải xuống: ${filename || "Không có tên"}`);
  };

  // Handle swipe to update fullScreenMedia
  const handleSwipe = (index: number) => {
    // Pause all videos before switching to the new slide
    Object.values(videoRefs.current).forEach((ref) => {
      if (ref) {
        ref.pauseAsync().catch((error: any) => {
          console.error("Lỗi khi tạm dừng video:", error);
        });
      }
    });

    setCurrentIndex(index);
    setFullScreenMedia(data.images[index]);

    // Play the video on the new slide if applicable
    const newItem = data.images[index];
    if (newItem.type === 'video' && videoRefs.current[newItem.src]) {
      videoRefs.current[newItem.src].playAsync().catch((error: any) => {
        console.error("Lỗi khi phát video:", error);
      });
    }
  };

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
          isVisible={!!fullScreenMedia}
          onBackdropPress={() => {
            // Pause all videos when closing the modal
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
              <TouchableOpacity
                style={styles.closeButton}
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
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
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

        {/* Media Grid */}
        <View style={styles.grid}>
          {(data[activeTab] || []).map((item: Media, index: number) => (
            <View key={`${item.src}-${index}`} style={styles.itemContainer}>
              {activeTab === "images" ? (
                <TouchableOpacity onPress={() => {
                  setFullScreenMedia(item);
                  const index = data.images.findIndex((i) => i.src === item.src);
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
                        source={{ uri: 'https://via.placeholder.com/80/000000/FFFFFF?text=Video' }}
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
  closeButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#4B5563',
    borderRadius: 20,
    padding: 8,
    zIndex: 60,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
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