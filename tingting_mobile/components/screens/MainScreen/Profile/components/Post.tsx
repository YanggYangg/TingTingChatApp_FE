import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather, AntDesign } from "@expo/vector-icons";
import type { Post as PostType } from "../types/post";
import MediaGrid from "./MediaGrid";
import { useNavigation } from "expo-router";
import axios from "axios";
import { Api_Post } from "@/apis/api_post";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PostProps = {
  post: PostType;
};

const Post = ({ post }: PostProps) => {
 
  const navigator = useNavigation();
  const [lovedByUser, setLovedByUser] = useState(post.lovedByUser || false);
  const [totalReactions, setTotalReactions] = useState(
    post.totalReactions || 0
  );
  console.log("lovedByUser:", lovedByUser);
  console.log("totalReactions:", totalReactions);
  

  const navigateToCommentSection = async () => {
    navigator.navigate("CommentSection", {
      postId: post._id,
    });
  };
  const handleTogglePrivacySettings = () => {
    console.log("Post ID before privacy setting:", post._id);
    navigator.navigate("PrivacySettings", {
      postId: post._id,
    });
  };
  const handleTogglePostOptions = () => {
    console.log("Post ID before option setting:", post._id);
    navigator.navigate("PostOptions", {
      postId: post._id,
    });
  };

  const handleToggleLike = async () => {
    const id = await AsyncStorage.getItem("userId");
    try {
      const response = await axios.post(
        `http://192.168.1.171:3006/api/v1/post/${post._id}/love`,
        {
          profileId: id,
        }
      );
      console.log("Response from toggle love - Post Profile:", response.data);
      if (response.data?.lovedByUser === true) {
        setLovedByUser(true);
        setTotalReactions((prev) => prev + 1);
      } else {
        setLovedByUser(false);
        setTotalReactions((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error toggling love:", error);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.timelineConnector}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.content}>{post.content}</Text>

        {post.media && post.media.length > 0 && (
          <MediaGrid media={post.media} />
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleLike}
          >
            <AntDesign
              name="heart"
              size={20}
              color={lovedByUser ? "red" : "#666"}
            />
            <Text style={[styles.actionText, lovedByUser && { color: "red" }]}>
              Thích | {totalReactions}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={navigateToCommentSection}
          >
            <Feather name="message-square" size={20} color="#666" />
            <Text style={styles.actionText}></Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleTogglePrivacySettings}
            >
              {post.privacy === "private" ? (
                <Feather name="lock" size={20} color="#666" />
              ) : post.privacy === "public" ? (
                <Feather name="user" size={20} color="#666" />
              ) : (
                <Feather name="users" size={20} color="#666" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleTogglePostOptions}
            >
              <Feather name="more-horizontal" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 10,
  },
  timelineConnector: {
    width: 30,
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ddd",
    marginTop: 10,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#ddd",
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  content: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
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

export default Post;
