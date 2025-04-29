import React, { useState, useEffect } from "react";
import classNames from "classnames/bind";
import styles from "./chatlist.module.scss";
import MessageList from "../../../components/MessageList";
import SearchCompo from "../../../components/searchComponent/SearchCompo";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedMessage, clearSelectedMessage } from "../../../redux/slices/chatSlice";
import { useSocket } from "../../../contexts/SocketContext";
import {
  loadAndListenConversations,
  onConversationUpdate,
  offConversationUpdate,
  joinConversation,
} from "../../../services/sockets/events/conversation";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";
import SibarContact from "../contact-form/SideBarContact/SideBarContact";
import { Api_Profile } from "../../../../apis/api_profile";

const cx = classNames.bind(styles);

function ChatList({ activeTab }) {
  const [messages, setMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState("priority");
  const dispatch = useDispatch();
  const { socket, userId: currentUserId } = useSocket();
  const selectedMessage = useSelector((state) => state.chat.selectedMessage);

  const handleMessageClick = (message) => {
    if (message.id !== "my-cloud") {
      joinConversation(socket, message.id);
    }
    dispatch(setSelectedMessage(message));
  };

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  };

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
  };

  // Load and listen for conversations
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleConversations = async (conversations) => {
      const otherParticipantIds = conversations
        .map((conversation) => {
          const other = conversation.participants.find(
            (p) => p.userId !== currentUserId
          );
          return other?.userId;
        })
        .filter(Boolean);

      const profiles = await Promise.all(
        otherParticipantIds.map(async (userId) => {
          try {
            return await Api_Profile.getProfile(userId);
          } catch (error) {
            console.error(`Lỗi khi lấy profile cho userId ${userId}:`, error);
            return null;
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

  // Listen for updates from ChatInfo
  useEffect(() => {
    if (!socket) return;

    socket.on("chatInfoUpdated", (updatedChatInfo) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === updatedChatInfo.conversationId) {
            return {
              ...msg,
              name: updatedChatInfo.name || msg.name,
              imageGroup: updatedChatInfo.imageGroup || msg.imageGroup,
              participants: updatedChatInfo.participants || msg.participants,
            };
          }
          return msg;
        })
      );

      if (selectedMessage?.id === updatedChatInfo.conversationId) {
        dispatch(
          setSelectedMessage({
            ...selectedMessage,
            name: updatedChatInfo.name || selectedMessage.name,
            imageGroup: updatedChatInfo.imageGroup || selectedMessage.imageGroup,
            participants: updatedChatInfo.participants || selectedMessage.participants,
          })
        );
      }
    });

    socket.on("groupDisbanded", (data) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== data.conversationId)
      );
      if (selectedMessage?.id === data.conversationId) {
        dispatch(clearSelectedMessage());
      }
    });

    socket.on("userLeftGroup", (data) => {
      if (data.userId === currentUserId) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== data.conversationId)
        );
        if (selectedMessage?.id === data.conversationId) {
          dispatch(clearSelectedMessage());
        }
      } else {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg.id === data.conversationId) {
              return {
                ...msg,
                participants: msg.participants.filter((p) => p.userId !== data.userId),
              };
            }
            return msg;
          })
        );
      }
    });

    socket.on("messageDeleted", ({ messageId, messageType }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.lastMessageId === messageId) {
            return {
              ...msg,
              lastMessage: "Tin nhắn đã bị xóa",
              lastMessageType: "text",
              lastMessageSenderId: null,
            };
          }
          return msg;
        })
      );
    });

    return () => {
      socket.off("chatInfoUpdated");
      socket.off("groupDisbanded");
      socket.off("userLeftGroup");
      socket.off("messageDeleted");
    };
  }, [socket, currentUserId, selectedMessage, dispatch]);

  return (
    <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
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

      <div className="flex-grow text-gray-700 overflow-auto">
        {activeTab === "/chat" && (
          <MessageList
            messages={[myCloudItem, ...messages]}
            onMessageClick={handleMessageClick}
            userId={currentUserId}
            selectedMessage={selectedMessage}
          />
        )}
        {activeTab === "/contact" && <SibarContact />}
      </div>
    </div>
  );
}

export default ChatList;