import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons, FontAwesome, AntDesign, Feather } from "@expo/vector-icons";
import axios from "axios";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export type Media = {
  url: string;
  type: "image" | "video";
  thumbnailUrl?: string;
};

export type Reactions = {
  love: String[];
};

export type PostProps = {
  _id: string;
  profileId: {
    _id: string;
    firstname: string;
    surname: string;
    avatar: string;
  };
  content: string;
  media: Media[];
  privacy: "public" | "friends" | "private";
  tags: string[];
  reactions: Reactions;
  commentsCount: number;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  lovedByUser: boolean;
  totalReactions: number | 0;
};

const PostItem: React.FC<PostProps> = ({
  _id,
  profileId,
  content,
  media,
  createdAt,
  lovedByUser,
  privacy,
  reactions,
  commentsCount,
  totalReactions,
}) => {
  const navigator = useNavigation();
  const [reactLove, setReactLove] = useState(lovedByUser || false);
  const [countReaction, setCountReaction] = useState(totalReactions || 0);

  const renderImageGrid = () => {
    if (media.length === 0) return null;

    if (media.length === 1) {
      // Hiển thị 1 hình ảnh với kích thước lớn
      return (
        <View style={styles.singleImageContainer}>
          <Image source={{ uri: media[0].url }} style={styles.singleImage} />
        </View>
      );
    } else if (media.length === 2) {
      // Hiển thị 2 hình ảnh cạnh nhau
      return (
        <View style={styles.twoImagesContainer}>
          {media.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image.url }}
              style={styles.twoImage}
            />
          ))}
        </View>
      );
    } else if (media.length === 3) {
      // Hiển thị 3 hình ảnh: 1 lớn bên trái, 2 nhỏ bên phải
      return (
        <View style={styles.threeImagesContainer}>
          <Image source={{ uri: media[0].url }} style={styles.threeImageMain} />
          <View style={styles.threeImageSideContainer}>
            {media.slice(1, 3).map((image, index) => (
              <Image
                key={index}
                source={{ uri: image.url }}
                style={styles.threeImageSide}
              />
            ))}
          </View>
        </View>
      );
    } else {
      // Hiển thị 4+ hình ảnh: grid 2x2 với "+n" cho các hình còn lại
      const remainingCount = media.length - 4;
      return (
        <View style={styles.multipleImagesContainer}>
          <View style={styles.multipleImagesRow}>
            {media.slice(0, 2).map((image, index) => (
              <Image
                key={index}
                source={{ uri: image.url }}
                style={styles.multipleImage}
              />
            ))}
          </View>
          <View style={styles.multipleImagesRow}>
            {media.slice(2, 4).map((image, index) => (
              <View key={index} style={{ position: "relative" }}>
                <Image
                  source={{ uri: image.url }}
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
  const handleToggleLike = async () => {
    const id = await AsyncStorage.getItem("userId");
    try {
      const response = await axios.post(
        `http://192.168.1.12:3006/api/v1/post/${_id}/love`,
        {
          profileId: id,
        }
      );
      console.log("_id:", _id);
      console.log("Profile author:", profileId._id);
      console.log("Profile ID:", id);
      console.log("Response from toggle love - Feed:", response.data);
      if (response.data?.lovedByUser === true) {
        setReactLove(true);
        setCountReaction((prev) => prev + 1);
      } else {
        setReactLove(false);
        setCountReaction((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error toggling love:", error);
    }
  };
  const navigateToCommentSection = async () => {
    navigator.navigate("CommentSection", {
      postId: _id,
    });
  };
  const navigateToProfile = async () => {
    navigator.navigate("ProfileScreen", {
      profileId: profileId._id,
    });
  };
  const navigateToFeedOptions = async () => {
    navigator.navigate("FeedOptions", {
      postId: _id,
      profileId: profileId._id,
    });
  };
  const formatTime = (createAt: string) => {
    const date = new Date(createAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // diff in seconds

    if (diff < 60) {
      return `${diff} giây trước`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)} phút trước`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)} giờ trước`;
    } else if (diff < 2592000) {
      return `${Math.floor(diff / 86400)} ngày trước`;
    } else {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  return (
    <View style={styles.container}>
      {/* User Info */}
      <View style={styles.userInfoContainer}>
        <TouchableOpacity onPress={navigateToProfile}>
          <Image source={{ uri: profileId.avatar }} style={styles.userAvatar} />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={navigateToProfile}>
          <Text style={styles.userName}>
            {profileId.firstname} {profileId.surname}
          </Text>
          </TouchableOpacity>
          <Text style={styles.timestamp}>{formatTime(createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.moreButton}
          onPress={navigateToFeedOptions}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      {content ? <Text style={styles.contentText}>{content}</Text> : null}

      {/* Images */}
      {renderImageGrid()}

      {/* Music Player (if available) */}
      {/* {music && (
        <View style={styles.musicPlayer}>
          <FontAwesome name="music" size={16} color="#666" />
          <Text style={styles.musicTitle}>
            {music.title} - {music.artist}
          </Text>
          <TouchableOpacity style={styles.musicPlayButton}>
            <FontAwesome name="play" size={14} color="white" />
          </TouchableOpacity>
        </View>
      )} */}

      {/* Interaction Buttons */}
      <View style={styles.interactionContainer}>
        <View style={styles.likesCommentsCount}>
          {countReaction > 0 && (
            <View style={styles.countItem}>
              <FontAwesome name="heart" size={14} color="#E53935" />
              <Text style={styles.countText}>{countReaction}</Text>
            </View>
          )}
          {commentsCount > 0 && (
            <Text style={styles.countText}>{commentsCount} bình luận</Text>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleLike}
          >
            <AntDesign
              name="heart"
              size={20}
              color={reactLove ? "red" : "#666"}
            />
            <Text style={[styles.actionText, reactLove && { color: "red" }]}>
              Thích | {countReaction}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={navigateToCommentSection}
          >
            <Feather name="message-square" size={20} color="#666" />
            <Text style={styles.actionText}></Text>
          </TouchableOpacity>
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
    width: width * 0.66 - 20,
    height: width * 0.66 - 20,
  },
  threeImageSideContainer: {
    width: width * 0.34 - 20,
    height: width * 0.66 - 20,
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
    width: width / 2 - 20,
    height: width / 2 - 20,
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
  actionsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 10,
  },
  actionText: {
    marginLeft: 5,
    color: "#666",
  },
  rightActions: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  iconButton: {
    padding: 5,
    marginLeft: 10,
  },
});

export default PostItem;
