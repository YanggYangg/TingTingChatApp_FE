import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface PostImage {
  uri: string;
}

interface PostProps {
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  images: PostImage[];
  timestamp: string;
  likes: number;
  comments: number;
  music?: {
    title: string;
    artist: string;
  };
}

const PostItem: React.FC<PostProps> = ({
  user,
  content,
  images,
  timestamp,
  likes,
  comments,
  music,
}) => {
  const renderImageGrid = () => {
    if (images.length === 0) return null;

    if (images.length === 1) {
      // Hiển thị 1 hình ảnh với kích thước lớn
      return (
        <View style={styles.singleImageContainer}>
          <Image source={{ uri: images[0].uri }} style={styles.singleImage} />
        </View>
      );
    } else if (images.length === 2) {
      // Hiển thị 2 hình ảnh cạnh nhau
      return (
        <View style={styles.twoImagesContainer}>
          {images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image.uri }}
              style={styles.twoImage}
            />
          ))}
        </View>
      );
    } else if (images.length === 3) {
      // Hiển thị 3 hình ảnh: 1 lớn bên trái, 2 nhỏ bên phải
      return (
        <View style={styles.threeImagesContainer}>
          <Image
            source={{ uri: images[0].uri }}
            style={styles.threeImageMain}
          />
          <View style={styles.threeImageSideContainer}>
            {images.slice(1, 3).map((image, index) => (
              <Image
                key={index}
                source={{ uri: image.uri }}
                style={styles.threeImageSide}
              />
            ))}
          </View>
        </View>
      );
    } else {
      // Hiển thị 4+ hình ảnh: grid 2x2 với "+n" cho các hình còn lại
      const remainingCount = images.length - 4;
      return (
        <View style={styles.multipleImagesContainer}>
          <View style={styles.multipleImagesRow}>
            {images.slice(0, 2).map((image, index) => (
              <Image
                key={index}
                source={{ uri: image.uri }}
                style={styles.multipleImage}
              />
            ))}
          </View>
          <View style={styles.multipleImagesRow}>
            {images.slice(2, 4).map((image, index) => (
              <View key={index} style={{ position: "relative" }}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.multipleImage}
                />
                {index === 1 && remainingCount > 0 && (
                  <View style={styles.remainingCountOverlay}>
                    <Text style={styles.remainingCountText}>
                      +{remainingCount}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      {content ? <Text style={styles.contentText}>{content}</Text> : null}

      {/* Images */}
      {renderImageGrid()}

      {/* Music Player (if available) */}
      {music && (
        <View style={styles.musicPlayer}>
          <FontAwesome name="music" size={16} color="#666" />
          <Text style={styles.musicTitle}>
            {music.title} - {music.artist}
          </Text>
          <TouchableOpacity style={styles.musicPlayButton}>
            <FontAwesome name="play" size={14} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Interaction Buttons */}
      <View style={styles.interactionContainer}>
        <View style={styles.likesCommentsCount}>
          {likes > 0 && (
            <View style={styles.countItem}>
              <FontAwesome name="heart" size={14} color="#E53935" />
              <Text style={styles.countText}>{likes}</Text>
            </View>
          )}
          {comments > 0 && (
            <Text style={styles.countText}>{comments} bình luận</Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <View style={styles.reactionButtons}>
          <TouchableOpacity style={styles.likeButton}>
            <Ionicons name="heart-outline" size={24} color="#616161" />
            <Text style={styles.actionText}>Thích</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.commentButton}>
            <Ionicons name="chatbubble-outline" size={24} color="#616161" />
            <Text style={styles.actionText}>0</Text>
          </TouchableOpacity>
          </View>
         

          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={20} color="#9E9E9E" />
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#616161" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userInfoContainer: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  moreButton: {
    padding: 4,
  },
  contentText: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 16,
  },

  // Single image styles
  singleImageContainer: {
    marginBottom: 8,
  },
  singleImage: {
    width: "100%",
    height: width * 0.8,
  },

  // Two images styles
  twoImagesContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  twoImage: {
    width: width / 2,
    height: width / 2,
  },

  // Three images styles
  threeImagesContainer: {
    paddingHorizontal: 12,
    backgroundColor: "#f0f0ff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  threeImageMain: {
    width: (width * 0.66)-20,
    height: (width * 0.66)-20,
  },
  threeImageSideContainer: {
    width: (width * 0.34)-20,
    height: (width * 0.66)-20,
    justifyContent: "space-between",
  },
  threeImageSide: {
    width: width * 0.34 - 20,
    height: width * 0.33 - 20,
  },

  // Multiple images styles
  multipleImagesContainer: {
    paddingHorizontal: 12,
    backgroundColor: "#f0f0ff",
    marginBottom: 8,
  },
  multipleImagesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: width / 2,
  },
  multipleImage: {
    width: (width / 2) - 20,
    height: (width / 2) - 20,
  },
  remainingCountOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  remainingCountText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  // Music player
  musicPlayer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  musicTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  musicPlayButton: {
    backgroundColor: "#1E88E5",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Interaction
  interactionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  likesCommentsCount: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  countItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  countText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  reactionButtons: {
    width: 180,
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
  },
  likeButton: {
    width: 90,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    padding: 6,
  },
  commentButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    padding: 6,
  },
  lockIcon: {
    width: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 5,
    color: "#616161",
  },
});

export default PostItem;
