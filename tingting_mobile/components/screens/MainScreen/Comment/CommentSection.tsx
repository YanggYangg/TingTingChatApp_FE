"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import type { StackScreenProps } from "@react-navigation/stack";
import type { RootStackParamList } from "@/app/(tabs)";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

// Types based on your Mongoose schema
interface Media {
  url: string;
  type: "image" | "video";
  thumbnailUrl?: string;
}

interface Reactions {
  love: string[];
}

interface Comment {
  _id: string;
  postId: string;
  content: string;
  media?: Media[];
  replyTo?: string[];
  reactions: Reactions;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields for UI
  profileId: {
    _id: string;
    firstname: string;
    surname: string;
    avatar: string;
  };
  replies?: Comment[];
  lovedByUser: boolean;
  totalReactions: number | 0;
}

type Props = StackScreenProps<RootStackParamList, "CommentSection">;

const API_BASE_URL = "http://192.168.24.106:3006";
const CommentSection: React.FC<Props> = ({ route }) => {
  const navigator = useNavigation();
  const { postId } = route.params;
  const [idCurrentUser, setIdCurrentUser] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [selectedMedia, setSelectedMedia] = useState<
    { uri: string; type: "image" | "video" }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList | null>(null);
  const inputRef = useRef<TextInput>(null);
  const buttonsPosition = useRef(new Animated.Value(0)).current;

  const [stateLove, setStateLove] = useState(false);
  const [totalReactions, setTotalReactions] = useState(0);

  const fetchComments = async () => {
    const id = await AsyncStorage.getItem("userId");
    setIdCurrentUser(id || "");
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/comment/${postId}`
      );
      const commentsData = response.data.data.comments;
      console.log("Fetched comments:", commentsData);
      const organizedComments = organizeComments(commentsData);
      setComments(organizedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Lỗi", "Không thể tải bình luận. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    console.log("Post ID in section:", postId);


    // Fetch comments
    fetchComments();

    // Set up keyboard listeners similar to CreatePostScreen
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsFocused(true);
        animateButtons(-50); // Move buttons up

        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsFocused(false);
        animateButtons(0); // Return buttons to original position
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Animation function for buttons
  const animateButtons = (toValue: number) => {
    Animated.timing(buttonsPosition, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Function to organize comments and their replies
  const organizeComments = (allComments: Comment[]): Comment[] => {
    // Sort by newest first

    const sortedComments = [...allComments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Create a map of parent comments
    const parentComments: Comment[] = [];
    const replyMap: Record<string, Comment[]> = {};

    // First pass: identify parent comments and replies
    sortedComments.forEach((comment) => {
      if (!comment.replyTo || comment.replyTo.length === 0) {
        // This is a parent comment
        parentComments.push({ ...comment, replies: [] });
      } else {
        // This is a reply
        comment.replyTo.forEach((parentId) => {
          if (!replyMap[parentId]) {
            replyMap[parentId] = [];
          }
          replyMap[parentId].push(comment);
        });
      }
    });

    // Second pass: attach replies to parent comments
    parentComments.forEach((parent) => {
      if (replyMap[parent._id]) {
        parent.replies = replyMap[parent._id].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });

    return parentComments;
  };

  const handleLike = async (commentId: string, profileId: string) => {
    try {
      // Optimistically update UI
      setComments((prevComments) => {
        return prevComments.map((comment) => {
          if (comment._id === commentId) {
            const alreadyLoved =
              Array.isArray(comment.reactions?.love) &&
              comment.reactions.love.includes(profileId);
            const updatedLove = alreadyLoved
              ? comment.reactions.love.filter((id) => id !== profileId)
              : [...comment.reactions.love, profileId];

            return {
              ...comment,
              reactions: {
                ...comment.reactions,
                love: updatedLove,
              },
              lovedByUser: !alreadyLoved,
            };
          }

          // Check in replies
          if (comment.replies && comment.replies.length > 0) {
            const updatedReplies = comment.replies.map((reply) => {
              if (reply._id === commentId) {
                const alreadyLoved = reply.reactions.love.includes(profileId);
                const updatedLove = alreadyLoved
                  ? reply.reactions.love.filter((id) => id !== profileId)
                  : [...reply.reactions.love, profileId];

                return {
                  ...reply,
                  reactions: {
                    ...reply.reactions,
                    love: updatedLove,
                  },
                  lovedByUser: !alreadyLoved,
                };
              }
              return reply;
            });

            return {
              ...comment,
              replies: updatedReplies,
            };
          }

          return comment;
        });
      });
      const id = await AsyncStorage.getItem("userId");
      console.log("Comment loved:", commentId, profileId);
      // Gửi yêu cầu backend
      
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/comment/${commentId}/love`,
        {
          profileId: id,
        }
      );
      console.log("Response from server:", res.data);
      if (res.data?.lovedByUser === true) {
        
        setStateLove(true);
        setTotalReactions((prev) => prev + 1);
      } else {
        setStateLove(false);
        setTotalReactions((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error loving comment:", error);
      Alert.alert(
        "Lỗi",
        "Không thể yêu thích bình luận. Vui lòng thử lại sau."
      );
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    // Focus on the input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Xử lý chọn ảnh từ thư viện
  const pickImage = async () => {
    try {
      // Yêu cầu quyền truy cập thư viện ảnh
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Ứng dụng cần quyền truy cập vào thư viện ảnh để chọn ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedMedia([
          ...selectedMedia,
          { uri: result.assets[0].uri, type: "image" },
        ]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại sau.");
    }
  };

  // Xử lý xóa ảnh đã chọn
  const removeMedia = (index: number) => {
    const newMedia = [...selectedMedia];
    newMedia.splice(index, 1);
    setSelectedMedia(newMedia);
  };

  // Gửi bình luận lên server
  const submitComment = async () => {
    if (!commentText.trim() && selectedMedia.length === 0) return;

    try {
      setIsLoading(true);

      // Lấy profileId từ AsyncStorage
      const profileId = await AsyncStorage.getItem("userId");
      if (!profileId) {
        Alert.alert(
          "Lỗi",
          "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
        );
        setIsLoading(false);
        return;
      }

      // Tạo FormData để gửi dữ liệu và file
      const formData = new FormData();
      formData.append("profileId", profileId);
      formData.append("postId", postId);
      formData.append("content", commentText);

      // Thêm replyTo nếu đang trả lời bình luận
      if (replyingTo) {
        formData.append("replyTo", replyingTo);
      }

      // Thêm media nếu có
      selectedMedia.forEach((media, index) => {
        const uriParts = media.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];

        formData.append("files", {
          uri: media.uri,
          name: `media_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      });

      // Gửi request đến API
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/comment`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Comment created:", response.data);

      // Làm mới danh sách bình luận
      await fetchComments();

      // Reset form
      setCommentText("");
      setSelectedMedia([]);
      setReplyingTo(null);
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error creating comment:", error);
      Alert.alert("Lỗi", "Không thể đăng bình luận. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // diff in seconds

    if (diff < 60) {
      return `${diff} giây trước`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)} phút trước`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)} giờ trước`;
    } else if (diff < 2592000) {
      // less than 30 days
      return `${Math.floor(diff / 86400)} ngày trước`;
    } else {
      // Format as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  const renderMedia = (media: Media[]) => {
    if (!media || media.length === 0) return null;

    return (
      <View style={styles.mediaContainer}>
        {media.map((item, index) => (
          <View key={index} style={styles.mediaItem}>
            {item.type === "image" ? (
              <Image
                source={{ uri: item.url }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoContainer}>
                <Image
                  source={{ uri: item.thumbnailUrl || item.url }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
                <View style={styles.playButton}>
                  <Ionicons name="play" size={24} color="white" />
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderReactionCount = (reactions: Reactions) => {
    const total = reactions.love.length;
    if (total === 0) return null;

    return (
      <View style={styles.reactionCount}>
        <Ionicons name="heart" size={12} color="#FF3B30" />
        <Text style={styles.reactionText}>{total}</Text>
      </View>
    );
  };

  const renderComment = ({ item }: { item: Comment }) => {
    return (
      <View style={styles.commentContainer}>
        <Image source={{ uri: item.profileId?.avatar }} style={styles.avatar} />
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.userName}>
              {item.profileId?.surname} {item.profileId?.firstname}
            </Text>
            <Text style={styles.commentText}>{item.content}</Text>
            {renderMedia(item.media || [])}
          </View>

          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item._id, idCurrentUser)}
            >
              <Text
                style={[
                  styles.actionText,
                  { color: item.lovedByUser ? "red" : "black" },
                ]}
              >
                Thích
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleReply(item._id)}
            >
              <Text style={styles.actionText}>Trả lời</Text>
            </TouchableOpacity>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
            {renderReactionCount(item.reactions)}
          </View>

          {/* Render replies */}
          {item.replies && item.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {item.replies.map((reply) => (
                <View key={reply._id} style={styles.replyContainer}>
                  <Image
                    source={{ uri: reply.profileId?.avatar }}
                    style={styles.replyAvatar}
                  />
                  <View style={styles.replyContent}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.userName}>
                        {reply.profileId?.surname} {reply.profileId?.firstname}
                      </Text>
                      <Text style={styles.commentText}>{reply.content}</Text>
                      {renderMedia(reply.media || [])}
                    </View>

                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleLike(reply._id, reply.profileId._id)}
                      >
                        <Text style={[styles.actionText, { color: reply.lovedByUser ? "red" : "black" }]}>Thích</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleReply(item._id)}
                      >
                        <Text style={styles.actionText}>Trả lời</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeText}>
                        {formatTime(reply.createdAt)}
                      </Text>
                      {renderReactionCount(reply.reactions)}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render ảnh đã chọn
  const renderSelectedMedia = () => {
    if (selectedMedia.length === 0) return null;

    return (
      <View style={styles.selectedMediaContainer}>
        {selectedMedia.map((media, index) => (
          <View key={index} style={styles.selectedMediaItem}>
            <Image
              source={{ uri: media.uri }}
              style={styles.selectedMediaImage}
            />
            <TouchableOpacity
              style={styles.removeMediaButton}
              onPress={() => removeMedia(index)}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigator.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bình luận</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.commentsList,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight / 3 }, // Add padding when keyboard is visible
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        {/* Input container with animation similar to CreatePostScreen */}
        <Animated.View
          style={[
            styles.inputContainer,
            { transform: [{ translateY: buttonsPosition }] },
          ]}
        >
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                Đang trả lời bình luận
                <TouchableOpacity onPress={() => setReplyingTo(null)}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color="#666"
                    style={{ marginLeft: 5 }}
                  />
                </TouchableOpacity>
              </Text>
            </View>
          )}

          {/* Hiển thị ảnh đã chọn */}
          {renderSelectedMedia()}

          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={[styles.input, { height: Math.max(40, inputHeight) }]}
              placeholder="Nhập bình luận..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              onContentSizeChange={(e) => {
                setInputHeight(Math.min(100, e.nativeEvent.contentSize.height));
              }}
              onFocus={() => {
                setIsFocused(true);
                animateButtons(-50);
              }}
            />
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendButton,
                commentText.trim() || selectedMedia.length > 0
                  ? styles.sendButtonActive
                  : null,
                isLoading && styles.sendButtonDisabled,
              ]}
              onPress={submitComment}
              disabled={
                (!commentText.trim() && selectedMedia.length === 0) || isLoading
              }
            >
              {isLoading ? (
                <Ionicons name="hourglass-outline" size={24} color="#CCC" />
              ) : (
                <Ionicons
                  name="send"
                  size={24}
                  color={
                    commentText.trim() || selectedMedia.length > 0
                      ? "#0084FF"
                      : "#CCC"
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0084FF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight || 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  menuButton: {
    padding: 4,
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: "#F0F2F5",
    borderRadius: 18,
    padding: 12,
    maxWidth: "90%",
  },
  userName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 8,
  },
  actionButton: {
    marginRight: 16,
  },
  actionText: {
    fontSize: 13,
    color: "#65676B",
    fontWeight: "500",
  },
  timeText: {
    fontSize: 12,
    color: "#65676B",
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 16,
  },
  replyContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  mediaContainer: {
    marginTop: 8,
  },
  mediaItem: {
    marginBottom: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  videoContainer: {
    position: "relative",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionCount: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reactionText: {
    fontSize: 12,
    color: "#65676B",
    marginLeft: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E4E6EB",
    padding: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  replyingToContainer: {
    backgroundColor: "#F0F2F5",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: "#65676B",
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    minHeight: 40,
  },
  mediaButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonActive: {
    opacity: 1,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  selectedMediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  selectedMediaItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 4,
    position: "relative",
  },
  selectedMediaImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeMediaButton: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CommentSection;
