import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import StoragePage from './StoragePage';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

interface Media {
  id: string;
  messageId: string;
  urlIndex: number;
  linkURL: string;
  name: string;
  type: string;
  userId: string;
}

interface Props {
  conversationId: string;
  userId: string;
  otherUser?: { firstname: string; surname: string; avatar?: string } | null;
}

const GroupMediaGallery: React.FC<Props> = ({ conversationId, userId, otherUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const videoRef = useRef<Video>(null);
  const gridVideoRefs = useRef<Record<number, Video>>({});
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      console.log('Đang lấy dữ liệu từ API...');
      const response = await Api_chatInfo.getChatMedia(conversationId);
      console.log('Dữ liệu API nhận được:', response);

      const mediaData = Array.isArray(response?.data) ? response.data : response;

      if (Array.isArray(mediaData)) {
        const filteredMedia = mediaData
          .flatMap((item) => {
            const urls = Array.isArray(item?.linkURL)
              ? item.linkURL.filter((url: string) => url && typeof url === 'string')
              : typeof item?.linkURL === 'string'
              ? [item.linkURL]
              : [];
            if (urls.length === 0) {
              console.warn(`Tin nhắn ${item._id} thiếu linkURL:`, item);
              return [];
            }
            return urls.map((url: string, urlIndex: number) => ({
              id: `${item?._id}_${urlIndex}`,
              messageId: item?._id,
              urlIndex,
              linkURL: url,
              name: item?.content || `Media_${urlIndex + 1}`,
              type: item?.messageType || 'image',
              userId: item?.userId || 'unknown',
            }));
          })
          .filter((mediaItem) => mediaItem.linkURL);
        setMedia(filteredMedia);
      } else {
        console.warn('API không trả về dữ liệu hợp lệ.');
        setMedia([]);
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu media:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu media. Vui lòng thử lại.');
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    console.log('GRM userId:', userId);
    fetchMedia();
  }, [conversationId]);

  const handleDeleteFromStorage = (deletedItems: { messageId: string; urlIndex: number }[]) => {
    console.log('Cập nhật media sau khi xóa:', deletedItems);
    const newMedia = media.filter((mediaItem) => {
      const isDeleted = deletedItems.some(
        (item) => item.messageId === mediaItem.messageId && item.urlIndex === mediaItem.urlIndex
      );
      return !isDeleted;
    });

    if (newMedia.length !== media.length) {
      setMedia(newMedia);
      if (fullScreenMedia && !newMedia.find((item) => item.id === fullScreenMedia.id)) {
        setFullScreenMedia(null);
        setIsPlaying(false);
      }
    } else {
      console.warn('Không thể cập nhật cục bộ, tải lại media...');
      fetchMedia();
    }
  };

  const downloadMedia = async (url: string, type: string) => {
    try {
      const fileName = url.split('/').pop() || (type === 'image' ? 'downloaded_image.jpg' : 'downloaded_video.mp4');
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
      console.error(`Tải ${type} thất bại:`, error.message || error);
      Alert.alert('Lỗi', `Không thể tải xuống ${type}. Vui lòng thử lại.`);
    }
  };

  useEffect(() => {
    if (fullScreenMedia && fullScreenMedia.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.playAsync().catch((error: any) => {
          console.error('Lỗi khi phát video (modal):', error);
        });
      } else {
        videoRef.current.pauseAsync().catch((error: any) => {
          console.error('Lỗi khi dừng video (modal):', error);
        });
      }
    }
  }, [fullScreenMedia, isPlaying]);

  useEffect(() => {
    if (fullScreenMedia) {
      const index = media.findIndex((item) => item.id === fullScreenMedia.id);
      if (index !== -1) {
        setCurrentIndex(index);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
      Object.values(gridVideoRefs.current).forEach((ref) => {
        ref?.pauseAsync().catch(() => {});
      });
    }
  }, [fullScreenMedia, media]);

  const handleSwipe = (index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(media[index]);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMediaLoadStart = () => {
    setMediaLoading(true);
    setMediaLoadError(null);
  };

  const handleMediaLoad = () => {
    setMediaLoading(false);
  };

  const handleMediaError = (error: any) => {
    console.error('Lỗi tải media:', error);
    setMediaLoading(false);
    setMediaLoadError('Không thể tải media này.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang tải ảnh và video...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ảnh/Video</Text>
      {media.length === 0 ? (
        <Text style={styles.noDataText}>Không có ảnh hoặc video nào.</Text>
      ) : (
        <>
          <View style={styles.grid}>
            {media.slice(0, 8).map((item, index) => (
              <TouchableOpacity key={item.id} onPress={() => setFullScreenMedia(item)}>
                {item.type === 'image' ? (
                  <Image
                    source={{ uri: item.linkURL }}
                    style={styles.mediaItem}
                    onError={(error) => console.error(`Lỗi tải ảnh ${item.id}:`, error)}
                  />
                ) : (
                  <View style={styles.videoContainer}>
                    <Video
                      ref={(ref) => (gridVideoRefs.current[index] = ref)}
                      source={{ uri: item.linkURL }}
                      style={styles.mediaItem}
                      useNativeControls={false}
                      isMuted={true}
                      resizeMode="cover"
                      onError={(error) => console.error(`Lỗi tải video ${item.id}:`, error)}
                    />
                    <View style={styles.playIconContainer}>
                      <Ionicons name="play-circle-outline" size={30} color="#fff" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.viewAllButton} onPress={() => setIsOpen(true)}>
            <Text style={styles.viewAllText}>Xem tất cả ({media.length})</Text>
          </TouchableOpacity>
        </>
      )}

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          userId={userId}
          otherUser={otherUser}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          onDelete={handleDeleteFromStorage}
        />
      )}

      <Modal
        isVisible={!!fullScreenMedia}
        onBackdropPress={() => {
          setFullScreenMedia(null);
          setIsPlaying(false);
        }}
        onBackButtonPress={() => {
          setFullScreenMedia(null);
          setIsPlaying(false);
        }}
        style={styles.modal}
        useNativeDriver
      >
        {fullScreenMedia && (
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setFullScreenMedia(null);
                setIsPlaying(false);
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => downloadMedia(fullScreenMedia.linkURL, fullScreenMedia.type)}
            >
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <Swiper
              index={currentIndex}
              onIndexChanged={handleSwipe}
              loop={false}
              showsPagination={false}
              scrollEnabled={true}
            >
              {media.map((item) => (
                <View key={item.id} style={styles.swiperSlide}>
                  {mediaLoading && item.id === fullScreenMedia.id && (
                    <View style={styles.loadingIndicator}>
                      <ActivityIndicator size="large" color="#fff" />
                    </View>
                  )}
                  {mediaLoadError && item.id === fullScreenMedia.id && (
                    <Text style={styles.errorText}>{mediaLoadError}</Text>
                  )}
                  {item.type === 'image' ? (
                    <Image
                      source={{ uri: item.linkURL }}
                      style={styles.fullScreenMedia}
                      resizeMode="contain"
                      onLoadStart={handleMediaLoadStart}
                      onLoad={handleMediaLoad}
                      onError={handleMediaError}
                    />
                  ) : (
                    <View style={styles.fullScreenVideoContainer}>
                      <Video
                        ref={item.id === fullScreenMedia.id ? videoRef : undefined}
                        source={{ uri: item.linkURL }}
                        style={styles.fullScreenVideo}
                        useNativeControls={false}
                        resizeMode="contain"
                        onLoadStart={handleMediaLoadStart}
                        onLoad={handleMediaLoad}
                        onError={handleMediaError}
                        isLooping
                        shouldPlay={isPlaying}
                      />
                      {!mediaLoading && mediaLoadError === null && (
                        <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
                          <Ionicons
                            name={isPlaying ? 'pause-circle' : 'play-circle'}
                            size={60}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  <Text style={styles.mediaName}>{item.name}</Text>
                </View>
              ))}
            </Swiper>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMedia: {
    width: '100%',
    height: '90%',
  },
  fullScreenVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '90%',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  downloadButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  videoContainer: {
    position: 'relative',
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 10,
  },
});

export default GroupMediaGallery;