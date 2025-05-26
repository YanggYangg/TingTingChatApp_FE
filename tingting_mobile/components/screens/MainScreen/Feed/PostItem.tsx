import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons, FontAwesome, AntDesign, Feather } from "@expo/vector-icons";
import { Video, Audio } from "expo-av";
import axios from "axios";
import { useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

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
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

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

  // Hàm mở modal xem media (ảnh/video)
  const openMediaModal = (index: number) => {
    setSelectedMediaIndex(index);
    setShowMediaModal(true);
  };

  // Hàm đóng modal
  const closeMediaModal = () => {
    setShowMediaModal(false);
  };

  // Component hiển thị media có thể nhấn
  const TouchableMedia = ({ source, style, index, type, thumbnailUrl }: { 
    source: any, 
    style: any, 
    index: number,
    type: "image" | "video",
    thumbnailUrl?: string
  }) => (
    <TouchableOpacity onPress={() => openMediaModal(index)} activeOpacity={0.9}>
      {type === "video" ? (
        <View style={{ position: "relative" }}>
          <Image 
            source={{ uri: thumbnailUrl || source.uri }} 
            style={style} 
          />
          <View style={styles.playButtonOverlay}>
            <Ionicons name="play-circle" size={50} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      ) : (
        <Image source={source} style={style} />
      )}
    </TouchableOpacity>
  );

  const renderImageGrid = () => {
    if (media.length === 0) return null;

    if (media.length === 1) {
      return (
        <View style={styles.singleImageContainer}>
          <TouchableMedia 
            source={{ uri: media[0].url }} 
            style={styles.singleImage}
            index={0}
            type={media[0].type}
            thumbnailUrl={media[0].thumbnailUrl}
          />
        </View>
      );
    } else if (media.length === 2) {
      return (
        <View style={styles.twoImagesContainer}>
          {media.map((item, index) => (
            <TouchableMedia
              key={index}
              source={{ uri: item.url }}
              style={styles.twoImage}
              index={index}
              type={item.type}
              thumbnailUrl={item.thumbnailUrl}
            />
          ))}
        </View>
      );
    } else if (media.length === 3) {
      return (
        <View style={styles.threeImagesContainer}>
          <TouchableMedia 
            source={{ uri: media[0].url }} 
            style={styles.threeImageMain}
            index={0}
            type={media[0].type}
            thumbnailUrl={media[0].thumbnailUrl}
          />
          <View style={styles.threeImageSideContainer}>
            {media.slice(1, 3).map((item, index) => (
              <TouchableMedia
                key={index}
                source={{ uri: item.url }}
                style={styles.threeImageSide}
                index={index + 1}
                type={item.type}
                thumbnailUrl={item.thumbnailUrl}
              />
            ))}
          </View>
        </View>
      );
    } else {
      const remainingCount = media.length - 4;
      return (
        <View style={styles.multipleImagesContainer}>
          <View style={styles.multipleImagesRow}>
            {media.slice(0, 2).map((item, index) => (
              <TouchableMedia
                key={index}
                source={{ uri: item.url }}
                style={styles.multipleImage}
                index={index}
                type={item.type}
                thumbnailUrl={item.thumbnailUrl}
              />
            ))}
          </View>
          <View style={styles.multipleImagesRow}>
            {media.slice(2, 4).map((item, index) => (
              <View key={index} style={{ position: "relative" }}>
                <TouchableMedia
                  source={{ uri: item.url }}
                  style={styles.multipleImage}
                  index={index + 2}
                  type={item.type}
                  thumbnailUrl={item.thumbnailUrl}
                />
                {index === 1 && remainingCount > 0 && (
                  <TouchableOpacity 
                    style={styles.remainingCountOverlay}
                    onPress={() => openMediaModal(index + 2)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.remainingCountText}>
                      +{remainingCount}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      );
    }
  };

  // Modal hiển thị media (ảnh/video) phóng to
  const renderMediaModal = () => (
    <Modal
      visible={showMediaModal}
      transparent={true}
      animationType="fade"
      onRequestClose={closeMediaModal}
    >
      <View style={styles.modalContainer}>
        <StatusBar backgroundColor="black" barStyle="light-content" />
        
        {/* Header modal */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeMediaModal} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {selectedMediaIndex + 1} / {media.length}
          </Text>
          <View style={styles.modalHeaderRight} />
        </View>

        {/* Media có thể scroll */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setSelectedMediaIndex(newIndex);
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

        {/* Dots indicator */}
        {media.length > 1 && (
          <View style={styles.dotsContainer}>
            {media.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  selectedMediaIndex === index && styles.activeDot
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );

  const handleToggleLike = async () => {
    const id = await AsyncStorage.getItem("userId");
    try {
      const response = await axios.post(
        `http://192.168.1.9:3006/api/v1/post/${_id}/love`,
        {
          profileId: id,
        }
      );
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
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

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

      {/* Media Grid */}
      {renderImageGrid()}

      {/* Media Modal */}
      {renderMediaModal()}

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
  singleImageContainer: {
    marginBottom: 8,
  },
  singleImage: {
    width: "100%",
    height: width * 0.8,
  },
  twoImagesContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  twoImage: {
    width: width / 2,
    height: width / 2,
  },
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
  playButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  closeButton: {
    padding: 10,
  },
  modalTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalHeaderRight: {
    width: 50,
  },
  mediaScrollContainer: {
    width: width,
    height: height - 120,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: width,
    height: height - 120,
  },
  fullVideo: {
    width: width,
    height: height - 120,
  },
  imageScrollContainer: {
    width: width,
    height: height - 120,
  },
  fullImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: width,
    height: height - 120,
  },
  fullImage: {
    width: width,
    height: height - 120,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "white",
  },
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