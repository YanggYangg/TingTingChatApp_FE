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

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const socket = useSocket();

  const dispatch = useDispatch();

  const currentUserId = socket?.io?.opts?.query?.userId;

  useEffect(() => {
    console.log("Socket:", socket);
    if (!socket || !currentUserId) return;

    const handleConversations = (conversations) => {
      const transformed = transformConversationsToMessages(
        conversations,
        currentUserId
      );

      setMessages(transformed);
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

        if (
          !updatedMessages.some(
            (msg) => msg.id === updatedConversation.conversationId
          )
        ) {
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
    navigation.navigate("MessageScreen", { message });
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
        renderItem={({ item }) => (
          <ChatItems
            avatar={item.avatar}
            username={item.name}
            lastMessage={item.lastMessage}
            time={item.time}
            onPress={() => handlePress(item)}
          />
        )}
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
