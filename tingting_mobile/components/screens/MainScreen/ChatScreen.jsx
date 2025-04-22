import React, { useEffect, useState } from "react";
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
} from "../../../services/sockets/events/conversation";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const socket = useSocket();
  const dispatch = useDispatch();
  const [currentUserId, setCurrentUserId] = useState(null);

  // Lấy currentUserId từ AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        let userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          userId = "user123";
          await AsyncStorage.setItem("userId", userId);
        }
        console.log("userId fetched from AsyncStorage:", userId);
        setCurrentUserId(userId);
      } catch (error) {
        console.error("Failed to fetch userId:", error);
        setCurrentUserId("user123");
      }
    };

    fetchUserId();
  }, []);

  // Log currentUserId sau khi state được cập nhật
  useEffect(() => {
    console.log("Current userId set in state (after update) 1:", currentUserId);
  }, [currentUserId]);

  // Fetch thông tin user (không phải current user)
  const fetchOtherUserProfiles = async (conversations) => {
    const otherUserIds = conversations
      .flatMap((con) => con.participants)
      .filter((p) => p.userId !== currentUserId)
      .map((p) => p.userId);

    const uniqueUserIds = [...new Set(otherUserIds)];

    try {
      const responses = await Promise.all(
        uniqueUserIds.map((id) =>
          axios.get(`http://172.20.10.2:3001/api/v1/profile/${id}`)
        )
      );

      const profiles = {};
      responses.forEach((res) => {
        const user = res.data.data.user;
        profiles[user._id] = {
          id: user._id,
          name: `${user.firstname} ${user.surname}`,
          avatar: user.avatar,
        };
      });

      setUserProfiles(profiles);
    } catch (err) {
      console.error("Lỗi fetch user profiles:", err);
    }
  };

  useEffect(() => {
    if (!socket || !currentUserId) {
      console.warn("Socket not initialized on mobile or currentUserId missing");
      return;
    }

    const handleConversations = (conversations) => {
      const transformed = transformConversationsToMessages(
        conversations,
        currentUserId
      );

      setMessages(transformed);
      fetchOtherUserProfiles(conversations);
    };

    const handleConversationUpdate = (updatedConversation) => {
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === updatedConversation.conversationId) {
            return {
              ...msg,
              lastMessage: updatedConversation.lastMessage?.content || "",
              lastMessageType:
                updatedConversation.lastMessage?.messageType || "text",
              lastMessageSenderId:
                updatedConversation.lastMessage?.userId || null,
              time: new Date(updatedConversation.updatedAt).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ),
              updateAt: updatedConversation.updatedAt,
            };
          }
          return msg;
        });

        const isNew = !updatedMessages.some(
          (msg) => msg.id === updatedConversation.conversationId
        );

        if (isNew) {
          const newMsg = transformConversationsToMessages(
            [updatedConversation],
            currentUserId
          )[0];
          fetchOtherUserProfiles([updatedConversation]); // fetch người mới
          return [newMsg, ...updatedMessages];
        }

        return updatedMessages;
      });
    };

    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    onConversationUpdate(socket, handleConversationUpdate);

    return () => {
      cleanupLoad();
      offConversationUpdate(socket);
    };
  }, [socket, currentUserId]);

  const handlePress = (message) => {
    joinConversation(socket, message.id);
    dispatch(setSelectedMessage(message));
    console.log("Selected message jhasdgashjdgs:", message);
    navigation.navigate("MessageScreen", {
      message,
      user: userProfiles[message.participants[0].userId], // Thêm thông tin user vào params
    }); // Thêm `user` vào params
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <ChatSupportItems />
            <ChatCloudItems />
          </View>
        }
        renderItem={({ item }) => {
          const otherParticipant = !item.isGroup
            ? item.participants.find((p) => p.userId !== currentUserId)
            : null;

          const userProfile = otherParticipant
            ? userProfiles[otherParticipant.userId]
            : null;

          return (
            <ChatItems
              avatar={
                item.isGroup ? item.avatar : userProfile?.avatar || item.avatar
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
