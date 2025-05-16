import React, { useState, useEffect, useRef } from "react";
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

// Item "Cloud của tôi" cố định
const myCloudItem = {
  id: "my-cloud",
  name: "Cloud của tôi",
  avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbngcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
  type: "cloud",
  lastMessage: "Lưu trữ tin nhắn và file cá nhân",
  isCall: false,
  time: "",
  isCloud: true,
  isPinned: false,
  isHidden: false,
  participants: [],
};

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]); // Danh sách hội thoại
  const [userCache, setUserCache] = useState({}); // Cache thông tin người dùng
  const [currentUserId, setCurrentUserId] = useState(null); // ID người dùng hiện tại
  const [isSocketConnected, setIsSocketConnected] = useState(false); // Trạng thái kết nối socket
  const [isPinModalOpen, setIsPinModalOpen] = useState(false); // Modal xác thực PIN
  const [selectedConversation, setSelectedConversation] = useState(null); // Hội thoại cần xác thực
  const { socket, userId } = useSocket();
  const dispatch = useDispatch();
  const joinedRoomsRef = useRef(new Set()); // Lưu danh sách phòng đã tham gia
  const chatInfoUpdate = useSelector((state) => state.chat.chatInfoUpdate); // Cập nhật thông tin nhóm từ Redux
  const lastMessageUpdate = useSelector((state) => state.chat.lastMessageUpdate); // Cập nhật tin nhắn cuối từ Redux

  // Kiểm tra hội thoại hợp lệ
  const validateConversation = (conversation) => {
    return conversation._id && conversation._id !== "my-cloud" && Array.isArray(conversation.participants);
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
    return messages.filter((msg) => msg.isPinned && !msg.isCloud).length >= 5;
  };

  // Xử lý ghim/b bỏ ghim hội thoại
  const handlePinConversation = (conversationId, isPinned) => {
    if (!isSocketConnected) return Alert.alert("Lỗi", "Không thể kết nối đến server.");
    if (!isPinned && checkPinnedLimit()) return Alert.alert("Thông báo", "Bạn chỉ có thể ghim tối đa 5 cuộc trò chuyện!");

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

    pinChat(socket, { conversationId, isPinned: !isPinned }, (response) => {
      if (!response?.success) {
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
        Alert.alert("Lỗi", response?.message || "Không thể ghim cuộc trò chuyện.");
      }
    });

    if (!joinedRoomsRef.current.has(conversationId)) {
      joinConversation(socket, conversationId);
      joinedRoomsRef.current.add(conversationId);
    }
  };

  // Xử lý bật/tắt thông báo hội thoại
  const handleMuteConversation = (conversationId, isMuted) => {
    if (!isSocketConnected) return Alert.alert("Lỗi", "Không thể kết nối đến server.");

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

    updateNotification(socket, { conversationId, mute: !isMuted ? "muted" : null }, (response) => {
      if (!response?.success) {
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
        Alert.alert("Lỗi", response?.message || "Không thể cập nhật trạng thái thông báo.");
      }
    });

    if (!joinedRoomsRef.current.has(conversationId)) {
      joinConversation(socket, conversationId);
      joinedRoomsRef.current.add(conversationId);
    }
  };

  // Thêm nhóm mới
  const addNewGroup = async (newConversation) => {
    if (!validateConversation(newConversation)) return;
    if (messages.some((msg) => msg.id === newConversation._id)) return;

    const participantIds = newConversation.participants
      .filter((p) => p.userId !== currentUserId)
      .map((p) => p.userId);

    const profiles = await Promise.all(
      participantIds.map(async (userId) => {
        if (userCache[userId]) return userCache[userId];
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
          return { name: userId, avatar: "https://via.placeholder.com/150" };
        }
      })
    );

    const newMessage = transformConversationsToMessages([newConversation], currentUserId, profiles)[0];

    setMessages((prevMessages) => {
      const filteredMessages = prevMessages.filter((msg) => msg.id !== "my-cloud");
      const updatedMessages = [newMessage, ...filteredMessages];
      return sortMessages([myCloudItem, ...updatedMessages]);
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
          msg.id === selectedConversation.id ? { ...msg, isHidden: false } : msg
        );
        return sortMessages(updatedMessages);
      });
      proceedWithMessageSelection(selectedConversation);
    }
    setIsPinModalOpen(false);
    setSelectedConversation(null);
  };

  // Chuyển hướng đến màn hình tin nhắn
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

  // Xử lý khi nhấn vào hội thoại
  const handlePress = (item) => {
    if (!isSocketConnected) return Alert.alert("Lỗi", "Socket chưa kết nối.");
    if (item.isHidden && item.id !== "my-cloud") {
      setSelectedConversation(item);
      setIsPinModalOpen(true);
      return;
    }
    proceedWithMessageSelection(item);
  };

  // Xử lý kết nối socket
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

    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, userId]);

  // Lắng nghe và xử lý hội thoại từ socket
  useEffect(() => {
    if (!socket || !userId) return;

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
            .map((conversation) => conversation.participants.find((p) => p.userId !== currentUserId)?.userId)
            .filter(Boolean)
        ),
      ];

      const profiles = await Promise.all(
        otherParticipantIds.map(async (userId) => {
          if (userCache[userId]) return userCache[userId];
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
            return { name: userId, avatar: "https://via.placeholder.com/150" };
          }
        })
      );

      const transformedMessages = transformConversationsToMessages(validConversations, currentUserId, profiles);
      setMessages([myCloudItem, ...sortMessages(transformedMessages)]);
    };

    const handleConversationUpdate = (updatedConversation) => {
      if (!validateConversation(updatedConversation)) return;

      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter((msg) => msg.id !== "my-cloud");
        const updatedConversationId = updatedConversation.conversationId?._id || updatedConversation._id;
        const updatedMessages = filteredMessages.map((msg) => {
          if (msg.id === updatedConversationId) {
            return {
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
          }
          return msg;
        });

        if (!updatedMessages.some((msg) => msg.id === updatedConversation._id)) {
          const newMessage = transformConversationsToMessages([updatedConversation], currentUserId, [])[0];
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
      if (!participant?.isHidden) addNewGroup(newConversation);
    };

    const handleGroupLeft = (data) => {
      if (data.userId === currentUserId) {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== data.conversationId));
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
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== updatedInfo._id));
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
            return {
              ...msg,
              participants: updatedInfo.participants || msg.participants,
              name: updatedInfo.name || msg.name,
              isGroup: updatedInfo.isGroup ?? msg.isGroup,
              imageGroup: updatedInfo.imageGroup || msg.imageGroup,
              isPinned: participant?.isPinned || false,
              mute: participant?.mute || null,
            };
          }
          return msg;
        });
        return [myCloudItem, ...sortMessages(updatedMessages)];
      });
    };

    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    onConversationUpdate(socket, handleConversationUpdate);
    onChatInfoUpdated(socket, handleChatInfoUpdated);
    socket.on("newGroupConversation", handleNewGroupConversation);
    onConversationRemoved(socket, handleConversationRemoved);
    onGroupLeft(socket, handleGroupLeft);

    return () => {
      cleanupLoad();
      offConversationUpdate(socket);
      offChatInfoUpdated(socket);
      socket.off("newGroupConversation", handleNewGroupConversation);
      offConversationRemoved(socket);
      offGroupLeft(socket);
    };
  }, [socket, userId, dispatch]);

  // Xử lý cập nhật thông tin nhóm từ Redux
  useEffect(() => {
    if (chatInfoUpdate) {
      const participant = chatInfoUpdate.participants?.find((p) => p.userId === currentUserId);
      if (!participant || participant.isHidden) {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== chatInfoUpdate._id));
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
            return {
              ...msg,
              participants: chatInfoUpdate.participants || msg.participants,
              name: chatInfoUpdate.name || msg.name,
              isGroup: chatInfoUpdate.isGroup ?? msg.isGroup,
              imageGroup: chatInfoUpdate.imageGroup || msg.imageGroup,
              isPinned: participant.isPinned || false,
              mute: participant.mute || null,
            };
          }
          return msg;
        });
        return [myCloudItem, ...sortMessages(updatedMessages)];
      });
    }
  }, [chatInfoUpdate, currentUserId, dispatch, socket]);

  // Xử lý cập nhật tin nhắn cuối từ Redux
  useEffect(() => {
    if (lastMessageUpdate) {
      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter((msg) => msg.id !== "my-cloud");
        const conversationId = lastMessageUpdate.conversationId?._id || lastMessageUpdate.conversationId;
        const updatedMessages = filteredMessages.map((msg) => {
          if (msg.id === conversationId) {
            return {
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
                avatar={item.isGroup ? item.avatar || item.imageGroup : userProfile?.avatar || item.avatar}
                username={item.isGroup ? item.name : userProfile?.name || item.name}
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
        onClose={() => setIsPinModalOpen(false)}
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