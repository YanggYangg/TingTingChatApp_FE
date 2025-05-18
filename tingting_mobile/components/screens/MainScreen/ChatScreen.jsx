import React, { useEffect, useState, useRef } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import ChatItems from "@/components/chatitems/ChatItems";
import ChatSupportItems from "@/components/chatitems/ChatSupportItems";
import ChatCloudItems from "@/components/chatitems/ChatCloudItems";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../../redux/slices/chatSlice";
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
}
  from "../../../services/sockets/events/chatInfo";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";
import { Api_Profile } from "../../../apis/api_profile";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [userCache, setUserCache] = useState({}); // Nhi thêm: Thay userProfiles bằng userCache
  const [currentUserId, setCurrentUserId] = useState(null);
  const { socket, userId } = useSocket();
  const dispatch = useDispatch();
  const joinedRoomsRef = useRef(new Set()); // Nhi thêm

  // Nhi thêm: Item tĩnh "Cloud của tôi"
  const myCloudItem = {
    id: "my-cloud",
    name: "Cloud của tôi",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
    type: "cloud",
    lastMessage: "Lưu trữ tin nhắn và file cá nhân",
    isCall: false,
    time: "",
    isCloud: true,
  };

  // Nhi thêm: Kiểm tra tính hợp lệ của conversation
  const validateConversation = (conversation) => {
    if (!conversation._id || conversation.conversationId) {
      console.warn("ChatScreen: Conversation missing _id:", conversation);
      return false;
    }
    if (!Array.isArray(conversation.participants)) {
      console.warn("ChatScreen: Conversation missing or invalid participants:", conversation);
      return false;
    }
    return true;
  };

  // Nhi thêm: Thêm nhóm mới
  const addNewGroup = async (newConversation) => {
    console.log("ChatScreen: Thêm nhóm mới:", newConversation);

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
          return null;
        }
      })
    );

    const newMessage = transformConversationsToMessages(
      [newConversation],
      currentUserId,
      profiles
    )[0];

    console.log("ChatScreen: Chuyển đổi nhóm mới thành message", newMessage);

    setMessages((prevMessages) => {
      const updatedMessages = [newMessage, ...prevMessages];
      const uniqueMessages = Array.from(
        new Map(updatedMessages.map((msg) => [msg.id, msg])).values()
      );
      console.log("ChatScreen: Updated unique messages:", uniqueMessages);
      return uniqueMessages;
    });
  };

  useEffect(() => {
    if (!socket || !userId) {
      console.warn("ChatScreen: Thiếu socket hoặc userId", { socket, userId });
      return;
    }


    setCurrentUserId(userId);

    console.log("ChatScreen: Đăng ký lắng nghe socket events", { socketId: socket.id });

    const handleConversations = async (conversations) => {
      console.log("ChatScreen: Nhận conversations:", conversations);

      // Nhi thêm: Lọc các conversation hợp lệ
      const validConversations = conversations.filter(validateConversation);

      // Nhi thêm: Tham gia các phòng chưa join
      validConversations.forEach((conversation) => {
        if (!joinedRoomsRef.current.has(conversation._id)) {
          console.log("ChatScreen: Tham gia phòng", conversation._id);
          joinConversation(socket, conversation._id);
          joinedRoomsRef.current.add(conversation._id);
        }
      });

      const otherParticipantIds = validConversations
        .map((conversation) => {
          const other = conversation.participants.find(
            (p) => p.userId !== currentUserId
          );
          return other?.userId;
        })
        .filter(Boolean);

      const profiles = await Promise.all(
        otherParticipantIds.map(async (userId) => {
          // Nhi thêm: Kiểm tra userCache trước
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
            return null;
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
      console.log("ChatScreen: Transformed unique messages:", uniqueMessages);
      setMessages(uniqueMessages);
    };

    const handleConversationUpdate = (updatedConversation) => {
      console.log("ChatScreen: Cập nhật conversation:", updatedConversation);
      if (!validateConversation(updatedConversation)) {
        console.error("ChatScreen: Invalid updated conversation, skipping");
        return;
      }

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === updatedConversation.conversationId) {
            const updatedMsg = {
              ...msg,
              lastMessage: updatedConversation.lastMessage?.content || "",
              lastMessageType: updatedConversation.lastMessage?.messageType || "text",
              lastMessageSenderId: updatedConversation.lastMessage?.userId || null,
              time: new Date(updatedConversation.updatedAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              ),
              updateAt: updatedConversation.updatedAt,
            };
            console.log("ChatScreen: Cập nhật message", updatedMsg);
            return updatedMsg;
          }
          return msg;
        });

        const isNew = !updatedMessages.some(
          (msg) => msg.id === updatedConversation.conversationId
        );

        if (isNew) {
          const newMessage = transformConversationsToMessages(
            [updatedConversation],
            currentUserId
          )[0];
          console.log("ChatScreen: Thêm message mới", newMessage);
          return [newMessage, ...updatedMessages];
        }

        console.log("ChatScreen: Messages sau khi cập nhật conversation", updatedMessages);
        return updatedMessages;
      });
    };

    // Nhi thêm: Xử lý nhóm mới
    const handleNewGroupConversation = (newConversation) => {
      console.log("ChatScreen: Nhóm mới từ socket:", newConversation);
      addNewGroup(newConversation);
    };

    // Nhi thêm: Xử lý rời nhóm
    const handleGroupLeft = (data) => {
      console.log("ChatScreen: Nhận groupLeft:", data);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== data.conversationId)
      );
      dispatch(setSelectedMessage(null));
    };

    // Nhi thêm: Xử lý xóa cuộc trò chuyện
    const handleConversationRemoved = (data) => {
      console.log("ChatScreen: Cuộc trò chuyện đã bị xóa:", data);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== data.conversationId)
      );
      dispatch(setSelectedMessage(null));
    };

    // Nhi thêm: Xử lý cập nhật thông tin trò chuyện
    const handleChatInfoUpdated = (updatedInfo) => {
      console.log("ChatScreen: Nhận cập nhật chatInfo:", updatedInfo);
      if (!validateConversation(updatedInfo)) {
        console.error("ChatScreen: Invalid updated chat info, skipping");
        return;
      }

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === updatedInfo._id) {
            const participant = updatedInfo.participants?.find(
              (p) => p.userId === currentUserId
            );
            const updatedMsg = {
              ...msg,
              participants: updatedInfo.participants || msg.participants,
              name: updatedInfo.name || msg.name,
              isGroup: updatedInfo.isGroup ?? msg.isGroup,
              imageGroup: updatedInfo.imageGroup || msg.imageGroup,
              isPinned: participant?.isPinned || false,
              mute: participant?.mute || false,
            };
            console.log("ChatScreen: Cập nhật message với tên mới", updatedMsg);
            return updatedMsg;
          }
          return msg;
        });
        console.log("ChatScreen: Danh sách messages sau khi cập nhật", updatedMessages);
        return [...updatedMessages];
      });
    };

    // Nhi thêm: Xử lý xóa toàn bộ lịch sử trò chuyện
    const handleDeleteAllChatHistory = ({ conversationId, deletedBy }) => {
      console.log("ChatScreen: Nhận deleteAllChatHistory", {
        conversationId,
        deletedBy,
        currentUserId,
        messagesLength: messages.length,
      });
      if (deletedBy === currentUserId) {
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.filter((msg) => msg.id !== conversationId);
          console.log("ChatScreen: Messages sau khi xóa", {
            conversationId,
            updatedMessagesLength: updatedMessages.length,
          });
          return [...updatedMessages];
        });
        dispatch(setSelectedMessage(null));
        console.log("ChatScreen: Đã xóa cuộc trò chuyện", { conversationId });
      } else {
        console.log("ChatScreen: Giữ nguyên danh sách cuộc trò chuyện", { userId: currentUserId });
      }
    };

    // Nhi thêm: Làm mới khi màn hình focus
    const unsubscribe = navigation.addListener('focus', () => {
      const refresh = route?.params?.refresh;
      if (refresh) {
        console.log("ChatScreen: Làm mới danh sách cuộc trò chuyện");
        loadAndListenConversations(socket, handleConversations)();
      }
    });

    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    onConversationUpdate(socket, handleConversationUpdate);
    onChatInfoUpdated(socket, handleChatInfoUpdated); // Nhi thêm
    socket.on("newGroupConversation", handleNewGroupConversation); // Nhi thêm
    socket.on("deleteAllChatHistory", handleDeleteAllChatHistory); // Nhi thêm
    onConversationRemoved(socket, handleConversationRemoved); // Nhi thêm
    onGroupLeft(socket, handleGroupLeft); // Nhi thêm

    return () => {
      console.log("ChatScreen: Gỡ sự kiện socket");
      cleanupLoad();
      offConversationUpdate(socket);
      offChatInfoUpdated(socket); // Nhi thêm
      socket.off("newGroupConversation", handleNewGroupConversation); // Nhi thêm
      socket.off("deleteAllChatHistory", handleDeleteAllChatHistory); // Nhi thêm
      offConversationRemoved(socket); // Nhi thêm
      offGroupLeft(socket); // Nhi thêm
      unsubscribe(); // Nhi thêm
    };
  }, [socket, userId, dispatch, navigation, route]);

  const handlePress = (item) => {
    // Nhi thêm: Kiểm tra my-cloud
    if (item.id === "my-cloud") {
      console.log("ChatScreen: Chọn Cloud của tôi");
      return;
    }

    console.log(`ChatScreen: Chọn conversation: ${item.id}`);
    joinConversation(socket, item.id);
    joinedRoomsRef.current.add(item.id); // Nhi thêm
    dispatch(setSelectedMessage(item));
    console.log("ChatScreen: Selected message:", item);

    const otherParticipant = !item.isGroup && Array.isArray(item.participants)
      ? item.participants.find((p) => p.userId !== currentUserId)
      : null;
    const userProfile = otherParticipant
      ? userCache[otherParticipant.userId]
      : null;

    navigation.navigate("MessageScreen", {
      message: item,
      user: userProfile,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={[...messages]} // Removed myCloudItem and its render logic
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
          const userProfile = otherParticipant
            ? userCache[otherParticipant.userId]
            : null;

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
            />
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backIcon: {
    marginTop: 20,
    marginLeft: 20,
  },
});

export default ChatScreen;