import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./chatlist.module.scss";
import MessageList from "../../../components/MessageList";
import SearchCompo from "../../../components/searchComponent/SearchCompo";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../../redux/slices/chatSlice";
import { useSocket } from "../../../contexts/SocketContext";
import {
  loadAndListenConversations,
  onConversationUpdate,
  offConversationUpdate,
  joinConversation,
  leaveConversation,
} from "../../../services/sockets/events/conversation";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";

import SibarContact from "../contact-form/SideBarContact/SideBarContact";
import GroupList from "../contact-form/GroupList";
import FriendRequests from "../contact-form/FriendRequests";
import GroupInvites from "../contact-form/GroupInvites";
import ContactList from "../contact-form/ContactList";
import ContactsPage from "../../../pages/Chat/ContactsPage";

// import { Api_Conversation } from "../../../../apis/Api_Conversation";

const cx = classNames.bind(styles);

function ChatList({ activeTab }) {
  console.log("Current activeTab:", activeTab);
  const [messages, setMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState("priority");
  const socket = useSocket();
  const dispatch = useDispatch();

  // Get currentUserId from socket
  const currentUserId = socket?.io?.opts?.query?.userId;

  // Xử lý khi click vào tin nhắn
  const handleMessageClick = (message) => {
    joinConversation(socket, message.id);
    console.log("mess", message);

    dispatch(setSelectedMessage(message));
  };
  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

  // Load and listen for conversations
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleConversations = (conversations) => {
      console.log("Received conversations:", conversations);

      // Transform conversations using utility function
      const transformedMessages = transformConversationsToMessages(
        conversations,
        currentUserId
      );
      console.log("Transformed messages 555:", transformedMessages);
      setMessages(transformedMessages);
    };

    const handleConversationUpdate = (updatedConversation) => {
      console.log("Conversation updated:", updatedConversation);
      setMessages(prevMessages => {
        // Find and update the existing conversation
        const updatedMessages = prevMessages.map(msg => {
          if (msg.id === updatedConversation.conversationId) {
            // Update the last message and timestamp
            return {
              ...msg,
              lastMessage: updatedConversation.lastMessage?.content || '',
              lastMessageType: updatedConversation.lastMessage?.messageType || 'text',
              lastMessageSenderId: updatedConversation.lastMessage?.userId || null,
              time: new Date(updatedConversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              updateAt: updatedConversation.updatedAt
            };
          }
          return msg;
        });

        // If the conversation doesn't exist, add it
        if (!updatedMessages.some(msg => msg.id === updatedConversation.conversationId)) {
          const newMessage = transformConversationsToMessages([updatedConversation], currentUserId)[0];
          return [newMessage, ...updatedMessages];
        }

        return updatedMessages;
      });
    };

    // Use the combined function to load initial conversations
    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    
    // Set up conversation update listener
    onConversationUpdate(socket, handleConversationUpdate);

    // Cleanup
    return () => {
      cleanupLoad();
      offConversationUpdate(socket);
    };
  }, [socket, currentUserId]);

  const renderComponent = () => {
    switch (activeComponent) {
      case "groups":
        return <GroupList />;
      case "friendRequests":
        return <FriendRequests />;
      case "groupInvites":
        return <GroupInvites />;
      default:
        return <ContactList />;
    }
  };

  return (
    <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
      {/* Thanh tìm kiếm */}
      <div className="p-2 bg-white shadow-md">
        <SearchCompo />
      </div>

      {activeTab === "/chat" && (
        <div className="flex justify-start space-x-4 px-4 py-2 border-b">
          <button
            className={`font-semibold px-2 ${
              selectedTab === "priority"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
            onClick={() => handleTabClick("priority")}
          >
            Ưu tiên
          </button>
          <button
            className={`font-semibold px-2 ${
              selectedTab === "others"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
            onClick={() => handleTabClick("others")}
          >
            Khác
          </button>
        </div>
      )}

      {/* Danh sách chat */}
      <div className="flex-grow  text-gray-700">
        {activeTab === "/chat" && (
          <MessageList
            messages={messages}
            onMessageClick={handleMessageClick}
          />
        )}

        {activeTab === "/contact" && <SibarContact />}
      </div>
    </div>
  );
}

export default ChatList;
