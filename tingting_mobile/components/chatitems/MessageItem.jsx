import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
  SafeAreaView,
  Linking,
  highlightedMessageId,
  Animated,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
import Icon from "react-native-vector-icons/Feather"; // Thêm Feather icon

const MessageItem = ({
  msg,
  currentUserId,
  onReply,
  onForward,
  onDelete,
  onRevoke,
  messages,
  onLongPress,
  onMediaPress,
  markMessageAsRead,
  participants,
  userCache,
  isLastMessage,
}) => {
  const isCurrentUser = msg.userId === currentUserId;
  const repliedMessage = messages?.find((m) => m._id === msg.replyMessageId);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightAnim] = useState(new Animated.Value(0)); // ĐỂ highlight animation nếu cần

    // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const isLink = msg.messageType === "link";
  const isHighlighted = msg._id === highlightedMessageId;

  // Kiểm tra các điều kiện để không render tin nhắn
  const shouldNotRender =
    msg.deletedBy?.includes(currentUserId) ||
    ((msg.messageType === "image" ||
      msg.messageType === "video" ||
      msg.messageType === "file") &&
      (!msg.linkURL ||
        (Array.isArray(msg.linkURL) && msg.linkURL.length === 0)));

  // useEffect cho highlight animation
  useEffect(() => {
    if (isHighlighted) {
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 1500,
          delay: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isHighlighted, highlightAnim]);

  // Auto mark message as read when it becomes visible
  useEffect(() => {
    if (msg && !isCurrentUser && markMessageAsRead) {
      if (!msg.status?.readBy || !msg.status.readBy.includes(currentUserId)) {
        markMessageAsRead(msg._id);
      }
    }
  }, [msg, isCurrentUser, currentUserId, markMessageAsRead]);


  // Nếu không nên render, trả về null sau khi gọi tất cả hooks
  if (shouldNotRender) {
    return null;
  }
  const normalizeMediaArray = (data) =>
    Array.isArray(data)
      ? data.map((item) => (typeof item === "string" ? { url: item } : item))
      : typeof data === "string"
        ? [{ url: data }]
        : [];

  const handleMediaPress = (mediaUrl, type) => {
    setSelectedMedia(mediaUrl);
    setMediaType(type);
    setModalVisible(true);

    // For videos, we could optionally open in device's native player
    // if (type === "video") {
    //   Linking.openURL(mediaUrl);
    //   return;
    // }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMedia(null);
    setMediaType(null);
  };

  const renderImages = () => {
    const images = normalizeMediaArray(msg.linkURL);
    if (msg.messageType !== "image") return null;
    return (
      <View style={styles.imageGrid}>
        {images.map((img, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleMediaPress(img.url, "image")}
          >
            <Image
              source={{ uri: img.url }}
              style={
                images.length === 1 ? styles.imageSingle : styles.gridImage
              }
              onLoad={() => setIsLoading(false)}
            />
            {isLoading && <ActivityIndicator style={styles.mediaLoading} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderVideos = () => {
    const videos = normalizeMediaArray(msg.linkURL);
    if (msg.messageType !== "video") return null;
    return (
      <View style={styles.videosGrid}>
        {videos.map((vid, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleMediaPress(vid.url, "video")}
            style={styles.videoItemContainer}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: vid.thumbnail || vid.url }}
              style={styles.gridVideoThumbnail}
              onLoad={() => setIsLoading(false)}
            />
            {isLoading && <ActivityIndicator style={styles.mediaLoading} />}
            <View style={styles.gridVideoPlayButton}>
              <Text style={styles.videoPlayIcon}>▶</Text>
            </View>
            {vid.duration && (
              <View style={styles.gridVideoDurationContainer}>
                <Text style={styles.videoDurationText}>{vid.duration}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReply = () => {
    if (!msg.replyMessageId || msg.messageType !== "reply") return null;
    return (
      <View style={styles.replyBox}>
        <Text style={styles.repliedMessageSender}>
          {repliedMessage?.sender || ""}
        </Text>
        <Text style={styles.repliedMessageContent}>
          {repliedMessage?.messageType === "image"
            ? "[Ảnh]"
            : repliedMessage?.messageType === "file"
              ? "[Tệp]"
              : repliedMessage?.messageType === "call"
                ? `[${repliedMessage.callType === "video"
                  ? "Video call"
                  : "Voice call"
                }]`
                : repliedMessage?.content || "[Tin nhắn đã bị xóa]"}
        </Text>
        <Text style={styles.repliedMessage}>{msg.content}</Text>
      </View>
    );
  };

  const renderMediaModal = () => {
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={closeModal}
        animationType="fade"
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalContainer}>
            <SafeAreaView style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>

              {mediaType === "image" && selectedMedia && (
                <Image
                  source={{ uri: selectedMedia }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}

              {mediaType === "video" && selectedMedia && (
                <View style={styles.videoPlayerContainer}>
                  <Image
                    source={{
                      uri:
                        msg.thumbnail ||
                        (selectedMedia.includes("http")
                          ? selectedMedia
                          : null) ||
                        "https://via.placeholder.com/400x300/000000/FFFFFF?text=Video",
                    }}
                    style={styles.videoThumbnailBackground}
                    resizeMode="cover"
                  />
                  <View style={styles.videoOverlay}>
                    <TouchableOpacity
                      style={styles.playVideoButton}
                      onPress={() => Linking.openURL(selectedMedia)}
                    >
                      <Text style={styles.playButtonText}>▶</Text>
                    </TouchableOpacity>
                    <Text style={styles.openVideoText}>Tap to play video</Text>
                  </View>
                </View>
              )}
            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // const renderImages = () => {
  //   if (!msg.linkURL) return null;

  //   const images = Array.isArray(msg.linkURL) ? msg.linkURL : [msg.linkURL];

  //   return images.map((uri, index) => (
  //     <Image
  //       key={index}
  //       source={{ uri }}
  //       style={styles.imageMessage}
  //       alt="Ảnh"
  //     />
  //   ));
  // };

  const renderCallMessage = () => {
    return (
      <View style={styles.callMessage}>
        <Icon
          name={msg.callType === "video" ? "video" : "phone"}
          size={16}
          color={msg.missed ? "red" : "#555"}
        />
        <Text style={[styles.callText, { color: msg.missed ? "red" : "#555" }]}>
          {msg.callType === "video" ? "Video call" : "Voice call"} -{" "}
          {msg.callDuration}
          {msg.missed ? " (Nhỡ)" : ""}
        </Text>
      </View>
    );
  };

  const renderLinkMessage = () => {
    if (!isLink) return null;
    return (
      <TouchableOpacity onPress={() => Linking.openURL(msg.linkURL)}>
        <Text style={styles.linkMessage}>{msg.content}</Text>
      </TouchableOpacity>
    );
  };

  // {/* Call message */}
  // {msg.messageType === "call" && renderCallMessage()}
  const renderAutoLinkText = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <Text
            key={index}
            style={styles.linkMessage}
            onPress={() => Linking.openURL(url)}
          >
            {part}
          </Text>
        );
      } else {
        return (
          <Text key={index} style={styles.textMessage}>
            {part}
          </Text>
        );
      }
    });
  };

  const getMessageStatus = () => {
    // Chỉ hiển thị trạng thái cho tin nhắn của người dùng hiện tại và là tin nhắn cuối cùng
    if (!isCurrentUser || !isLastMessage) {
      return null;
    }

    // Nếu không có thông tin trạng thái, mặc định là "Đã gửi"
    if (!msg.status?.readBy || msg.status.readBy.length === 0) {
      return "Đã gửi";
    }

    // Xử lý cho nhóm chat
    if (participants && participants.length > 2) {
      const otherMembers = participants.filter(p => p.userId !== currentUserId);
      const totalOtherMembers = otherMembers.length;
      const readMembers = msg.status.readBy.filter(user => {
        const userId = typeof user === 'object' ? user._id : user;
        return userId !== currentUserId;
      });
      if (readMembers.length === totalOtherMembers) {
        return "Tất cả đã xem";
      }

      const readNames = readMembers.map(userId => {
        const id = typeof userId === 'object' ? userId._id : userId;
        const cachedUser = userCache[id];
        return cachedUser?.name || "Unknown";
      }).join(", ");

      return readNames ? `${readNames} đã xem` : "Đã gửi";
    }

    // Lấy ID của người nhận (người không phải người gửi)
    const receiverId = participants?.find(p => p.userId !== currentUserId)?.userId;
    if (!receiverId) {
      return "Đã gửi";
    }

    // Kiểm tra xem người nhận đã đọc tin nhắn chưa
    const isRead = msg.status.readBy.some(user => {
      const userId = typeof user === 'object' ? user._id : user;
      return userId === receiverId;
    });

    // Chỉ hiển thị "Đã xem" hoặc "Đã gửi" cho chat cá nhân
    return isRead ? "Đã xem" : "Đã gửi";
  };

  return (
   <Animated.View
      style={[
        styles.container,
        isCurrentUser ? styles.rightContainer : styles.leftContainer,
        {
          opacity: highlightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.7],
          }),
          transform: [
            {
              scale: highlightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={() => onLongPress(msg)}
        delayLongPress={500}
        style={styles.messageContainer}
      >
        <View
          style={[
            styles.messageBox,
            isCurrentUser ? styles.messageRightBox : styles.messageLeftBox,
            isHighlighted && styles.highlightedMessageBox, // Thêm style highlight
          ]}
        >
          {!isCurrentUser && (
            <Text style={styles.senderName}>{msg.sender}</Text>
          )}

          {msg.isRevoked ? (
            <Text style={styles.revokedText}>Tin nhắn đã được thu hồi</Text>
          ) : (
            <>
              {renderReply()}

              {msg.messageType === "text" && !msg.replyMessageId && (
                <Text style={styles.textMessage}>
                  {renderAutoLinkText(msg.content)}
                </Text>
              )}

              {renderLinkMessage()}
              {renderImages()}
              {renderVideos()}

              {msg.messageType === "file" && (
                <View style={styles.fileMessage}>
                  <Text style={styles.fileText}>
                    {msg.content || "Tệp đính kèm"}
                  </Text>
                </View>
              )}
              {/* Call message */}
              {msg.messageType === "call" && renderCallMessage()}
            </>
          )}

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timeText,
                isCurrentUser ? styles.timeTextRight : styles.timeTextLeft,
              ]}
            >
              {msg.time}
            </Text>
          </View>
        </View>
        {isCurrentUser && isLastMessage && (
          <Text style={styles.statusText}>
            {getMessageStatus()}
          </Text>
        )}
      </TouchableOpacity>

      {renderMediaModal()}
   </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 16,
    position: "relative",
  },
  messageRight: {
    alignSelf: "flex-end",
  },
  messageLeft: {
    alignSelf: "flex-start",
  },
  messageBox: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    position: "relative",
  },
  messageRightBox: {
    backgroundColor: "#dcf8c6",
  },
  messageLeftBox: {
    backgroundColor: "#fff",
  },
  senderText: {
    fontSize: 12,
    color: "gray",
    fontWeight: "bold",
  },
  revokedText: {
    fontStyle: "italic",
    color: "gray",
  },
  replyBox: {
    backgroundColor: "#f1f1f1",
    padding: 8,
    borderRadius: 5,
  },
  container: { marginBottom: 20, flexDirection: "row" },
  rightContainer: { justifyContent: "flex-end" },
  leftContainer: { justifyContent: "flex-start" },
  messageContainer: { maxWidth: "80%" },
  messageBox: { padding: 10, borderRadius: 10 },
  messageRightBox: { backgroundColor: "#DCF8C6", marginLeft: "auto" },
  messageLeftBox: { backgroundColor: "#FFF", marginRight: "auto" },
  senderName: {
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 4,
    color: "#333",
  },
  timeText: { fontSize: 11, color: "gray", marginTop: 4, textAlign: "right" },
  timeTextRight: { color: "#555" },
  timeTextLeft: { color: "#777" },
  revokedText: { color: "gray", fontStyle: "italic" },
  replyBox: {
    marginBottom: 5,
    padding: 5,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
  },
  repliedMessageSender: { fontWeight: "bold", fontSize: 12 },
  repliedMessageContent: { fontStyle: "italic", fontSize: 12, color: "#666" },
  repliedMessage: { marginTop: 5, fontSize: 14 },
  textMessage: { fontSize: 15, lineHeight: 20 },
  imageSingle: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 5,
  },
  imageGrid: {
    marginTop: 5,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  gridImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 4,
  },
  fileMessage: {
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 4,
    margin: 2,
  },
  mediaLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  fileMessage: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  fileText: {
    color: "#007bff",
  },
  callMessage: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 4,
  },
  callText: {
    fontSize: 12,
    marginLeft: 4,
  },
  time: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
    textAlign: "right",
  },
  videosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 5,
  },
  videoItemContainer: {
    width: "48%",
    marginBottom: 5,
  },
  gridVideoThumbnail: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
  },
  gridVideoPlayButton: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
  },
  videoPlayIcon: {
    fontSize: 50,
    color: "white",
  },
  gridVideoDurationContainer: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  videoDurationText: {
    color: "white",
    fontSize: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  videoPlayerContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    position: "relative",
  },
  videoThumbnailBackground: {
    width: "100%",
    height: "100%",
    position: "absolute",
    opacity: 0.5,
  },
  videoOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  playVideoButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  playButtonText: {
    color: "#fff",
    fontSize: 40,
  },
  openVideoText: {
    color: "#fff",
    marginTop: 20,
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  linkMessage: {
    color: "#007bff",
    textDecorationLine: "underline",
    fontSize: 15,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  highlightedMessageBox: {
    backgroundColor: "#FFF9C4", // Màu nền highlight (vàng nhạt)
    borderColor: "#FFD700", // Viền vàng
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default MessageItem;
