import { View, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from "react-native"
import type { Media } from "../types/post"

type MediaGridProps = {
  media: Media[]
}

const MediaGrid = ({ media }: MediaGridProps) => {
  // Handle 1-3 media items with grid layout
  if (media.length === 1) {
    return (
      <TouchableOpacity style={styles.singleContainer}>
        <Image source={{ uri: media[0].url }} style={styles.singleImage} resizeMode="cover" />
      </TouchableOpacity>
    )
  }

  if (media.length === 2) {
    return (
      <View style={styles.rowContainer}>
        <TouchableOpacity style={styles.halfContainer}>
          <Image source={{ uri: media[0].url }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.halfContainer}>
          <Image source={{ uri: media[1].url }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
      </View>
    )
  }

  if (media.length === 3) {
    return (
      <View style={styles.rowContainer}>
        <TouchableOpacity style={styles.thirdContainer}>
          <Image source={{ uri: media[0].url }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.thirdContainer}>
          <Image source={{ uri: media[1].url }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.thirdContainer}>
          <Image source={{ uri: media[2].url }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
      </View>
    )
  }

  // For more than 3 images, use horizontal ScrollView
  if (media.length > 3) {
    return (
      <View style={styles.scrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {media.map((item, index) => (
            <TouchableOpacity key={index} style={styles.scrollImageContainer}>
              <Image source={{ uri: item.url }} style={styles.scrollImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  return null
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
})

export default MediaGrid
