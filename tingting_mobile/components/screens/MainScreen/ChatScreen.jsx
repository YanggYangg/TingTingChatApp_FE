import React, { useEffect, useState, useRef } from "react";
import { View, FlatList, StyleSheet, Alert, Text } from "react-native";
import ChatItems from "@/components/chatitems/ChatItems";
import ChatSupportItems from "@/components/chatitems/ChatSupportItems";
import ChatCloudItems from "@/components/chatitems/ChatCloudItems";
import PinVerificationModal from "@/components/screens/MainScreen/Chat/chatInfoComponent/PinVerificationModal";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedMessage,
  setChatInfoUpdate,
  setLastMessageUpdate,
} from "../../../redux/slices/chatSlice";
import { useSocket } from "../../../contexts/SocketContext";
import {
  loadAndListenConversations,
  onConversationUpdate,
  offConversationUpdate,
  joinConversation,
  onConversationRemoved,
  offConversationRemoved,
} from "../../../services/sockets/events/conversation";
import {
  onChatInfoUpdated,
  offChatInfoUpdated,
  onGroupLeft,
  offGroupLeft,
  updateNotification,
  pinChat,
} from "../../../services/sockets/events/chatInfo";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";
import { Api_Profile } from "../../../apis/api_profile";

const ChatScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [userCache, setUserCache] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { socket, userId } = useSocket();
  const dispatch = useDispatch();
  const joinedRoomsRef = useRef(new Set());
  const chatInfoUpdate = useSelector((state) => state.chat.chatInfoUpdate);
  const lastMessageUpdate = useSelector((state) => state.chat.lastMessageUpdate);

  // Item tĩnh "Cloud của tôi"
  const myCloudItem = {
    id: "my-cloud",
    name: "Cloud của tôi",
    avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
    type: "cloud",
    lastMessage: "Lưu trữ tin nhắn và file cá nhân",
    isCall: false,
    time: "",
    isCloud: true,
    isPinned: false,
    isHidden: false,
    participants: [], // Thêm để đồng bộ cấu trúc
  };

  // Kiểm tra tính hợp lệ của conversation
  const validateConversation = (conversation) => {
    if (!conversation._id) {
      console.warn("ChatScreen: Conversation missing _id:", conversation);
      return false;
    }
    if (!Array.isArray(conversation.participants)) {
      console.warn("ChatScreen: Conversation missing or invalid participants:", conversation);
      return false;
    }
    if (conversation._id === "my-cloud") {
      console.warn("ChatScreen: Conversation has reserved id 'my-cloud', skipping");
      return false;
    }
    return true;
  };

  // Sắp xếp danh sách hội thoại
  const sortMessages = (messages) => {
    const filteredMessages = messages.filter((msg) => {
      if (msg.isCloud) return true;
      const participant = msg.participants?.find((p) => p.userId === currentUserId);
      return !participant?.isHidden;
    });

    return filteredMessages.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = new Date(a.updateAt || a.time || 0).getTime();
      const timeB = new Date(b.updateAt || b.time || 0).getTime();
      return timeB - timeA;
    });
  };

  // Kiểm tra giới hạn ghim hội thoại
  const checkPinnedLimit = () => {
    const pinnedCount = messages.filter((msg) => msg.isPinned && !msg.isCloud).length;
    return pinnedCount >= 5; // Giới hạn 5 như Zalo
  };

  // Xử lý ghim/bỏ ghim hội thoại
  const handlePinConversation = (conversationId, isPinned) => {
    if (!isSocketConnected) {
      Alert.alert("Lỗi", "Không thể kết nối đến server, vui lòng thử lại!");
      return;
    }

    if (!isPinned && checkPinnedLimit()) {
      Alert.alert("Thông báo", "Bạn chỉ có thể ghim tối đa 5 cuộc trò chuyện!");
      return;
    }

    // Cập nhật UI ngay lập tức
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) => {
        if (msg.id === conversationId) {
          return {
            ...msg,
            isPinned: !isPinned,
            participants: msg.participants.map((p) =>
              p.userId === currentUserId ? { ...p, isPinned: !isPinned } : p
            ),
          };
        }
        return msg;
      });
      return sortMessages(updatedMessages);
    });

    // Gửi yêu cầu tới server
    pinChat(socket, { conversationId, isPinned: !isPinned }, (response) => {
      if (!response?.success) {
        // Hoàn tác nếu server trả về lỗi
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.map((msg) => {
            if (msg.id === conversationId) {
              return {
                ...msg,
                isPinned,
                participants: msg.participants.map((p) =>
                  p.userId === currentUserId ? { ...p, isPinned } : p
                ),
              };
            }
            return msg;
          });
          return sortMessages(updatedMessages);
        });
        Alert.alert("Lỗi", response?.message || "Không thể cập nhật trạng thái ghim!");
      }
    });

    if (!joinedRoomsRef.current.has(conversationId)) {
      joinConversation(socket, conversationId);
      joinedRoomsRef.current.add(conversationId);
    }
  };

  // Xử lý bật/tắt thông báo
  const handleMuteConversation = (conversationId, isMuted) => {
    if (!isSocketConnected) {
      Alert.alert("Lỗi", "Không thể kết nối đến server, vui lòng thử lại!");
      return;
    }

    // Cập nhật UI ngay lập tức
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) => {
        if (msg.id === conversationId) {
          return {
            ...msg,
            mute: !isMuted,
            participants: msg.participants.map((p) =>
              p.userId === currentUserId ? { ...p, mute: !isMuted ? "muted" : null } : p
            ),
          };
        }
        return msg;
      });
      return sortMessages(updatedMessages);
    });

    // Gửi yêu cầu tới server
    updateNotification(socket, { conversationId, mute: !isMuted ? "muted" : null }, (response) => {
      if (!response?.success) {
        // Hoàn tác nếu server trả về lỗi
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.map((msg) => {
            if (msg.id === conversationId) {
              return {
                ...msg,
                mute: isMuted,
                participants: msg.participants.map((p) =>
                  p.userId === currentUserId ? { ...p, mute: isMuted ? "muted" : null } : p
                ),
              };
            }
            return msg;
          });
          return sortMessages(updatedMessages);
        });
        Alert.alert("Lỗi", response?.message || "Không thể cập nhật trạng thái thông báo!");
      }
    });

    if (!joinedRoomsRef.current.has(conversationId)) {
      joinConversation(socket, conversationId);
      joinedRoomsRef.current.add(conversationId);
    }
  };

  // Thêm nhóm mới
  const addNewGroup = async (newConversation) => {
    if (!validateConversation(newConversation)) {
      console.error("ChatScreen: Invalid new conversation, skipping");
      return;
    }

    if (messages.some((msg) => msg.id === newConversation._id)) {
      console.log("ChatScreen: Nhóm đã tồn tại, bỏ qua:", newConversation._id);
      return;
    }

    const participantIds = newConversation.participants
      .map((p) => p.userId)
      .filter((id) => id !== currentUserId);

    const profiles = await Promise.all(
      participantIds.map(async (userId) => {
        if (userCache[userId]) {
          return userCache[userId];
        }
        try {
          const response = await Api_Profile.getProfile(userId);
          const userData = response?.data?.user || {};
          const profile = {
            name: `${userData.firstname || ""} ${userData.surname || ""}`.trim() || userId,
            avatar: userData.avatar || "https://via.placeholder.com/150",
          };
          setUserCache((prev) => ({ ...prev, [userId]: profile }));
          return profile;
        } catch (error) {
          console.error(`ChatScreen: Lỗi khi lấy profile cho userId ${userId}:`, error);
          return { name: userId, avatar: "https://via.placeholder.com/150" };
        }
      })
    );

    const newMessage = transformConversationsToMessages(
      [newConversation],
      currentUserId,
      profiles
    )[0];

    setMessages((prevMessages) => {
      const filteredMessages = prevMessages.filter((msg) => msg.id !== "my-cloud");
      const updatedMessages = [newMessage, ...filteredMessages];
      const uniqueMessages = Array.from(
        new Map(updatedMessages.map((msg) => [msg.id, msg])).values()
      );
      return sortMessages([myCloudItem, ...uniqueMessages]);
    });

    if (!joinedRoomsRef.current.has(newConversation._id)) {
      joinConversation(socket, newConversation._id);
      joinedRoomsRef.current.add(newConversation._id);
    }
  };

  // Xử lý khi xác thực PIN thành công
  const handlePinVerified = () => {
    if (selectedConversation) {
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) =>
          msg.id === selectedConversation.id
            ? { ...msg, isHidden: false }
            : msg
        );
        return sortMessages(updatedMessages);
      });
      proceedWithMessageSelection(selectedConversation);
    }
    setIsPinModalOpen(false);
    setSelectedConversation(null);
  };

  // Đóng modal nhập PIN
  const handleClosePinModal = () => {
    setIsPinModalOpen(false);
    setSelectedConversation(null);
  };

  // Chọn hội thoại
  const proceedWithMessageSelection = (item) => {
    if (item.id !== "my-cloud" && !joinedRoomsRef.current.has(item.id)) {
      joinConversation(socket, item.id);
      joinedRoomsRef.current.add(item.id);
    }
    dispatch(setSelectedMessage(item));

    const otherParticipant = !item.isGroup && Array.isArray(item.participants)
      ? item.participants.find((p) => p.userId !== currentUserId)
      : null;
    const userProfile = otherParticipant ? userCache[otherParticipant.userId] : null;

    navigation.navigate("MessageScreen", {
      message: item,
      user: userProfile,
    });
  };

  // Xử lý nhấn vào hội thoại
  const handlePress = (item) => {
    if (!isSocketConnected) {
      Alert.alert("Lỗi", "Socket chưa kết nối, vui lòng thử lại sau!");
      return;
    }

    if (item.isHidden && item.id !== "my-cloud") {
      setSelectedConversation(item);
      setIsPinModalOpen(true);
      return;
    }

    proceedWithMessageSelection(item);
  };

  // Quản lý kết nối socket
  useEffect(() => {
    if (!socket) {
      setIsSocketConnected(false);
      return;
    }

    const handleConnect = () => {
      setIsSocketConnected(true);
      socket.emit("registerUser", { userId });
      joinedRoomsRef.current.forEach((conversationId) => {
        joinConversation(socket, conversationId);
      });
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, userId]);

  // Tải và lắng nghe hội thoại
  useEffect(() => {
    if (!socket || !userId) {
      return;
    }

    setCurrentUserId(userId);

    const handleConversations = async (conversations) => {
      const validConversations = conversations.filter(validateConversation);

      validConversations.forEach((conversation) => {
        const participant = conversation.participants?.find((p) => p.userId === currentUserId);
        if (!participant?.isHidden && !joinedRoomsRef.current.has(conversation._id)) {
          joinConversation(socket, conversation._id);
          joinedRoomsRef.current.add(conversation._id);
        }
      });

      const otherParticipantIds = [
        ...new Set(
          validConversations
            .map((conversation) => {
              const other = conversation.participants.find((p) => p.userId !== currentUserId);
              return other?.userId;
            })
            .filter(Boolean)
        ),
      ];

      const profiles = await Promise.all(
        otherParticipantIds.map(async (userId) => {
          if (userCache[userId]) {
            return userCache[userId];
          }
          try {
            const response = await Api_Profile.getProfile(userId);
            const userData = response?.data?.user || {};
            const profile = {
              name: `${userData.firstname || ""} ${userData.surname || ""}`.trim() || userId,
              avatar: userData.avatar || "https://via.placeholder.com/150",
            };
            setUserCache((prev) => ({ ...prev, [userId]: profile }));
            return profile;
          } catch (error) {
            console.error(`ChatScreen: Lỗi khi lấy profile cho userId ${userId}:`, error);
            return { name: userId, avatar: "https://via.placeholder.com/150" };
          }
        })
      );

      const transformedMessages = transformConversationsToMessages(
        validConversations,
        currentUserId,
        profiles
      );
      const uniqueMessages = Array.from(
        new Map(transformedMessages.map((msg) => [msg.id, msg])).values()
      );
      setMessages([myCloudItem, ...sortMessages(uniqueMessages)]);
    };

    const handleConversationUpdate = (updatedConversation) => {
      if (!validateConversation(updatedConversation)) {
        return;
      }

      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter((msg) => msg.id !== "my-cloud");
        const updatedConversationId = updatedConversation.conversationId?._id || updatedConversation._id;
        const updatedMessages = filteredMessages.map((msg) => {
          if (msg.id === updatedConversationId) {
            const updatedMsg = {
              ...msg,
              lastMessage: updatedConversation.lastMessage?.content || msg.lastMessage || "",
              lastMessageType: updatedConversation.lastMessage?.messageType || msg.lastMessageType || "text",
              lastMessageSenderId: updatedConversation.lastMessage?.userId || msg.lastMessageSenderId || null,
              time: new Date(updatedConversation.lastMessage?.createdAt || updatedConversation.updatedAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              ),
              updateAt: updatedConversation.lastMessage?.createdAt || updatedConversation.updatedAt,
            };
            return updatedMsg;
          }
          return msg;
        });

        const isNew = !updatedMessages.some((msg) => msg.id === updatedConversation._id);
        if (isNew && updatedConversation._id) {
          const newMessage = transformConversationsToMessages(
            [updatedConversation],
            currentUserId,
            []
          )[0];
          const participant = updatedConversation.participants?.find((p) => p.userId === currentUserId);
          if (!participant?.isHidden) {
            updatedMessages.push(newMessage);
            if (!joinedRoomsRef.current.has(updatedConversation._id)) {
              joinConversation(socket, updatedConversation._id);
              joinedRoomsRef.current.add(updatedConversation._id);
            }
          }
        }

        return [myCloudItem, ...sortMessages(updatedMessages)];
      });
    };

    const handleNewGroupConversation = (newConversation) => {
      const participant = newConversation.participants?.find((p) => p.userId === currentUserId);
      if (!participant?.isHidden) {
        addNewGroup(newConversation);
      }
    };

    const handleGroupLeft = (data) => {
      if (data.userId === currentUserId) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== data.conversationId)
        );
        dispatch(setSelectedMessage(null));
      }
    };

    const handleConversationRemoved = (data) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.conversationId));
      dispatch(setSelectedMessage(null));
      if (joinedRoomsRef.current.has(data.conversationId)) {
        joinedRoomsRef.current.delete(data.conversationId);
        socket.emit("leaveConversation", { conversationId: data.conversationId });
      }
    };

    const handleChatInfoUpdated = (updatedInfo) => {
      const participant = updatedInfo.participants?.find((p) => p.userId === currentUserId);
      if (!participant || participant.isHidden) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== updatedInfo._id)
        );
        dispatch(setSelectedMessage(null));
        if (joinedRoomsRef.current.has(updatedInfo._id)) {
          socket.emit("leaveConversation", { conversationId: updatedInfo._id });
          joinedRoomsRef.current.delete(updatedInfo._id);
        }
        return;
      }

      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter((msg) => msg.id !== "my-cloud");
        const updatedMessages = filteredMessages.map((msg) => {
          if (msg.id === updatedInfo._id) {
            const updatedMsg = {
              ...msg,
              participants: updatedInfo.participants || msg.participants,
              name: updatedInfo.name || msg.name,
              isGroup: updatedInfo.isGroup ?? msg.isGroup,
              imageGroup: updatedInfo.imageGroup || msg.imageGroup,
              isPinned: participant?.isPinned || false,
              mute: participant?.mute || null,
            };
            return updatedMsg;
          }
          return msg;
        });
        return [myCloudItem, ...sortMessages(updatedMessages)];
      });
    };

    const handleDeleteAllChatHistory = ({ conversationId, deletedBy }) => {
      if (deletedBy === currentUserId) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== conversationId)
        );
        dispatch(setSelectedMessage(null));
      }
    };

    const unsubscribe = navigation.addListener("focus", () => {
      const refresh = route?.params?.refresh;
      if (refresh) {
        loadAndListenConversations(socket, handleConversations)();
      }
    });

    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    onConversationUpdate(socket, handleConversationUpdate);
    onChatInfoUpdated(socket, handleChatInfoUpdated);
    socket.on("newGroupConversation", handleNewGroupConversation);
    socket.on("deleteAllChatHistory", handleDeleteAllChatHistory);
    onConversationRemoved(socket, handleConversationRemoved);
    onGroupLeft(socket, handleGroupLeft);

    return () => {
      cleanupLoad();
      offConversationUpdate(socket);
      offChatInfoUpdated(socket);
      socket.off("newGroupConversation", handleNewGroupConversation);
      socket.off("deleteAllChatHistory", handleDeleteAllChatHistory);
      offConversationRemoved(socket);
      offGroupLeft(socket);
      unsubscribe();
    };
  }, [socket, userId, dispatch, navigation, route]);

  // Xử lý cập nhật từ Redux
  useEffect(() => {
    if (chatInfoUpdate) {
      const participant = chatInfoUpdate.participants?.find((p) => p.userId === currentUserId);
      if (!participant || participant.isHidden) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== chatInfoUpdate._id)
        );
        dispatch(setSelectedMessage(null));
        if (joinedRoomsRef.current.has(chatInfoUpdate._id)) {
          socket.emit("leaveConversation", { conversationId: chatInfoUpdate._id });
          joinedRoomsRef.current.delete(chatInfoUpdate._id);
        }
        return;
      }

      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter((msg) => msg.id !== "my-cloud");
        const updatedMessages = filteredMessages.map((msg) => {
          if (msg.id === chatInfoUpdate._id) {
            const updatedMsg = {
              ...msg,
              participants: chatInfoUpdate.participants || msg.participants,
              name: chatInfoUpdate.name || msg.name,
              isGroup: chatInfoUpdate.isGroup ?? msg.isGroup,
              imageGroup: chatInfoUpdate.imageGroup || msg.imageGroup,
              isPinned: participant.isPinned || false,
              mute: participant.mute || null,
            };
            return updatedMsg;
          }
          return msg;
        });
        return [myCloudItem, ...sortMessages(updatedMessages)];
      });
    }
  }, [chatInfoUpdate, currentUserId, dispatch, socket]);

  useEffect(() => {
    if (lastMessageUpdate) {
      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter((msg) => msg.id !== "my-cloud");
        const conversationId = lastMessageUpdate.conversationId?._id || lastMessageUpdate.conversationId;
        const updatedMessages = filteredMessages.map((msg) => {
          if (msg.id === conversationId) {
            const updatedMsg = {
              ...msg,
              lastMessage: lastMessageUpdate.lastMessage?.content || "",
              lastMessageType: lastMessageUpdate.lastMessage?.messageType || msg.lastMessageType || "text",
              lastMessageSenderId: lastMessageUpdate.lastMessage?.userId || msg.lastMessageSenderId || null,
              time: lastMessageUpdate.lastMessage
                ? new Date(lastMessageUpdate.lastMessage.createdAt).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )
                : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              updateAt: lastMessageUpdate.lastMessage?.createdAt || new Date().toISOString(),
            };
            return updatedMsg;
          }
          return msg;
        });
        return [myCloudItem, ...sortMessages(updatedMessages)];
      });
    }
  }, [lastMessageUpdate]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {!isSocketConnected ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang kết nối tới server, vui lòng chờ...</Text>
        </View>
      ) : (
        <FlatList
          data={[myCloudItem, ...messages.filter((msg) => msg.id !== "my-cloud")]}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <ChatSupportItems />
              <ChatCloudItems />
            </View>
          }
          renderItem={({ item }) => {
            const otherParticipant = !item.isGroup && Array.isArray(item.participants)
              ? item.participants.find((p) => p.userId !== currentUserId)
              : null;
            const userProfile = otherParticipant ? userCache[otherParticipant.userId] : null;

            return (
              <ChatItems
                avatar={
                  item.isGroup ? item.avatar || item.imageGroup : userProfile?.avatar || item.avatar
                }
                username={
                  item.isGroup ? item.name : userProfile?.name || item.name
                }
                lastMessage={item.lastMessage}
                time={item.time}
                onPress={() => handlePress(item)}
                isCall={item.isCall}
                missed={item.missed}
                type={item.isGroup ? "group" : "private"}
                members={item.participants?.length || 0}
                isPinned={item.participants?.find((p) => p.userId === currentUserId)?.isPinned || false}
                isMuted={!!item.participants?.find((p) => p.userId === currentUserId)?.mute}
                onPinConversation={() => handlePinConversation(item.id, item.participants?.find((p) => p.userId === currentUserId)?.isPinned || false)}
                onMuteConversation={() => handleMuteConversation(item.id, !!item.participants?.find((p) => p.userId === currentUserId)?.mute)}
              />
            );
          }}
        />
      )}
      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={handleClosePinModal}
        conversationId={selectedConversation?.id}
        userId={currentUserId}
        socket={socket}
        onVerified={handlePinVerified}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#888",
  },
});

export default ChatScreen;