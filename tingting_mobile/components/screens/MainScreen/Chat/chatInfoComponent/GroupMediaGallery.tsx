import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Video } from 'expo-av'; // Replace react-native-video with expo-av
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
      src: "https://example.com/image1.jpg",
      name: "Image 1",
      type: "image",
    },
    {
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Sample video URL
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
      videoRef.current.replayAsync(); // Use replayAsync for expo-av
    }
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

      {fullScreenMedia && (
        <View style={styles.fullScreenModal}>
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
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullScreenMedia(null)}
            >
              <Text style={styles.closeButtonText}>✖</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => downloadMedia(fullScreenMedia.src, fullScreenMedia.name)}
            >
              <Text style={styles.downloadButtonText}>⬇ Tải xuống</Text>
            </TouchableOpacity>
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
        </View>
      )}
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
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  fullScreenContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    height: '90%',
  },
  fullScreenMedia: {
    flex: 1,
    borderRadius: 10,
    margin: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#666',
    borderRadius: 20,
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  downloadButtonText: {
    fontSize: 14,
    color: '#333',
  },
  sidebar: {
    width: 80,
    backgroundColor: '#333',
    padding: 5,
    overflow: 'scroll',
  },
  sidebarItem: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginBottom: 5,
    opacity: 0.5,
  },
  sidebarItemActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#1e90ff',
  },
});

export default GroupMediaGallery;