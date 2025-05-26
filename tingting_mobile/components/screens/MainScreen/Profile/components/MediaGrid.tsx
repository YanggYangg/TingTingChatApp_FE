import { useState, useEffect } from "react"
import { 
  View, 
  Image, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Text,
  StatusBar 
} from "react-native"
import { Video, Audio } from "expo-av"
import { Play, X } from "lucide-react-native"
import type { Media } from "../types/post"

type MediaGridProps = {
  media: Media[]
}

const MediaGrid = ({ media }: MediaGridProps) => {
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)

  // Cấu hình Audio Session khi component mount
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          playsInSilentModeIOS: true, // Quan trọng: cho phép phát âm thanh khi điện thoại ở chế độ im lặng
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log("Error setting up audio:", error);
      }
    };

    configureAudio();
  }, []);

  const handleMediaPress = (item: Media, index: number) => {
    // Mở modal với tất cả media (cả ảnh và video)
    setSelectedMediaIndex(index)
    setShowMediaModal(true)
  }

  const closeMediaModal = () => {
    setShowMediaModal(false)
  }

  const renderMediaItem = (item: Media, style: any) => {
    if (item.type === "image") {
      return <Image source={{ uri: item.url }} style={style} resizeMode="cover" />
    } else {
      // For video, show thumbnail with play button overlay
      return (
        <View style={{ width: "100%", height: "100%" }}>
          <Image 
            source={{ uri: item.thumbnailUrl || "https://lab2s320114581a.s3.ap-southeast-1.amazonaws.com/%20bws1-1747576518127-media_0.png" }} 
            style={style} 
            resizeMode="cover" 
          />
          <View style={styles.playButtonContainer}>
            <Play color="#FFFFFF" size={24} />
          </View>
        </View>
      )
    }
  }

  // Unified Media Viewer Modal Component (cho cả ảnh và video)
  const renderMediaModal = () => (
    <Modal
      visible={showMediaModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closeMediaModal}
    >
      <View style={styles.mediaModalContainer}>
        <StatusBar backgroundColor="black" barStyle="light-content" />
        
        {/* Header modal */}
        <View style={styles.mediaModalHeader}>
          <TouchableOpacity onPress={closeMediaModal} style={styles.mediaCloseButton}>
            <X color="#FFFFFF" size={30} />
          </TouchableOpacity>
          <Text style={styles.mediaModalTitle}>
            {selectedMediaIndex + 1} / {media.length}
          </Text>
          <View style={styles.mediaModalHeaderRight} />
        </View>

        {/* Media với scroll (cả ảnh và video) */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width)
            setSelectedMediaIndex(newIndex)
          }}
          contentOffset={{ x: selectedMediaIndex * width, y: 0 }}
        >
          {media.map((item, index) => (
            <View key={index} style={styles.mediaScrollContainer}>
              {item.type === "video" ? (
                <View style={styles.videoContainer}>
                  <Video
                    source={{ uri: item.url }}
                    style={styles.fullVideo}
                    useNativeControls
                    resizeMode="contain"
                    shouldPlay={false}
                    isLooping={false}
                    volume={1.0}
                    isMuted={false}
                    // Thêm các props quan trọng cho audio
                    audioOnly={false}
                    progressUpdateIntervalMillis={1000}
                    positionMillis={0}
                    // Cấu hình audio mode cho video
                    onLoad={async () => {
                      try {
                        await Audio.setAudioModeAsync({
                          allowsRecordingIOS: false,
                          staysActiveInBackground: false,
                          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
                          playsInSilentModeIOS: true,
                          shouldDuckAndroid: true,
                          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
                          playThroughEarpieceAndroid: false,
                        });
                      } catch (error) {
                        console.log("Error setting audio mode for video:", error);
                      }
                    }}
                  />
                </View>
              ) : (
                <ScrollView
                  style={styles.imageScrollContainer}
                  maximumZoomScale={3}
                  minimumZoomScale={1}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                >
                  <TouchableOpacity 
                    activeOpacity={1}
                    onPress={closeMediaModal}
                    style={styles.fullImageContainer}
                  >
                    <Image
                      source={{ uri: item.url }}
                      style={styles.fullImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Dots indicator cho tất cả media */}
        {media.length > 1 && (
          <View style={styles.mediaDotsContainer}>
            {media.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.mediaDot,
                  selectedMediaIndex === index && styles.mediaActiveDot,
                  // Thêm style khác biệt cho video và ảnh
                  item.type === "video" && styles.videoDot
                ]}
              />
            ))}
          </View>
        )}

        {/* Media type indicator */}
        <View style={styles.mediaTypeIndicator}>
          <Text style={styles.mediaTypeText}>
            {media[selectedMediaIndex]?.type === "video" ? "📹 Video" : "🖼️ Ảnh"}
          </Text>
        </View>
      </View>
    </Modal>
  )

  // Handle 1-3 media items with grid layout
  if (media.length === 1) {
    return (
      <>
        <TouchableOpacity 
          style={styles.singleContainer}
          onPress={() => handleMediaPress(media[0], 0)}
        >
          {renderMediaItem(media[0], styles.singleImage)}
        </TouchableOpacity>
        
        {/* Unified Media Modal */}
        {renderMediaModal()}
      </>
    )
  }

  if (media.length === 2) {
    return (
      <>
        <View style={styles.rowContainer}>
          <TouchableOpacity 
            style={styles.halfContainer}
            onPress={() => handleMediaPress(media[0], 0)}
          >
            {renderMediaItem(media[0], styles.image)}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.halfContainer}
            onPress={() => handleMediaPress(media[1], 1)}
          >
            {renderMediaItem(media[1], styles.image)}
          </TouchableOpacity>
        </View>
        
        {/* Unified Media Modal */}
        {renderMediaModal()}
      </>
    )
  }

  if (media.length === 3) {
    return (
      <>
        <View style={styles.rowContainer}>
          <TouchableOpacity 
            style={styles.thirdContainer}
            onPress={() => handleMediaPress(media[0], 0)}
          >
            {renderMediaItem(media[0], styles.image)}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.thirdContainer}
            onPress={() => handleMediaPress(media[1], 1)}
          >
            {renderMediaItem(media[1], styles.image)}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.thirdContainer}
            onPress={() => handleMediaPress(media[2], 2)}
          >
            {renderMediaItem(media[2], styles.image)}
          </TouchableOpacity>
        </View>
        
        {/* Unified Media Modal */}
        {renderMediaModal()}
      </>
    )
  }

  // For more than 3 images, use horizontal ScrollView
  if (media.length > 3) {
    return (
      <>
        <View style={styles.scrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {media.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.scrollImageContainer}
                onPress={() => handleMediaPress(item, index)}
              >
                {renderMediaItem(item, styles.scrollImage)}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Unified Media Modal */}
        {renderMediaModal()}
      </>
    )
  }

  return null
}

