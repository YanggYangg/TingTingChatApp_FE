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
  linkastructure: string;
  name: string;
  type: 'image' | 'video';
  userId: string;
}

interface Props {
  conversationId: string;
  userId: string;
  socket: any;
  otherUser?: { firstname: string; surname: string; avatar?: string } | null;
  onForward?: (media: Media, targetConversations: string[], content: string) => void;
}

/**
 * Component for displaying group media gallery (images and videos).
 */
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

  /**
   * Download media to the device.
   */
  const downloadMedia = useCallback(async (url: string, type: 'image' | 'video') => {
    try {
      const fileName = url.split('/').pop() || (type === 'image' ? 'image.jpg' : 'video.mp4');
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) throw new Error('Không có quyền truy cập thư viện.');
      await MediaLibrary.createAssetAsync(uri);
      Alert.alert('Thành công', `${type === 'image' ? 'Hình ảnh' : 'Video'} đã được lưu!`);
    } catch (error: any) {
      Alert.alert('Lỗi', `Không thể tải ${type}: ${error.message || 'Lỗi không xác định'}`);
    }
  }, []);

  /**
   * Fetch media from the server.
   */
  const fetchMedia = useCallback(() => {
    if (!conversationId || !socket) {
      setMedia([]);
      setLoading(false);
      Alert.alert('Lỗi', 'Thiếu thông tin để tải media.');
      return;
    }

    setLoading(true);
    socket.emit('getChatMedia', { conversationId }, (response: any) => {
      if (response?.success) {
        const mediaData = formatData(response.data);
        setMedia(mediaData);
      } else {
        setMedia([]);
        Alert.alert('Lỗi', `Không thể tải media: ${response?.message || 'Lỗi không xác định'}`);
      }
      setLoading(false);
    });
  }, [conversationId, socket]);

  /**
   * Format raw server data into Media objects.
   */
  const formatData = useCallback(
    (items: any[]): Media[] => {
      if (!Array.isArray(items)) return [];

      return items
        .flatMap((item) => {
          const urls = Array.isArray(item?.linkURL)
            ? item.linkURL.filter((url: string) => url && typeof url === 'string')
            : typeof item?.linkURL === 'string'
            ? [item.linkURL]
            : [];
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
        .filter((item) => item.linkURL);
    },
    []
  );

  /**
   * Handle socket events and media updates.
   */
  useEffect(() => {
    if (!socket || !conversationId) return;

    fetchMedia();

    socket.on('chatMedia', (updatedMedia: any[]) => {
      setMedia(formatData(updatedMedia));
    });

    socket.on('messageDeleted', ({ messageId, urlIndex, isMessageDeleted }: any) => {
      setMedia((prev) =>
        isMessageDeleted
          ? prev.filter((item) => item.messageId !== messageId)
          : prev.filter((item) => !(item.messageId === messageId && item.urlIndex === urlIndex))
      );
      if (fullScreenMedia?.messageId === messageId && (isMessageDeleted || fullScreenMedia.urlIndex === urlIndex)) {
        setFullScreenMedia(null);
        setIsPlaying(false);
      }
    });

    socket.on('error', (error: any) => {
      Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    });

    return () => {
      socket.off('chatMedia');
      socket.off('messageDeleted');
      socket.off('error');
    };
  }, [socket, conversationId, fetchMedia, formatData, fullScreenMedia]);

  /**
   * Update media after deletion from StoragePage.
   */
  const handleDeleteFromStorage = useCallback(
    (deletedItems: { messageId: string; urlIndex: number; isMessageDeleted: boolean }[]) => {
      setMedia((prev) =>
        prev.filter(
          (item) =>
            !deletedItems.some(
              (d) => d.messageId === item.messageId && (d.isMessageDeleted || d.urlIndex === item.urlIndex)
            )
        )
      );
      if (
        fullScreenMedia &&
        deletedItems.some(
          (d) => d.messageId === fullScreenMedia.messageId && (d.isMessageDeleted || d.urlIndex === fullScreenMedia.urlIndex)
        )
      ) {
        setFullScreenMedia(null);
        setIsPlaying(false);
      }
    },
    [fullScreenMedia]
  );

  /**
   * Forward media to other conversations.
   */
  const handleForwardClick = useCallback((item: Media) => {
    setMediaToForward(item);
    setIsShareModalOpen(true);
  }, []);

  /**
   * Handle media sharing completion.
   */
  const handleMediaShared = useCallback(
    (targetConversations: string[], shareContent: string) => {
      if (!mediaToForward || !targetConversations.length) {
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
          if (response?.success) {
            setIsShareModalOpen(false);
            setMediaToForward(null);
            if (onForward) {
              onForward(mediaToForward, targetConversations, shareContent);
            }
            Alert.alert('Thành công', 'Media đã được chuyển tiếp.');
          } else {
            Alert.alert('Lỗi', `Không thể chuyển tiếp: ${response?.message || 'Lỗi không xác định'}`);
          }
        }
      );
    },
    [mediaToForward, userId, socket, onForward]
  );

  /**
   * Close the share modal.
   */
  const handleShareModalClose = useCallback(() => {
    setIsShareModalOpen(false);
    setMediaToForward(null);
  }, []);

  /**
   * Manage video playback.
   */
  useEffect(() => {
    if (fullScreenMedia?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.playAsync().catch(() => Alert.alert('Lỗi', 'Không thể phát video.'));
      } else {
        videoRef.current.pauseAsync().catch(() => {});
      }
    }
  }, [fullScreenMedia, isPlaying]);

  /**
   * Update state when entering/exiting full-screen mode.
   */
  useEffect(() => {
    if (fullScreenMedia) {
      const index = media.findIndex((item) => item.id === fullScreenMedia.id);
      if (index !== -1) setCurrentIndex(index);
    } else {
      setIsPlaying(false);
      Object.values(gridVideoRefs.current).forEach((ref) => ref?.pauseAsync().catch(() => {}));
    }
  }, [fullScreenMedia, media]);

  /**
   * Handle swiper index change.
   */
  const handleSwipe = useCallback((index: number) => {
    setCurrentIndex(index);
    setFullScreenMedia(media[index]);
    setIsPlaying(false);
  }, [media]);

  /**
   * Handle media loading states.
   */
  const handleMediaLoadStart = useCallback((mediaId: string) => {
    setMediaLoading((prev) => ({ ...prev, [mediaId]: true }));
    setMediaLoadError((prev) => ({ ...prev, [mediaId]: null }));
  }, []);

  const handleMediaLoad = useCallback((mediaId: string) => {
    setMediaLoading((prev) => ({ ...prev, [mediaId]: false }));
  }, []);

  const handleMediaError = useCallback((mediaId: string, error: any) => {
    setMediaLoading((prev) => ({ ...prev, [mediaId]: false }));
    setMediaLoadError((prev) => ({ ...prev, [mediaId]: 'Không thể tải media.' }));
  }, []);

  /**
   * Limit displayed media to 4 items.
   */
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
        <Text style={styles.title}>Hình ảnh/Video</Text>
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
              <View style={styles.mediaItemContainer}>
                {item.type === 'image' ? (
                  <Image
                    source={{ uri: item.linkURL }}
                    style={styles.mediaItem}
                    onLoadStart={() => handleMediaLoadStart(item.id)}
                    onLoad={() => handleMediaLoad(item.id)}
                    onError={(error) => handleMediaError(item.id, error)}
                  />
                ) : (
                  <>
                    <Video
                      ref={(ref) => (gridVideoRefs.current[item.id] = ref)}
                      source={{ uri: item.linkURL }}
                      style={styles.mediaItem}
                      isMuted={true}
                      resizeMode="cover"
                      onLoadStart={() => handleMediaLoadStart(item.id)}
                      onLoad={() => handleMediaLoad(item.id)}
                      onError={(error) => handleMediaError(item.id, error)}
                    />
                    <View style={styles.playIconContainer}>
                      <Ionicons name="play-circle-outline" size={25} color="#fff" />
                    </View>
                  </>
                )}
                {mediaLoading[item.id] && (
                  <View style={styles.loadingIndicator}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                {mediaLoadError[item.id] && (
                  <Text style={styles.errorText}>{mediaLoadError[item.id]}</Text>
                )}
              </View>
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
                        <TouchableOpacity
                          style={styles.playPauseButton}
                          onPress={() => setIsPlaying((prev) => !prev)}
                        >
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  container: { marginBottom: 15, padding: 5 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  titleIcon: { marginRight: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  grid: { flexDirection: 'row', justifyContent: 'flex-start', gap: 5, padding: 5, paddingLeft: 15 },
  mediaItemContainer: { position: 'relative' },
  mediaItem: { width: 60, height: 60, borderRadius: 5 },
  arrowButton: { width: 60, height: 60, borderRadius: 5, backgroundColor: '#e0f0ff', justifyContent: 'center', alignItems: 'center' },
  modal: { margin: 0 },
  fullScreenContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullScreenMedia: { width: '100%', height: '90%' },
  fullScreenVideoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: '90%' },
  fullScreenVideo: { width: '100%', height: '100%' },
  closeButton: { position: 'absolute', top: 16, left: 16, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  downloadButton: { position: 'absolute', top: 16, right: 16, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  forwardButton: { position: 'absolute', top: 60, right: 16, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  swiperSlide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mediaName: { color: '#fff', fontSize: 16, marginTop: 10, textAlign: 'center', position: 'absolute', bottom: 20, left: 0, right: 0 },
  noDataText: { fontSize: 14, color: '#666', textAlign: 'center' },
  videoContainer: { position: 'relative' },
  playIconContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  loadingIndicator: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  errorText: { color: 'red', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 5 },
  playPauseButton: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -30 }, { translateY: -30 }], zIndex: 10 },
});

export default GroupMediaGallery;