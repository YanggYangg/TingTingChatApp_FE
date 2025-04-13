import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import StoragePage from './StoragePage';
import { Alert } from 'react-native';
import {Api_chatInfo} from '../../../../../apis/Api_chatInfo';

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
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const videoRef = useRef<any>(null);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMedia = async () => {
      try {
        console.log("Đang lấy dữ liệu từ API...");
        const response = await Api_chatInfo.getChatMedia(conversationId);
        console.log("Dữ liệu API nhận được:", response);

        const mediaData = Array.isArray(response?.data) ? response.data : response;

        if (Array.isArray(mediaData)) {
          const filteredMedia = mediaData.map((item) => ({
            src: item?.linkURL || "#",
            name: item?.content || "Không có tên",
            type: item?.messageType || "image",
          }));
          setMedia(filteredMedia);
        } else {
          console.warn("API không trả về dữ liệu hợp lệ.");
          setMedia([]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu media:", error);
        Alert.alert('Lỗi', 'Không thể tải dữ liệu media. Vui lòng thử lại.');
        setMedia([]);
      }
    };

    fetchMedia();
  }, [conversationId]);

  const downloadMedia = async (url: string, filename: string) => {
    Alert.alert("Thông báo", "Tải xuống: " + filename);
  };

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

  useEffect(() => {
    if (fullScreenMedia) {
      const index = media.findIndex((item) => item.src === fullScreenMedia.src);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [fullScreenMedia, media]);

  const handleSwipe = (index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(media[index]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ảnh/Video</Text>
      {media.length === 0 ? (
        <Text style={styles.noDataText}>Không có ảnh hoặc video nào.</Text>
      ) : (
        <>
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
        </>
      )}

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          files={media}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}

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
              <Ionicons name="close" size={20} color="#fff" />
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
    margin: 0,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenMedia: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 100,
    backgroundColor: '#4B5563',
    borderRadius: 20,
    padding: 8,
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
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default GroupMediaGallery;