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

import { Api_Profile } from "../../../apis/api_profile";

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const { socket, userId } = useSocket();
  const dispatch = useDispatch();
  const [currentUserId, setCurrentUserId] = useState(userId);
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleConversations = async (conversations) => {
      console.log("Conversations sfdfds:", conversations);

      // Lấy ra userId của người còn lại trong các cuộc trò chuyện cá nhân
      const otherParticipantIds = conversations
        .map((conversation) => {
          const other = conversation.participants.find(
            (p) => p.userId !== currentUserId
          );
          return other?.userId; // chỉ lấy nếu có
        })
        .filter(Boolean); // loại bỏ undefined

      // Lấy profile của các user còn lại
      const profiles = await Promise.all(
        otherParticipantIds.map(async (userId) => {
          try {
            return await Api_Profile.getProfile(userId);
          } catch (error) {
            console.error(`Lỗi khi lấy profile cho userId ${userId}:`, error);
            return null; // fallback nếu lỗi
          }
        })
      );

      const transformedMessages = transformConversationsToMessages(
        conversations,
        currentUserId,
        profiles
      );
      setMessages(transformedMessages);
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
                { hour: "2-digit", minute: "2-digit" }
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
          const newMessage = transformConversationsToMessages(
            [updatedConversation],
            currentUserId
          )[0];
          return [newMessage, ...updatedMessages];
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
    console.log(
      "chat user profile",
      userProfiles[message.participants[0].userId]
    );
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
