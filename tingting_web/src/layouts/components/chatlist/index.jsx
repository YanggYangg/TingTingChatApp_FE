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
} from "../../../services/sockets/events/conversation";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";

import SibarContact from "../contact-form/SideBarContact/SideBarContact";
import GroupList from "../contact-form/GroupList";
import FriendRequests from "../contact-form/FriendRequests";
import GroupInvites from "../contact-form/GroupInvites";
import ContactList from "../contact-form/ContactList";

const cx = classNames.bind(styles);

function ChatList({ activeTab }) {
  const [messages, setMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState("priority");
  const socket = useSocket();
  const dispatch = useDispatch();

  // Get currentUserId from socket
  const currentUserId = socket?.io?.opts?.query?.userId;

  // Xử lý khi click vào tin nhắn
  const handleMessageClick = (message) => {
    if (message.id !== "my-cloud") {
      joinConversation(socket, message.id);
    }
    dispatch(setSelectedMessage(message));
  };

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

  // Cloud của tôi item
  const myCloudItem = {
    id: "my-cloud",
    name: "Cloud của tôi",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s", // Hoặc link avatar của bạn
    type: "cloud",
    lastMessage: "Lưu trữ tin nhắn và file cá nhân",
    isCall: false,
    time: "",
    isCloud: true, // Thêm flag để xác định đây là cloud item
  };

  // Load and listen for conversations
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleConversations = (conversations) => {
      const transformedMessages = transformConversationsToMessages(
        conversations,
        currentUserId
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

      {/* Thêm cloud ở đây */}

      <div className="flex-grow text-gray-700">
        {activeTab === "/chat" && (
          <MessageList
            // messages={messages}
            messages={[myCloudItem, ...messages]}
            onMessageClick={handleMessageClick}
          />
        )}
        {activeTab === "/contact" && <SibarContact />}
      </div>
    </div>
  );
}

export default ChatList;
