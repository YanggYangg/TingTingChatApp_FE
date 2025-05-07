import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useSocket } from "../../../../contexts/SocketContext";
import MessageItem from "../../../chatitems/MessageItem";
import ChatFooter from "./ChatFooter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Api_Profile } from "../../../../apis/api_profile";
import ShareModal from "../Chat/chatInfoComponent/ShareModal";
import {
  onConversationUpdate,
  offConversationUpdate,
  joinConversation,
  onConversationRemoved,
} from "../../../../services/sockets/events/conversation"; // Nhi thêm
import {
  onChatInfoUpdated,
  offChatInfoUpdated,
  onGroupLeft,
  offGroupLeft,
} from "../../../../services/sockets/events/chatInfo"; // Nhi thêm

const ChatScreen = ({ route, navigation }) => {
  const { socket, userId: currentUserId } = useSocket();
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [conversationInfo, setConversationInfo] = useState({
    // Nhi thêm: Thêm state conversationInfo
    name: "",
    isGroup: false,
    participants: [],
    imageGroup: null,
  });

  const { message, user } = route?.params || {};
  const conversationId = message?.id || null;
  const userId = currentUserId || null;

  console.log("ChatScreen params:", {
    userId,
    conversationId,
    message,
    user,
    routeParams: route.params,
  });

  const selectedMessageData = useSelector((state) => state.chat.selectedMessage);
  const selectedMessageId = selectedMessageData?.id;

  // Fetch user info using the Api_Profile.getProfile API
  const fetchUserInfo = async (userId) => {
    if (!userId) {
      console.warn("fetchUserInfo: userId is undefined or null");
      return {
        name: "Người dùng ẩn danh",
        avatar: "https://picsum.photos/200",
      };
    }

    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const response = await Api_Profile.getProfile(userId);
      let userInfo;

      if (response?.data?.user) {
        userInfo = {
          name: `${response.data.user.firstname || ""} ${
            response.data.user.surname || ""
          }`.trim() || `Người dùng ${userId.slice(-4)}`,
          avatar: response.data.user.avatar || "https://picsum.photos/200",
        };
      } else {
        userInfo = {
          name: `Người dùng ${userId.slice(-4)}`,
          avatar: "https://picsum.photos/200",
        };
      }

      setUserCache((prev) => ({ ...prev, [userId]: userInfo }));
      console.log(`Fetched user info for userId ${userId}:`, userInfo);
      return userInfo;
    } catch (error) {
      console.error(`Failed to fetch user info for userId ${userId}:`, error);
      const fallbackUserInfo = {
        name: `Người dùng ${userId.slice(-4)}`,
        avatar: "https://picsum.photos/200",
      };
      setUserCache((prev) => ({ ...prev, [userId]: fallbackUserInfo }));
      return fallbackUserInfo;
    }
  };

  // Load user info when messages change
  useEffect(() => {
    const loadUserInfos = async () => {
      const userIds = [
        ...new Set(
          messages
            .map((msg) => msg.userId)
            .filter((id) => id !== currentUserId && id)
        ),
      ];
      for (const userId of userIds) {
        await fetchUserInfo(userId);
      }
    };

    if (messages.length > 0) {
      loadUserInfos();
    }
  }, [messages, currentUserId]);

  // Nhi thêm: Initialize conversation info
  useEffect(() => {
    if (message) {
      setConversationInfo({
        name: message.name || "",
        isGroup: message.isGroup || false,
        participants: message.participants || [],
        imageGroup: message.imageGroup || null,
      });
    }
  }, [message]);

  // Socket.IO setup for regular chat
  useEffect(() => {
    if (!socket || !selectedMessageId || !currentUserId) {
      console.warn("Socket setup skipped: missing socket, selectedMessageId, or currentUserId", {
        socket: !!socket,
        selectedMessageId,
        currentUserId,
      });
      return;
    }

    // Nhi thêm: Kiểm tra và kết nối socket nếu chưa kết nối
    if (!socket.connected) {
      console.warn("Socket not connected, attempting to connect", { socketId: socket.id });
      socket.connect();
    }

    console.log("Joining conversation with ID:", selectedMessageId);
    joinConversation(socket, selectedMessageId); // Nhi thêm: Sử dụng joinConversation thay vì socket.emit

    socket.on("loadMessages", (data) => {
      console.log("Received loadMessages:", data);
      setMessages(data);
    });

    socket.on("receiveMessage", (newMessage) => {
      console.log("Received receiveMessage:", newMessage);
      setMessages((prev) =>
        prev.some((msg) => msg._id === newMessage._id)
          ? prev
          : [...prev, newMessage]
      );
    });

    socket.on("messageSent", (newMessage) => {
      console.log("Received messageSent:", newMessage);
      setMessages((prev) =>
        prev.some((msg) => msg._id === newMessage._id)
          ? prev
          : [...prev, newMessage]
      );
    });

    socket.on("messageRevoked", ({ messageId }) => {
      console.log("Received messageRevoked for messageId:", messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isRevoked: true } : msg
        )
      );
    });

    socket.on("messageDeleted", ({ messageId }) => {
      console.log("Received messageDeleted for messageId:", messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    socket.on("deleteMessageError", (error) => {
      console.error("Delete message error:", error);
      Alert.alert("Lỗi", error.message || "Không thể xóa tin nhắn");
    });

    // Nhi thêm: Xử lý xóa toàn bộ lịch sử trò chuyện
    socket.on("deleteAllChatHistory", ({ conversationId: deletedConversationId, deletedBy }) => {
      console.log("ChatScreen: Nhận deleteAllChatHistory", { deletedConversationId, deletedBy });
      if (deletedConversationId === selectedMessageId) {
        if (deletedBy === currentUserId) {
          setMessages([]);
          Alert.alert("Thành công", "Lịch sử trò chuyện đã được xóa!");
          navigation.navigate("Main", { screen: "MessageScreen", params: { refresh: true } });
        } else {
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => !msg.deletedBy?.includes(deletedBy))
          );
          console.log("ChatScreen: Giữ nguyên tin nhắn cho người không xóa", { userId: currentUserId });
        }
      }
    });

    // Nhi thêm: Cập nhật thông tin cuộc trò chuyện
    onConversationUpdate(socket, (updatedConversation) => {
      console.log("ChatScreen: Received conversationUpdate:", updatedConversation);
      setConversationInfo((prev) => ({
        ...prev,
        name: updatedConversation.name || prev.name,
        lastMessage: updatedConversation.lastMessage?.content || "",
        lastMessageType: updatedConversation.lastMessage?.messageType || "text",
        lastMessageSenderId: updatedConversation.lastMessage?.userId || null,
        time: new Date(updatedConversation.updatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
    });

    // Nhi thêm: Cập nhật thông tin nhóm
    onChatInfoUpdated(socket, (updatedInfo) => {
      console.log("ChatScreen: Received chatInfoUpdated:", updatedInfo);
      setConversationInfo((prev) => ({
        ...prev,
        name: updatedInfo.name || prev.name,
        isGroup: updatedInfo.isGroup ?? prev.isGroup,
        participants: updatedInfo.participants || prev.participants,
        imageGroup: updatedInfo.imageGroup || prev.imageGroup,
      }));
    });

    // Nhi thêm: Xử lý rời nhóm
    onGroupLeft(socket, (data) => {
      console.log("ChatScreen: Received groupLeft:", data);
      if (data.conversationId === selectedMessageId) {
        Alert.alert("Thông báo", "Bạn đã rời khỏi nhóm.");
        navigation.navigate("Main", { screen: "MessageScreen" });
      }
    });

    // Nhi thêm: Xử lý giải tán nhóm
    onConversationRemoved(socket, (data) => {
      console.log("ChatScreen: Received conversationRemoved:", data);
      if (data.conversationId === selectedMessageId) {
        Alert.alert("Thông báo", "Nhóm đã được giải tán.");
        navigation.navigate("Main", { screen: "MessageScreen" });
      }
    });

    return () => {
      console.log("Cleaning up socket listeners for ChatScreen");
      socket.off("loadMessages");
      socket.off("receiveMessage");
      socket.off("messageSent");
      socket.off("messageRevoked");
      socket.off("messageDeleted");
      socket.off("deleteMessageError");
      socket.off("deleteAllChatHistory"); // Nhi thêm
      offConversationUpdate(socket); // Nhi thêm
      offChatInfoUpdated(socket); // Nhi thêm
      offGroupLeft(socket); // Nhi thêm
      onConversationRemoved(socket); // Nhi thêm
    };
  }, [socket, selectedMessageId, currentUserId, navigation]);

  const sendMessage = (payload) => {
    if (!payload.content && !payload.linkURL) return;

    const socketPayload = {
      conversationId: selectedMessageId,
      message: {
        content: payload.content,
        messageType: payload.messageType,
        ...(payload.linkURL && { linkURL: payload.linkURL }),
        ...(payload.replyMessageId && {
          replyMessageId: payload.replyMessageId,
        }),
      },
    };

    socket.emit("sendMessage", socketPayload);
  };

  const handleLongPress = (msg) => {
    if (msg.isRevoked) return;
    console.log("Selected message:", msg);
    setSelectedMessage(msg);
    setShowOptions(true);
  };

  const handleReply = () => {
    setReplyingTo(selectedMessage);
    setShowOptions(false);
  };

  const handleRevoke = () => {
    Alert.alert("Thu hồi tin nhắn", "Bạn có chắc muốn thu hồi tin nhắn này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Thu hồi",
        style: "destructive",
        onPress: () => {
          socket.emit("messageRevoked", {
            messageId: selectedMessage._id,
            conversationId: selectedMessageId,
          });
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === selectedMessage._id
                ? { ...msg, isRevoked: true }
                : msg
            )
          );
          setShowOptions(false);
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!socket?.connected) {
      console.warn("Socket is not connected");
      Alert.alert("Lỗi", "Không thể kết nối đến server");
      return;
    }
    Alert.alert(
      "Xóa tin nhắn",
      "Bạn có chắc muốn xóa tin nhắn này? Nếu muốn xóa cả hai bên thì hãy nhấn vào nút thu hồi.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            console.log(
              "Sending messageDeleted event for messageId:",
              selectedMessage._id
            );
            socket.emit("messageDeleted", {
              messageId: selectedMessage._id,
              conversationId: selectedMessageId,
            });
            setMessages((prev) =>
              prev.filter((msg) => msg._id !== selectedMessage._id)
            );
            setShowOptions(false);
          },
        },
      ]
    );
  };

  const handleForward = () => {
    if (!selectedMessage?._id) {
      Alert.alert("Lỗi", "Không thể chuyển tiếp: Tin nhắn không hợp lệ.");
      return;
    }
    setMessageToForward(selectedMessage);
    setIsShareModalVisible(true);
    setShowOptions(false);
    console.log("Mở ShareModal để chuyển tiếp:", selectedMessage);
  };

  const handleShare = (selectedConversations, content) => {
    if (selectedConversations.length === 0) {
      Alert.alert(
        "Lỗi",
        "Vui lòng chọn ít nhất một cuộc trò chuyện để chia sẻ."
      );
      return;
    }
    console.log(
      "Chuyển tiếp tin nhắn đến:",
      selectedConversations,
      "với ghi chú:",
      content
    );
  };

  const formatTime = (createdAt) => {
    return new Date(createdAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateSeparator = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderItem = ({ item, index }) => {
    const currentDate = formatDateSeparator(item.createdAt);
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const prevDate = prevMessage
      ? formatDateSeparator(prevMessage.createdAt)
      : null;
    const showDateSeparator = index === 0 || currentDate !== prevDate;

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <Text style={styles.dateSeparatorText}>{currentDate}</Text>
          </View>
        )}
        <MessageItem
          key={item._id}
          msg={{
            ...item,
            sender:
              item.userId === currentUserId
                ? "Bạn"
                : userCache[item.userId]?.name || "Người dùng ẩn danh",
            time: formatTime(item.createdAt),
            messageType: item.messageType || "text",
            content: item.content || "",
            linkURL: item.linkURL || "",
            userId: item.userId,
          }}
          currentUserId={currentUserId}
          messages={messages}
          onLongPress={handleLongPress}
        />
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <View style={styles.headerContainer}>
        <View style={styles.leftContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {message?.name || userCache[user?.id]?.name || "Cuộc trò chuyện"}
          </Text>
        </View>
        <View style={styles.rightContainer}>
          <TouchableOpacity
            onPress={() => console.log("Call")}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="call-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => console.log("Video Call")}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="videocam-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log("Navigating to ChatInfo with:", {
                userId,
                conversationId,
                socket,
              });
              if (!userId || !conversationId || !socket) {
                console.warn(
                  "Cannot navigate to ChatInfo: missing userId or conversationId"
                );
                Alert.alert(
                  "Lỗi",
                  "Không thể mở thông tin chat do thiếu userId hoặc conversationId."
                );
                return;
              }
              navigation.push("ChatInfo", { userId, conversationId, socket }); // Nhi thêm: Truyền socket
            }}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages.filter((msg) => !msg.deletedBy?.includes(currentUserId))}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 10 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <ChatFooter
        sendMessage={sendMessage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
      />

      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.optionBox}>
              <TouchableOpacity onPress={handleReply}>
                <Text style={styles.optionText}>Trả lời</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForward}>
                <Text style={styles.optionText}>Chuyển tiếp</Text>
              </TouchableOpacity>
              {selectedMessage?.userId === currentUserId && (
                <>
                  <TouchableOpacity onPress={handleDelete}>
                    <Text style={styles.optionText}>Xóa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRevoke}>
                    <Text style={styles.optionText}>Thu hồi</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <ShareModal
        isOpen={isShareModalVisible}
        onClose={() => {
          setIsShareModalVisible(false);
          setMessageToForward(null);
          console.log("Đóng ShareModal");
        }}
        onShare={handleShare}
        messageToForward={messageToForward}
        userId={currentUserId}
        messageId={messageToForward?._id}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  headerContainer: {
    backgroundColor: "#0196fc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 16,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
    color: "#fff",
  },
  dateSeparatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: "#e5e7eb",
    color: "#6b7280",
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  optionBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    width: 200,
  },
  optionText: {
    fontSize: 16,
    paddingVertical: 8,
    textAlign: "center",
  },
});

export default ChatScreen;