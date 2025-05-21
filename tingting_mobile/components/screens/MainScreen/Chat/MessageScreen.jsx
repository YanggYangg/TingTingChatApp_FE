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
import { useSelector, useDispatch } from "react-redux"; // Thêm useDispatch
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
} from "../../../../services/sockets/events/conversation";
import {
  onChatInfoUpdated,
  offChatInfoUpdated,
  onGroupLeft,
  offGroupLeft,
} from "../../../../services/sockets/events/chatInfo";
import { setChatInfoUpdate } from "../../../../redux/slices/chatSlice"; // Import setChatInfoUpdate

const ChatScreen = ({ route, navigation }) => {
  const { socket, userId: currentUserId } = useSocket();
  const dispatch = useDispatch(); // Thêm dispatch
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [conversationInfo, setConversationInfo] = useState({
    name: "",
    isGroup: false,
    participants: [],
    imageGroup: null,
  });
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const { message, user } = route?.params || {};
  const conversationId = message?.id || null;
  const userId = currentUserId || null;
  const selectedMessageData = useSelector((state) => state.chat.selectedMessage);
  const chatInfoUpdate = useSelector((state) => state.chat.chatInfoUpdate); // Lấy chatInfoUpdate từ Redux
  const isGroupChat = message?.isGroup === true;
  const memberCount = message?.members || 0;
  const selectedMessageId = selectedMessageData?.id;
  const receiverId = Object.keys(userCache)[0];

  // console.log("ChatScreen params:", {
  //   userId,
  //   conversationId,
  //   message,
  //   user,
  //   routeParams: route.params,
  // });

  // Fetch user info
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

  // Initialize conversation info
  useEffect(() => {
    if (message) {
      setConversationInfo({
        name: message.name || user?.name || "",
        isGroup: message.isGroup || false,
        participants: message.participants || [],
        imageGroup: message.imageGroup || null,
      });
    }
  }, [message, user]);

  // Đồng bộ conversationInfo với chatInfoUpdate từ Redux
  useEffect(() => {
    if (chatInfoUpdate && chatInfoUpdate._id === conversationId) {
      // console.log("Updating conversationInfo from chatInfoUpdate:", chatInfoUpdate);
      setConversationInfo((prev) => ({
        ...prev,
        name: chatInfoUpdate.name || prev.name,
        isGroup: chatInfoUpdate.isGroup ?? prev.isGroup,
        participants: chatInfoUpdate.participants || prev.participants,
        imageGroup: chatInfoUpdate.imageGroup || prev.imageGroup,
      }));
    }
  }, [chatInfoUpdate, conversationId]);

  // Socket.IO setup
  useEffect(() => {
    if (!socket || !selectedMessageId || !currentUserId) {
      console.warn("Socket setup skipped: missing socket, selectedMessageId, or currentUserId", {
        socket: !!socket,
        selectedMessageId,
        currentUserId,
      });
      return;
    }

    if (!socket.connected) {
      console.warn("Socket not connected, attempting to connect", { socketId: socket.id });
      socket.connect();
    }

    console.log("Joining conversation with ID:", selectedMessageId);
    joinConversation(socket, selectedMessageId);

    socket.on("loadMessages", (data) => {
      // console.log("Received loadMessages:", data);
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

    onChatInfoUpdated(socket, (updatedInfo) => {
      console.log("ChatScreen: Received chatInfoUpdated:", updatedInfo);
      if (updatedInfo._id === selectedMessageId) {
        setConversationInfo((prev) => ({
          ...prev,
          name: updatedInfo.name || prev.name,
          isGroup: updatedInfo.isGroup ?? prev.isGroup,
          participants: updatedInfo.participants || prev.participants,
          imageGroup: updatedInfo.imageGroup || prev.imageGroup,
        }));
        // Dispatch để cập nhật Redux
        dispatch(setChatInfoUpdate(updatedInfo));
      }
    });

    onGroupLeft(socket, (data) => {
      console.log("ChatScreen: Received groupLeft:", data);
      if (data.conversationId === selectedMessageId) {
        Alert.alert("Thông báo", "Bạn đã rời khỏi nhóm.");
        navigation.navigate("Main", { screen: "MessageScreen" });
      }
    });

    onConversationRemoved(socket, (data) => {
      console.log("ChatScreen: Received conversationRemoved:", data);
      if (data.conversationId === selectedMessageId) {
        navigation.navigate("Main", { screen: "MessageScreen" });
      }
    });

    socket.on("userTyping", async ({ userId, conversationId }) => {
      console.log("User typing:", userId, conversationId);
      if (conversationId === selectedMessageId && userId !== currentUserId) {
        const userInfo = await fetchUserInfo(userId);
        setTypingUsers((prev) => {
          if (!prev.some((user) => user.userId === userId)) {
            return [...prev, { userId, name: userInfo.name }];
          }
          return prev;
        });
      }
    });

    socket.on("userStopTyping", ({ userId, conversationId }) => {
      if (conversationId === selectedMessageId) {
        setTypingUsers((prev) => prev.filter((user) => user.userId !== userId));
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
      socket.off("deleteAllChatHistory");
      offConversationUpdate(socket);
      offChatInfoUpdated(socket);
      offGroupLeft(socket);
      onConversationRemoved(socket);
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, [socket, selectedMessageId, currentUserId, navigation, dispatch]);

  // Online status
  useEffect(() => {
    if (!socket) return;

    socket.emit("getOnlineUsers");
    socket.on("getOnlineUsers", (users) => {
      console.log("Received online users:", users);
      setOnlineUsers(users);
      if (receiverId) {
        setIsOnline(users.includes(receiverId));
      }
    });

    return () => {
      socket.off("getOnlineUsers");
    };
  }, [socket, receiverId]);

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


  // Add markMessageAsRead function
  const markMessageAsRead = (messageId) => {
    console.log('Marking message as read:', {
      messageId,
      selectedMessageId,
      currentUserId,
      socket: !!socket
    });

    if (!socket || !selectedMessageId || !messageId) {
      console.log('Cannot mark as read - missing required data');
      return;
    }
    
    // Find the message
    const msg = messages.find((m) => m._id === messageId);
    if (!msg) {
      console.log('Message not found');
      return;
    }
    
    console.log('Message found:', {
      userId: msg.userId,
      currentUserId,
      readBy: msg.status?.readBy
    });
    
    // Only mark as read if the message is not from the current user and not already read
    if (
      msg.userId !== currentUserId &&
      (!msg.status?.readBy || !msg.status.readBy.includes(currentUserId))
    ) {
      console.log('Emitting readMessage event');
      socket.emit("readMessage", {
        conversationId: selectedMessageId,
        messageId,
        userId: currentUserId,
      });
    } else {
      console.log('Message already read or from current user');
    }
  };

  // Add socket listener for message read status
  useEffect(() => {
    if (!socket || !selectedMessageId) return;

    const handleMessageRead = ({ messageId, userId, readBy }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                status: {
                  ...msg.status,
                  readBy: readBy,
                },
              }
            : msg
        )
      );
    };

    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("messageRead", handleMessageRead);
    };
  }, [socket, selectedMessageId]);

  // Auto mark last message as read if it's from another user
  useEffect(() => {
    if (messages.length > 0 && selectedMessageId && socket && currentUserId) {
      const filteredMessages = messages.filter(
        (msg) =>
          msg.conversationId === selectedMessageId &&
          !msg.deletedBy?.includes(currentUserId)
      );
      
      if (filteredMessages.length > 0) {
        const lastMsg = filteredMessages[filteredMessages.length - 1];
        console.log('Checking last message for read status:', {
          messageId: lastMsg._id,
          senderId: lastMsg.userId,
          currentUserId,
          status: lastMsg.status
        });

        if (
          lastMsg.userId !== currentUserId &&
          (!lastMsg.status?.readBy || !lastMsg.status.readBy.includes(currentUserId))
        ) {
          console.log('Marking last message as read');
          markMessageAsRead(lastMsg._id);
        }
      }
    }
  }, [messages, selectedMessageId, socket, currentUserId]);

  const renderItem = ({ item, index }) => {
    const currentDate = formatDateSeparator(item.createdAt);
    const prevMessage = index > 0 ? visibleMessages[index - 1] : null;
    const prevDate = prevMessage ? formatDateSeparator(prevMessage.createdAt) : null;
    const showDateSeparator = index === 0 || currentDate !== prevDate;

    const isLastMessage = item._id === visibleMessages[visibleMessages.length - 1]?._id;


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
            status: item.status || { readBy: [] }
          }}
          currentUserId={currentUserId}
          messages={messages}
          onLongPress={handleLongPress}
          markMessageAsRead={markMessageAsRead}
          participants={message?.participants || []}
          userCache={userCache}
          isLastMessage={isLastMessage}
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
          <View style={styles.nameContainer}>
            <Text style={styles.headerText}>
              {message?.isGroup 
                ? (message.name || conversationInfo.name || "Nhóm chat")
                : (message?.participants?.find(p => p.userId !== currentUserId)?.name 
                  || userCache[message?.participants?.find(p => p.userId !== currentUserId)?.userId]?.name 
                  || "Cuộc trò chuyện")}
            </Text>
            <View style={styles.statusContainer}>
              {isGroupChat ? (
                <Text style={styles.statusText}>{memberCount} thành viên</Text>
              ) : (
                <>
                  <Text style={styles.statusText}>
                    {isOnline ? "Đang hoạt động " : "Đang offline "}
                  </Text>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isOnline ? "#4CAF50" : "#9E9E9E" },
                    ]}
                  />
                </>
              )}
            </View>
          </View>
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
              navigation.push("ChatInfo", { userId, conversationId, socket });
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
      {typingUsers.length > 0 && (
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 14, color: "#555" }}>
            {typingUsers.map((user) => user.name).join(", ")} đang gõ...
          </Text>
        </View>
      )}
      <ChatFooter
        sendMessage={sendMessage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        conversationId={selectedMessageId}
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
  nameContainer: {
    marginLeft: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
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