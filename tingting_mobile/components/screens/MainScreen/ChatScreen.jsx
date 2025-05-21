import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, FlatList, StyleSheet, Alert, Text } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ChatItems from "@/components/chatitems/ChatItems";
import ChatSupportItems from "@/components/chatitems/ChatSupportItems";
import ChatCloudItems from "@/components/chatitems/ChatCloudItems";
import PinVerificationModal from "@/components/screens/MainScreen/Chat/chatInfoComponent/PinVerificationModal";
import {
  setSelectedMessage,
  setChatInfoUpdate,
  setLastMessageUpdate,
  pinConversation,
  unpinConversation,
  setPinnedOrder,
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
  getChatInfo,
  onChatInfoUpdated,
  offChatInfoUpdated,
  onGroupLeft,
  offGroupLeft,
  updateNotification,
  pinChat,
} from "../../../services/sockets/events/chatInfo";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";
import { Api_Profile } from "../../../apis/api_profile";

const myCloudItem = {
  id: "my-cloud",
  name: "Cloud của tôi",
  avatar:
    "https://encrypted-tbn0.gstatic.com/images?q=tbngcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
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
  const [messages, setMessages] = useState([myCloudItem]);
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
  const pinnedOrder = useSelector((state) => state.chat.pinnedOrder);
  // Thêm useRef để lưu trữ giá trị trước đó của chatInfoUpdate và lastMessageUpdate
  const prevChatInfoUpdateRef = useRef(null);
  const prevLastMessageUpdateRef = useRef(null);

  const validateConversation = (conversation) => {
    return (
      conversation._id &&
      conversation._id !== "my-cloud" &&
      Array.isArray(conversation.participants)
    );
  };

  const sortMessages = (msgs) => {
    const filteredMessages = msgs.filter((msg) => {
      if (msg.isCloud) return true;
      const participant = msg.participants?.find(
        (p) => p.userId === currentUserId
      );
      return participant && !participant.isHidden;
    });

    return filteredMessages.sort((a, b) => {
      const aPinned = pinnedOrder.includes(a.id);
      const bPinned = pinnedOrder.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (aPinned && bPinned) {
        return pinnedOrder.indexOf(a.id) - pinnedOrder.indexOf(b.id);
      }
      const timeA = new Date(a.updateAt || a.time || 0).getTime();
      const timeB = new Date(b.updateAt || b.time || 0).getTime();
      return timeB - timeA;
    });
  };

  const sortedMessages = useMemo(() => sortMessages(messages), [
    messages,
    pinnedOrder,
  ]);

  const checkPinnedLimit = () => {
    return pinnedOrder.length >= 5;
  };

  const handlePinConversation = (conversationId, isPinned) => {
    if (!isSocketConnected) {
      Alert.alert("Lỗi", "Không thể kết nối đến server.");
      return;
    }
    if (!isPinned && checkPinnedLimit()) {
      Alert.alert("Thông báo", "Bạn chỉ có thể ghim tối đa 5 cuộc trò chuyện!");
      return;
    }

    dispatch(isPinned ? unpinConversation(conversationId) : pinConversation(conversationId));

    pinChat(
      socket,
      { conversationId, isPinned: !isPinned },
      (response) => {
        if (!response?.success) {
          dispatch(
            isPinned
              ? pinConversation(conversationId)
              : unpinConversation(conversationId)
          );
          Alert.alert(
            "Lỗi",
            response?.message || "Không thể ghim cuộc trò chuyện."
          );
        } else {
          dispatch(
            setChatInfoUpdate({
              _id: conversationId,
              participants: response.data.participants,
              updatedAt: new Date().toISOString(),
            })
          );
          getChatInfo(socket, { conversationId });
        }
      }
    );

    if (!joinedRoomsRef.current.has(conversationId)) {
      joinConversation(socket, conversationId);
      joinedRoomsRef.current.add(conversationId);
    }
  };

  const handleMuteConversation = (conversationId, isMuted) => {
    if (!isSocketConnected) {
      Alert.alert("Lỗi", "Không thể kết nối đến server.");
      return;
    }

    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) => {
        if (msg.id === conversationId) {
          return {
            ...msg,
            mute: !isMuted,
            participants: msg.participants.map((p) =>
              p.userId === currentUserId
                ? { ...p, mute: !isMuted ? "muted" : null }
                : p
            ),
          };
        }
        return msg;
      });
      return updatedMessages;
    });

    updateNotification(
      socket,
      { conversationId, mute: !isMuted ? "muted" : null },
      (response) => {
        if (!response?.success) {
          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((msg) => {
              if (msg.id === conversationId) {
                return {
                  ...msg,
                  mute: isMuted,
                  participants: msg.participants.map((p) =>
                    p.userId === currentUserId
                      ? { ...p, mute: isMuted ? "muted" : null }
                      : p
                  ),
                };
              }
              return msg;
            });
            return updatedMessages;
          });
          Alert.alert(
            "Lỗi",
            response?.message || "Không thể cập nhật trạng thái thông báo."
          );
        } else {
          dispatch(
            setChatInfoUpdate({
              _id: conversationId,
              participants: response.data.participants,
              updatedAt: new Date().toISOString(),
            })
          );
          getChatInfo(socket, { conversationId });
        }
      }
    );

    if (!joinedRoomsRef.current.has(conversationId)) {
      joinConversation(socket, conversationId);
      joinedRoomsRef.current.add(conversationId);
    }
  };

  const addNewGroup = async (newConversation) => {
    if (!validateConversation(newConversation)) return;
    if (messages.some((msg) => msg.id === newConversation._id)) return;

    const participant = newConversation.participants?.find(
      (p) => p.userId === currentUserId
    );
    if (!participant || participant.isHidden) return;

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
            name:
              `${userData.firstname || ""} ${userData.surname || ""}`.trim() ||
              userId,
            avatar: userData.avatar || "https://via.placeholder.com/150",
          };
          setUserCache((prev) => ({ ...prev, [userId]: profile }));
          return profile;
        } catch (error) {
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
      return [myCloudItem, ...updatedMessages];
    });

    if (!joinedRoomsRef.current.has(newConversation._id)) {
      joinConversation(socket, newConversation._id);
      joinedRoomsRef.current.add(newConversation._id);
    }
  };

  const handlePinVerified = () => {
    if (selectedConversation) {
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) =>
          msg.id === selectedConversation.id
            ? {
              ...msg,
              isHidden: false,
              participants: msg.participants.map((p) =>
                p.userId === currentUserId ? { ...p, isHidden: false } : p
              ),
            }
            : msg
        );
        return updatedMessages;
      });
      proceedWithMessageSelection(selectedConversation);
    }
    setIsPinModalOpen(false);
    setSelectedConversation(null);
  };

  const proceedWithMessageSelection = (item) => {
    if (item.id !== "my-cloud" && !joinedRoomsRef.current.has(item.id)) {
      joinConversation(socket, item.id);
      joinedRoomsRef.current.add(item.id);
    }
    dispatch(setSelectedMessage(item));

    const otherParticipant =
      !item.isGroup && Array.isArray(item.participants)
        ? item.participants.find((p) => p.userId !== currentUserId)
        : null;
    const userProfile = otherParticipant ? userCache[otherParticipant.userId] : null;

    navigation.navigate("MessageScreen", {
      message: item,
      user: userProfile,
    });
  };

  const handlePress = (item) => {
    if (!isSocketConnected) {
      Alert.alert("Lỗi", "Socket chưa kết nối.");
      return;
    }
    if (item.isHidden && item.id !== "my-cloud") {
      setSelectedConversation(item);
      setIsPinModalOpen(true);
      return;
    }
    proceedWithMessageSelection(item);
  };

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

  useEffect(() => {
    if (!socket || !userId) return;

    setCurrentUserId(userId);

    const handleConversations = async (conversations) => {
      const validConversations = conversations.filter(validateConversation);

      const visibleConversations = validConversations.filter((conversation) => {
        const participant = conversation.participants?.find(
          (p) => p.userId === currentUserId
        );
        return participant && !participant.isHidden;
      });

      visibleConversations.forEach((conversation) => {
        if (!joinedRoomsRef.current.has(conversation._id)) {
          joinConversation(socket, conversation._id);
          joinedRoomsRef.current.add(conversation._id);
        }
      });

      const otherParticipantIds = [
        ...new Set(
          visibleConversations
            .map((conversation) =>
              conversation.participants.find((p) => p.userId !== currentUserId)
                ?.userId
            )
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
              name:
                `${userData.firstname || ""} ${userData.surname || ""}`.trim() ||
                userId,
              avatar: userData.avatar || "https://via.placeholder.com/150",
            };
            setUserCache((prev) => ({ ...prev, [userId]: profile }));
            return profile;
          } catch (error) {
            return { name: userId, avatar: "https://via.placeholder.com/150" };
          }
        })
      );

      const transformedMessages = transformConversationsToMessages(
        visibleConversations,
        currentUserId,
        profiles
      );
      setMessages([myCloudItem, ...transformedMessages]);

      const pinnedConversations = visibleConversations
        .filter((conv) =>
          conv.participants?.find((p) => p.userId === currentUserId)?.isPinned
        )
        .map((conv) => conv._id);
      dispatch(setPinnedOrder(pinnedConversations));
    };

    const handleConversationUpdate = (updatedConversation) => {
      if (!validateConversation(updatedConversation)) return;

      const participant = updatedConversation.participants?.find(
        (p) => p.userId === currentUserId
      );
      if (!participant || participant.isHidden) return;

      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(
          (msg) => msg.id !== "my-cloud"
        );
        const updatedConversationId =
          updatedConversation.conversationId?._id || updatedConversation._id;
        const updatedMessages = filteredMessages.map((msg) => {
          if (msg.id === updatedConversationId) {
            return {
              ...msg,
              lastMessage:
                updatedConversation.lastMessage?.content ||
                msg.lastMessage ||
                "",
              lastMessageType:
                updatedConversation.lastMessage?.messageType ||
                msg.lastMessageType ||
                "text",
              lastMessageSenderId:
                updatedConversation.lastMessage?.userId ||
                msg.lastMessageSenderId ||
                null,
              time: new Date(
                updatedConversation.lastMessage?.createdAt ||
                updatedConversation.updatedAt
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              updateAt:
                updatedConversation.lastMessage?.createdAt ||
                updatedConversation.updatedAt,
            };
          }
          return msg;
        });

        if (!updatedMessages.some((msg) => msg.id === updatedConversation._id)) {
          const newMessage = transformConversationsToMessages(
            [updatedConversation],
            currentUserId,
            []
          )[0];
          updatedMessages.push(newMessage);
          if (!joinedRoomsRef.current.has(updatedConversation._id)) {
            joinConversation(socket, updatedConversation._id);
            joinedRoomsRef.current.add(updatedConversation._id);
          }
        }

        return [myCloudItem, ...updatedMessages];
      });
    };

    const handleNewGroupConversation = (newConversation) => {
      const participant = newConversation.participants?.find(
        (p) => p.userId === currentUserId
      );
      if (!participant || participant.isHidden) return;
      addNewGroup(newConversation);
    };

    const handleGroupLeft = (data) => {
      if (data.userId === currentUserId) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== data.conversationId)
        );
        dispatch(
          setPinnedOrder(pinnedOrder.filter((id) => id !== data.conversationId))
        );
        dispatch(setSelectedMessage(null));
        Alert.alert("Thông báo", "Bạn đã rời khỏi nhóm.");
      }
    };

    const handleConversationRemoved = (data) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== data.conversationId)
      );
      dispatch(
        setPinnedOrder(pinnedOrder.filter((id) => id !== data.conversationId))
      );
      dispatch(setSelectedMessage(null));
      if (joinedRoomsRef.current.has(data.conversationId)) {
        joinedRoomsRef.current.delete(data.conversationId);
        socket.emit("leaveConversation", { conversationId: data.conversationId });
      }
      Alert.alert("Thông báo", "Bạn đã bị xóa khỏi nhóm.");
    };

    const handleChatInfoUpdated = (updatedInfo) => {
      const participant = updatedInfo.participants?.find(
        (p) => p.userId === currentUserId
      );
      if (!participant || participant.isHidden) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== updatedInfo._id)
        );
        dispatch(
          setPinnedOrder(pinnedOrder.filter((id) => id !== updatedInfo._id))
        );
        dispatch(setSelectedMessage(null));
        if (joinedRoomsRef.current.has(updatedInfo._id)) {
          socket.emit("leaveConversation", { conversationId: updatedInfo._id });
          joinedRoomsRef.current.delete(updatedInfo._id);
        }
        return;
      }

      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(
          (msg) => msg.id !== "my-cloud"
        );
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
              lastMessage: msg.lastMessage,
              lastMessageType: msg.lastMessageType,
              lastMessageSenderId: msg.lastMessageSenderId,
              time: msg.time,
              updateAt: msg.updateAt,
            };
          }
          return msg;
        });
        return [myCloudItem, ...updatedMessages];
      });

      if (participant?.isPinned && !pinnedOrder.includes(updatedInfo._id)) {
        dispatch(pinConversation(updatedInfo._id));
      } else if (
        !participant?.isPinned &&
        pinnedOrder.includes(updatedInfo._id)
      ) {
        dispatch(unpinConversation(updatedInfo._id));
      }

      dispatch(setChatInfoUpdate(updatedInfo));
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
  }, [socket, userId, dispatch, pinnedOrder]);

  useEffect(() => {
    if (!chatInfoUpdate) return;

    // Kiểm tra xem chatInfoUpdate có thay đổi thực sự không
    if (
      prevChatInfoUpdateRef.current &&
      JSON.stringify(prevChatInfoUpdateRef.current) === JSON.stringify(chatInfoUpdate)
    ) {
      return; // Bỏ qua nếu dữ liệu không thay đổi
    }
    prevChatInfoUpdateRef.current = chatInfoUpdate;

    const participant = chatInfoUpdate.participants?.find(
      (p) => p.userId === currentUserId
    );
    if (!participant || participant.isHidden) {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== chatInfoUpdate._id)
      );
      dispatch(
        setPinnedOrder(pinnedOrder.filter((id) => id !== chatInfoUpdate._id))
      );
      dispatch(setSelectedMessage(null));
      if (joinedRoomsRef.current.has(chatInfoUpdate._id)) {
        socket.emit("leaveConversation", { conversationId: chatInfoUpdate._id });
        joinedRoomsRef.current.delete(chatInfoUpdate._id);
      }
      return;
    }

    setMessages((prevMessages) => {
      const filteredMessages = prevMessages.filter(
        (msg) => msg.id !== "my-cloud"
      );
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
            lastMessage: msg.lastMessage,
            lastMessageType: msg.lastMessageType,
            lastMessageSenderId: msg.lastMessageSenderId,
            time: msg.time,
            updateAt: msg.updateAt,
          };
        }
        return msg;
      });
      return [myCloudItem, ...updatedMessages];
    });

    if (participant?.isPinned && !pinnedOrder.includes(chatInfoUpdate._id)) {
      dispatch(pinConversation(chatInfoUpdate._id));
    } else if (
      !participant?.isPinned &&
      pinnedOrder.includes(chatInfoUpdate._id)
    ) {
      dispatch(unpinConversation(chatInfoUpdate._id));
    }
  }, [chatInfoUpdate, currentUserId, dispatch, socket, pinnedOrder]);

  useEffect(() => {
    if (!lastMessageUpdate) return;

    // Kiểm tra xem lastMessageUpdate có thay đổi thực sự không
    if (
      prevLastMessageUpdateRef.current &&
      JSON.stringify(prevLastMessageUpdateRef.current) === JSON.stringify(lastMessageUpdate)
    ) {
      return; // Bỏ qua nếu dữ liệu không thay đổi
    }
    prevLastMessageUpdateRef.current = lastMessageUpdate;

    setMessages((prevMessages) => {
      const filteredMessages = prevMessages.filter(
        (msg) => msg.id !== "my-cloud"
      );
      const conversationId =
        lastMessageUpdate.conversationId?._id ||
        lastMessageUpdate.conversationId;
      const updatedMessages = filteredMessages.map((msg) => {
        if (msg.id === conversationId) {
          return {
            ...msg,
            lastMessage: lastMessageUpdate.lastMessage?.content || "",
            lastMessageType:
              lastMessageUpdate.lastMessage?.messageType ||
              msg.lastMessageType ||
              "text",
            lastMessageSenderId:
              lastMessageUpdate.lastMessage?.userId ||
              msg.lastMessageSenderId ||
              null,
            time: lastMessageUpdate.lastMessage
              ? new Date(
                lastMessageUpdate.lastMessage.createdAt
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            updateAt:
              lastMessageUpdate.lastMessage?.createdAt ||
              new Date().toISOString(),
          };
        }
        return msg;
      });
      return [myCloudItem, ...updatedMessages];
    });
  }, [lastMessageUpdate]);

  return (
    <View style={styles.container}>
      {!isSocketConnected ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Đang kết nối tới server, vui lòng chờ...
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedMessages}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <ChatSupportItems />
              <ChatCloudItems />
            </View>
          }
          renderItem={({ item }) => {
            const otherParticipant =
              !item.isGroup && Array.isArray(item.participants)
                ? item.participants.find((p) => p.userId !== currentUserId)
                : null;
            const userProfile = otherParticipant
              ? userCache[otherParticipant.userId]
              : null;

            return (
              <ChatItems
                avatar={
                  item.isGroup
                    ? item.avatar || item.imageGroup
                    : userProfile?.avatar || item.avatar
                }
                username={
                  item.isGroup
                    ? item.name
                    : userProfile?.name || item.name
                }
                lastMessage={item.lastMessage}
                time={item.time}
                onPress={() => handlePress(item)}
                isCall={item.isCall}
                missed={item.missed}
                type={item.isGroup ? "group" : "private"}
                members={item.participants?.length || 0}
                isPinned={pinnedOrder.includes(item.id)}
                isMuted={
                  !!item.participants?.find((p) => p.userId === currentUserId)
                    ?.mute
                }
                onPinConversation={() =>
                  handlePinConversation(
                    item.id,
                    pinnedOrder.includes(item.id)
                  )
                }
                onMuteConversation={() =>
                  handleMuteConversation(
                    item.id,
                    !!item.participants?.find((p) => p.userId === currentUserId)
                      ?.mute
                  )
                }
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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