import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import Swiper from 'react-native-swiper';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import StoragePage from './StoragePage';

interface Media {
  id: string;
  messageId: string;
  urlIndex: number;
  linkURL: string;
  name: string;
  type: 'image' | 'video';
  userId: string;
}

interface Props {
  conversationId: string;
  userId: string;
  socket: any; // Thay bằng Socket.IO type nếu có
  otherUser?: { firstname: string; surname: string; avatar?: string } | null;
  onForward?: (media: Media, targetConversations: string[], content: string) => void;
}

const GroupMediaGallery: React.FC<Props> = ({
  conversationId,
  userId,
  socket,
  otherUser,
  onForward,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [fullScreenMedia, setFullScreenMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState<Record<string, boolean>>({});
  const [mediaLoadError, setMediaLoadError] = useState<Record<string, string | null>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [mediaToForward, setMediaToForward] = useState<Media | null>(null);
  const videoRef = useRef<Video>(null);
  const gridVideoRefs = useRef<Record<string, Video>>({});

const downloadMedia = async (url : string, type: 'image' | 'video') => {
  try {
    const fileName = url.split('/').pop() || (type === 'image' ? 'downloaded_image.jpg' : 'downloaded_video.mp4');
    const fileUri = `${FileSystem.cacheDirectory}/${fileName}`; // Sử dụng cacheDirectory
    console.log('URL to download:', url);
    console.log('File URI to save to:', fileUri);
    const { uri } = await FileSystem.downloadAsync(url, fileUri);
    console.log('Downloaded URI:', uri);
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.granted) {
      console.log('URI to save to MediaLibrary:', uri);
      await MediaLibrary.createAssetAsync(uri);
      Alert.alert('Thành công', `${type === 'image' ? 'Ảnh' : 'Video'} đã được lưu vào thư viện!`);
    } else {
      Alert.alert('Lỗi', 'Không có quyền truy cập thư viện để lưu.');
    }
  } catch (error: any) {
    console.error(`Tải ${type} thất bại:`, error);
    Alert.alert('Lỗi', `Không thể tải ${type}. Vui lòng thử lại.`);
  }
};
  // Lấy danh sách media từ socket
  const fetchMedia = useCallback(() => {
    if (!conversationId || !socket) {
      console.warn('conversationId or socket not provided.');
      setMedia([]);
      setLoading(false);
      Alert.alert('Lỗi', 'Thiếu thông tin để tải media.');
      return;
    }

    socket.emit('getChatMedia', { conversationId }, (response: any) => {
      if (response && response.success) {
        const mediaData = Array.isArray(response.data) ? response.data : [];
        console.log('[Socket.IO] Response (get media):', mediaData);
        const filteredMedia = mediaData
          .flatMap((item: any) => {
            const urls = Array.isArray(item?.linkURL)
              ? item.linkURL.filter((url: string) => url && typeof url === 'string')
              : typeof item?.linkURL === 'string'
              ? [item.linkURL]
              : [];
            if (urls.length === 0) {
              console.warn(`Message ${item._id} lacks linkURL:`, item);
              return [];
            }
            return urls.map((url: string, urlIndex: number) => ({
              id: `${item?._id}_${urlIndex}`,
              messageId: item?._id,
              urlIndex,
              linkURL: url,
              name: item?.content || `Media_${urlIndex + 1}`,
              type: item?.messageType === 'video' ? 'video' : 'image',
              userId: item?.userId || 'unknown',
            }));
          })
          .filter((mediaItem: Media) => mediaItem.linkURL);
        setMedia(filteredMedia.length ? filteredMedia : []);
      } else {
        setMedia([]);
        console.error('Error fetching media:', response?.message);
        Alert.alert('Lỗi', 'Không thể tải media. Vui lòng thử lại.');
      }
      setLoading(false);
    });
  }, [conversationId, socket]);

  // Lắng nghe sự kiện socket
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.on('chatMedia', (updatedMedia: any[]) => {
      console.log('[Socket.IO] Updated media list:', updatedMedia);
      if (Array.isArray(updatedMedia)) {
        const filteredMedia = updatedMedia
          .flatMap((item: any) => {
            const urls = Array.isArray(item?.linkURL)
              ? item.linkURL.filter((url: string) => url && typeof url === 'string')
              : typeof item?.linkURL === 'string'
              ? [item.linkURL]
              : [];
            if (urls.length === 0) {
              console.warn(`Message ${item._id} lacks linkURL:`, item);
              return [];
            }
            return urls.map((url: string, urlIndex: number) => ({
              id: `${item?._id}_${urlIndex}`,
              messageId: item?._id,
              urlIndex,
              linkURL: url,
              name: item?.content || `Media_${urlIndex + 1}`,
              type: item?.messageType === 'video' ? 'video' : 'image',
              userId: item?.userId || 'unknown',
            }));
          })
          .filter((mediaItem: Media) => mediaItem.linkURL);
        setMedia(filteredMedia.length ? filteredMedia : []);
      } else {
        setMedia([]);
        console.warn('Invalid update data:', updatedMedia);
      }
    });

    socket.on('connect_error', (error: any) => {
      console.error('[Socket.IO] Connection error:', error.message);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    });

    socket.on('error', (error: any) => {
      console.error('[Socket.IO] Error:', error.message);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại.');
    });

    fetchMedia();

    return () => {
      socket.off('chatMedia');
      socket.off('connect_error');
      socket.off('error');
    };
  }, [conversationId, socket, fetchMedia]);

  // Xử lý xóa media
  const handleDeleteFromStorage = useCallback(
    (deletedItems: { messageId: string; urlIndex: number }[]) => {
      console.log('Updating media after deletion:', deletedItems);
      const newMedia = media.filter(
        (mediaItem) =>
          !deletedItems.some(
            (item) => item.messageId === mediaItem.messageId && item.urlIndex === mediaItem.urlIndex
          )
      );

      if (newMedia.length !== media.length) {
        setMedia(newMedia);
        if (fullScreenMedia && !newMedia.find((item) => item.id === fullScreenMedia.id)) {
          setFullScreenMedia(null);
          setIsPlaying(false);
        }
      } else {
        console.warn('Could not update locally, reloading media...');
        fetchMedia();
      }
    },
    [media, fullScreenMedia, fetchMedia]
  );

  // Xử lý chuyển tiếp media
  const handleForwardClick = useCallback((item: Media) => {
    setMediaToForward(item);
    setIsShareModalOpen(true);
  }, []);

  const handleMediaShared = useCallback(
    (targetConversations: string[], shareContent: string) => {
      if (!mediaToForward?.messageId || !userId || !targetConversations.length) {
        console.error('Invalid forwarding data:', { mediaToForward, userId, targetConversations });
        Alert.alert('Lỗi', 'Thông tin không hợp lệ để chuyển tiếp.');
        return;
      }

      socket.emit(
        'forwardMessage',
        {
          messageId: mediaToForward.messageId,
          targetConversationIds: targetConversations,
          userId,
          content: shareContent,
        },
        (response: any) => {
          if (response && response.success) {
            console.log(`Forwarded media to ${response.data.length} conversations.`);
            setIsShareModalOpen(false);
            setMediaToForward(null);
            if (onForward) {
              onForward(mediaToForward, targetConversations, shareContent);
            }
            Alert.alert('Thành công', 'Media đã được chuyển tiếp.');
          } else {
            console.error('Error forwarding media:', response?.message);
            Alert.alert('Lỗi', 'Không thể chuyển tiếp media. Vui lòng thử lại.');
          }
        }
      );
    },
    [mediaToForward, userId, socket, onForward]
  );

  const handleShareModalClose = useCallback(() => {
    setIsShareModalOpen(false);
    setMediaToForward(null);
  }, []);

  // Quản lý phát video
  useEffect(() => {
    if (fullScreenMedia?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.playAsync().catch((error) => {
          console.error('Error playing video:', error);
          Alert.alert('Lỗi', 'Không thể phát video.');
        });
      } else {
        videoRef.current.pauseAsync().catch((error) => {
          console.error('Error pausing video:', error);
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

  const handleSwipe = useCallback((index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(media[index]);
    setIsPlaying(false);
  }, [media]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleMediaLoadStart = useCallback((mediaId: string) => {
    setMediaLoading((prev) => ({ ...prev, [mediaId]: true }));
    setMediaLoadError((prev) => ({ ...prev, [mediaId]: null }));
  }, []);

  const handleMediaLoad = useCallback((mediaId: string) => {
    setMediaLoading((prev) => ({ ...prev, [mediaId]: false }));
  }, []);

  const handleMediaError = useCallback((mediaId: string, error: any) => {
    console.error(`Error loading media ${mediaId}:`, error);
    setMediaLoading((prev) => ({ ...prev, [mediaId]: false }));
    setMediaLoadError((prev) => ({ ...prev, [mediaId]: 'Không thể tải media.' }));
  }, []);

  // Tối ưu danh sách media để tránh render không cần thiết
  const mediaItems = useMemo(() => media.slice(0, 4), [media]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang tải Hình ảnh/Video...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Ionicons name="image-outline" size={20} color="#333" style={styles.titleIcon} />
        <Text style={styles.title}>Hình ảnh/File/Link</Text>
      </View>
      {media.length === 0 ? (
        <Text style={styles.noDataText}>Không có hình ảnh/video.</Text>
      ) : (
        <View style={styles.grid}>
          {mediaItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setFullScreenMedia(item);
                setCurrentIndex(media.findIndex((m) => m.id === item.id));
              }}
            >
              {item.type === 'image' ? (
                <View style={styles.mediaItemContainer}>
                  <Image
                    source={{ uri: item.linkURL }}
                    style={styles.mediaItem}
                    onLoadStart={() => handleMediaLoadStart(item.id)}
                    onLoad={() => handleMediaLoad(item.id)}
                    onError={(error) => handleMediaError(item.id, error)}
                  />
                  {mediaLoading[item.id] && (
                    <View style={styles.loadingIndicator}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                  {mediaLoadError[item.id] && (
                    <Text style={styles.errorText}>{mediaLoadError[item.id]}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.videoContainer}>
                  <Video
                    ref={(ref) => (gridVideoRefs.current[item.id] = ref)}
                    source={{ uri: item.linkURL }}
                    style={styles.mediaItem}
                    useNativeControls={false}
                    isMuted={true}
                    resizeMode="cover"
                    onLoadStart={() => handleMediaLoadStart(item.id)}
                    onLoad={() => handleMediaLoad(item.id)}
                    onError={(error) => handleMediaError(item.id, error)}
                  />
                  <View style={styles.playIconContainer}>
                    <Ionicons name="play-circle-outline" size={25} color="#fff" />
                  </View>
                  {mediaLoading[item.id] && (
                    <View style={styles.loadingIndicator}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                  {mediaLoadError[item.id] && (
                    <Text style={styles.errorText}>{mediaLoadError[item.id]}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.arrowButton} onPress={() => setIsOpen(true)}>
            <Ionicons name="arrow-forward-outline" size={25} color="#007bff" />
          </TouchableOpacity>
        </View>
      )}

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          userId={userId}
          otherUser={otherUser}
          socket={socket}
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
            <TouchableOpacity
              style={styles.forwardButton}
              onPress={() => handleForwardClick(fullScreenMedia)}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
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
                  {mediaLoading[item.id] && (
                    <View style={styles.loadingIndicator}>
                      <ActivityIndicator size="large" color="#fff" />
                    </View>
                  )}
                  {mediaLoadError[item.id] && (
                    <Text style={styles.errorText}>{mediaLoadError[item.id]}</Text>
                  )}
                  {item.type === 'image' ? (
                    <Image
                      source={{ uri: item.linkURL }}
                      style={styles.fullScreenMedia}
                      resizeMode="contain"
                      onLoadStart={() => handleMediaLoadStart(item.id)}
                      onLoad={() => handleMediaLoad(item.id)}
                      onError={(error) => handleMediaError(item.id, error)}
                    />
                  ) : (
                    <View style={styles.fullScreenVideoContainer}>
                      <Video
                        ref={item.id === fullScreenMedia.id ? videoRef : undefined}
                        source={{ uri: item.linkURL }}
                        style={styles.fullScreenVideo}
                        useNativeControls={false}
                        resizeMode="contain"
                        onLoadStart={() => handleMediaLoadStart(item.id)}
                        onLoad={() => handleMediaLoad(item.id)}
                        onError={(error) => handleMediaError(item.id, error)}
                        isLooping
                        shouldPlay={item.id === fullScreenMedia.id && isPlaying}
                      />
                      {!mediaLoading[item.id] && !mediaLoadError[item.id] && (
                        <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
                          <Ionicons
                            name={isPlaying && item.id === fullScreenMedia.id ? 'pause-circle' : 'play-circle'}
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

      {isShareModalOpen && (
        <StoragePage
          conversationId={conversationId}
          userId={userId}
          otherUser={otherUser}
          socket={socket}
          isVisible={isShareModalOpen}
          onClose={handleShareModalClose}
          onShare={handleMediaShared}
          isShareMode={true}
        />
      )}
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
    padding: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 5,
    padding: 5,
    paddingLeft: 15,
  },
  mediaItemContainer: {
    position: 'relative',
  },
  mediaItem: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  arrowButton: {
    width: 60,
    height: 60,
    borderRadius: 5,
    backgroundColor: '#e0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
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
  forwardButton: {
    position: 'absolute',
    top: 60,
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
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
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