import { useState } from "react"
import { View, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Modal } from "react-native"
import { Video } from "expo-av" // Or use: import Video from 'react-native-video'
import { Play, X } from "lucide-react-native" // For play button and close icons
import type { Media } from "../types/post"

type MediaGridProps = {
  media: Media[]
}

const MediaGrid = ({ media }: MediaGridProps) => {
  const [selectedVideo, setSelectedVideo] = useState<Media | null>(null)

  const handleMediaPress = (item: Media) => {
    if (item.type === "video") {
      setSelectedVideo(item)
    }
    // You could also implement an image viewer for images
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

  // Handle 1-3 media items with grid layout
  if (media.length === 1) {
    return (
      <>
        <TouchableOpacity 
          style={styles.singleContainer}
          onPress={() => handleMediaPress(media[0])}
        >
          {renderMediaItem(media[0], styles.singleImage)}
        </TouchableOpacity>
        
        {/* Video Player Modal */}
        <VideoPlayerModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      </>
    )
  }

  if (media.length === 2) {
    return (
      <>
        <View style={styles.rowContainer}>
          <TouchableOpacity 
            style={styles.halfContainer}
            onPress={() => handleMediaPress(media[0])}
          >
            {renderMediaItem(media[0], styles.image)}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.halfContainer}
            onPress={() => handleMediaPress(media[1])}
          >
            {renderMediaItem(media[1], styles.image)}
          </TouchableOpacity>
        </View>
        
        {/* Video Player Modal */}
        <VideoPlayerModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      </>
    )
  }

  if (media.length === 3) {
    return (
      <>
        <View style={styles.rowContainer}>
          <TouchableOpacity 
            style={styles.thirdContainer}
            onPress={() => handleMediaPress(media[0])}
          >
            {renderMediaItem(media[0], styles.image)}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.thirdContainer}
            onPress={() => handleMediaPress(media[1])}
          >
            {renderMediaItem(media[1], styles.image)}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.thirdContainer}
            onPress={() => handleMediaPress(media[2])}
          >
            {renderMediaItem(media[2], styles.image)}
          </TouchableOpacity>
        </View>
        
        {/* Video Player Modal */}
        <VideoPlayerModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
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
                onPress={() => handleMediaPress(item)}
              >
                {renderMediaItem(item, styles.scrollImage)}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Video Player Modal */}
        <VideoPlayerModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      </>
    )
  }

  return null
}

// Video Player Modal Component
type VideoPlayerModalProps = {
  video: Media | null
  onClose: () => void
}

const VideoPlayerModal = ({ video, onClose }: VideoPlayerModalProps) => {
  if (!video) return null

  return (
    <Modal
      visible={!!video}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X color="#FFFFFF" size={24} />
        </TouchableOpacity>
        
        <Video
          source={{ uri: video.url }}
          style={styles.videoPlayer}
          useNativeControls
          resizeMode="contain"
          shouldPlay
          isLooping
        />
      </View>
    </Modal>
  )
}

const { width } = Dimensions.get("window")
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoPlayer: {
    width: width,
    height: width * (9/16), // 16:9 aspect ratio
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
})

export default MediaGrid