const { width, height } = Dimensions.get("window")
const imageWidth = width - 70 // Accounting for padding and timeline

const styles = StyleSheet.create({
  singleContainer: {
    width: imageWidth,
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  singleImage: {
    width: "100%",
    height: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  halfContainer: {
    flex: 1,
    height: 150,
    marginHorizontal: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  thirdContainer: {
    flex: 1,
    height: 120,
    marginHorizontal: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  // Styles for horizontal scroll view
  scrollContainer: {
    height: 150,
    marginBottom: 10,
  },
  scrollContent: {
    paddingRight: 10,
  },
  scrollImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 8,
  },
  scrollImage: {
    width: "100%",
    height: "100%",
  },
  // Play button overlay for videos
  playButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  // Unified Media Modal styles
  mediaModalContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  mediaModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  mediaCloseButton: {
    padding: 10,
  },
  mediaModalTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  mediaModalHeaderRight: {
    width: 50,
  },
  mediaScrollContainer: {
    width: width,
    height: height - 160, // Để chừa chỗ cho type indicator
  },
  
  // Video styles in modal
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: width,
    height: height - 160,
  },
  fullVideo: {
    width: width,
    height: height - 160,
  },
  
  // Image styles in modal
  imageScrollContainer: {
    width: width,
    height: height - 160,
  },
  fullImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: width,
    height: height - 160,
  },
  fullImage: {
    width: width,
    height: height - 160,
  },
  
  // Dots indicator cho tất cả media
  mediaDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  mediaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  mediaActiveDot: {
    backgroundColor: "white",
  },
  videoDot: {
    backgroundColor: "rgba(255, 100, 100, 0.7)", // Màu khác cho video dots
  },
  
  // Media type indicator
  mediaTypeIndicator: {
    position: "absolute",
    bottom: 80,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  mediaTypeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
})

export default MediaGrid