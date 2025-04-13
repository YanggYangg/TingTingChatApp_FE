import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper'; // Import Swiper for swiping functionality
import StoragePage from './StoragePage';

interface Media {
  src: string;
  name: string;
  type: string;
}

interface Props {
  conversationId: string;
}

const GroupMediaGallery: React.FC<Props> = ({ conversationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0); // Track the current media index
  const videoRef = useRef<any>(null);

  const mockMedia = [
    {
      src: "https://image.nhandan.vn/Uploaded/2025/unqxwpejw/2023_09_24/anh-dep-giao-thong-1626.jpg",
      name: "Image 1",
      type: "image",
    },
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
      src: "https://image.nhandan.vn/Uploaded/2025/unqxwpejw/2023_09_24/anh-dep-giao-thong-1626.jpg",
      name: "Image 1",
      type: "image",
    },
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
      src: "https://image.nhandan.vn/Uploaded/2025/unqxwpejw/2023_09_24/anh-dep-giao-thong-1626.jpg",
      name: "Image 1",
      type: "image",
    },
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
      src: "https://image.nhandan.vn/Uploaded/2025/unqxwpejw/2023_09_24/anh-dep-giao-thong-1626.jpg",
      name: "Image 1",
      type: "image",
    },
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
  ];

  useEffect(() => {
    if (!conversationId) return;

    const fetchMedia = () => {
      setMedia(mockMedia);
    };

    fetchMedia();
  }, [conversationId]);

  const downloadMedia = async (url: string, filename: string) => {
    Alert.alert("Thông báo", "Tải xuống: " + filename);
  };

  // Update video playback when fullScreenMedia changes
  useEffect(() => {
    if (fullScreenMedia && fullScreenMedia.type === 'video' && videoRef.current) {
      videoRef.current.playAsync().catch((error: any) => {
        console.error("Lỗi khi phát video:", error);
      });
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    };
  }, [fullScreenMedia]);

  // Update currentIndex when fullScreenMedia changes
  useEffect(() => {
    if (fullScreenMedia) {
      const index = media.findIndex((item) => item.src === fullScreenMedia.src);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [fullScreenMedia, media]);

  // Handle swipe to update fullScreenMedia
  const handleSwipe = (index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(media[index]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ảnh/Video</Text>
      <View style={styles.grid}>
        {media.slice(0, 8).map((item, index) => (
          <TouchableOpacity key={index} onPress={() => setFullScreenMedia(item)}>
            {item.type === 'image' ? (
              <Image source={{ uri: item.src }} style={styles.mediaItem} />
            ) : (
              <Video
                source={{ uri: item.src }}
                style={styles.mediaItem}
                useNativeControls={false}
                isMuted={true}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.viewAllButton} onPress={() => setIsOpen(true)}>
        <Text style={styles.viewAllText}>Xem tất cả</Text>
      </TouchableOpacity>

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          files={media}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}

      {/* Fullscreen Modal using react-native-modal */}
      <Modal
        isVisible={!!fullScreenMedia}
        onBackdropPress={() => setFullScreenMedia(null)}
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
              {media.map((item, index) => (
                <View key={index} style={styles.swiperSlide}>
                  {item.type === 'image' ? (
                    <Image source={{ uri: item.src }} style={styles.fullScreenMedia} />
                  ) : (
                    <Video
                      ref={index === currentIndex ? videoRef : undefined}
                      source={{ uri: item.src }}
                      style={styles.fullScreenMedia}
                      useNativeControls
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.mediaName}>{item.name}</Text>
                </View>
              ))}
            </Swiper>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullScreenMedia(null)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  viewAllButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#333',
  },
  modal: {
    margin: 0, // Remove all margins to ensure true fullscreen
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000', // Black background for true fullscreen
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
    backgroundColor: '#4B5563', // Gray-800 equivalent
    borderRadius: 20,
    padding: 8,
  },
  closeButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#4B5563', // Gray-800 equivalent
    borderRadius: 20,
    padding: 8,
    zIndex: 60,
  },
});

export default GroupMediaGallery;