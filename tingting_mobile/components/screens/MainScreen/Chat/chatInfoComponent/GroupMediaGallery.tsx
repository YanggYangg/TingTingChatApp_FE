import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
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
  const videoRef = useRef<any>(null);

  const mockMedia = [
    {
      src: "https://image.nhandan.vn/Uploaded/2025/unqxwpejw/2023_09_24/anh-dep-giao-thong-1626.jpg",
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
        {/* Guard clause to prevent rendering when fullScreenMedia is null */}
        {!fullScreenMedia ? (
          <View />
        ) : (
          <View style={styles.fullScreenContainer}>
            {fullScreenMedia.type === 'image' ? (
              <Image
                source={{ uri: fullScreenMedia.src }}
                style={styles.fullScreenMedia}
                resizeMode="contain"
              />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: fullScreenMedia.src }}
                style={styles.fullScreenMedia}
                useNativeControls
                resizeMode="contain"
                isLooping
              />
            )}

            {/* Top Bar with Close and Download Icons */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setFullScreenMedia(null)}
              >
                <Ionicons name="close-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => downloadMedia(fullScreenMedia.src, fullScreenMedia.name)}
              >
                <Ionicons name="download-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Bottom Close Icon */}
            <TouchableOpacity
              style={styles.bottomCloseButton}
              onPress={() => setFullScreenMedia(null)}
            >
              <Ionicons name="close-outline" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Sidebar */}
            <View style={styles.sidebar}>
              {media.map((item, index) => (
                <TouchableOpacity key={index} onPress={() => setFullScreenMedia(item)}>
                  {item.type === 'image' ? (
                    <Image
                      source={{ uri: item.src }}
                      style={[
                        styles.sidebarItem,
                        fullScreenMedia.src === item.src && styles.sidebarItemActive,
                      ]}
                    />
                  ) : (
                    <Video
                      source={{ uri: item.src }}
                      style={[
                        styles.sidebarItem,
                        fullScreenMedia.src === item.src && styles.sidebarItemActive,
                      ]}
                      useNativeControls={false}
                      isMuted={true}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
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
    flexDirection: 'row',
    backgroundColor: '#000', // Black background for true fullscreen
  },
  fullScreenMedia: {
    flex: 1,
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
  bottomCloseButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#4B5563', // Gray-800 equivalent
    borderRadius: 20,
    padding: 8,
    zIndex: 60,
  },
  sidebar: {
    width: 64,
    backgroundColor: '#111827', // Gray-900 equivalent
    padding: 8,
  },
  sidebarItem: {
    width: 48,
    height: 48,
    borderRadius: 5,
    marginBottom: 8,
    opacity: 0.5,
  },
  sidebarItemActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#3B82F6', // Blue-400 equivalent
  },
});

export default GroupMediaGallery;