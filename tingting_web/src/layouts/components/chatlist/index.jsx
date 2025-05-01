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
import {
  onChatInfoUpdated,
  offChatInfoUpdated,
} from "../../../services/sockets/events/chatInfo";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";
import { Api_Profile } from "../../../../apis/api_profile";
import SibarContact from "../contact-form/SideBarContact/SideBarContact";

const cx = classNames.bind(styles);

function ChatList({ activeTab, onGroupCreated }) {
  const [messages, setMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState("priority");
  const dispatch = useDispatch();
  const { socket, userId: currentUserId } = useSocket();

  // Cloud của tôi item
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

  // Xử lý khi click vào tin nhắn
  const handleMessageClick = (message) => {
    console.log(`Chọn conversation: ${message.id}`);
    if (message.id !== "my-cloud") {
      joinConversation(socket, message.id);
    }
    dispatch(setSelectedMessage(message));
  };

  const handleTabClick = (tab) => {
    console.log(`Chuyển tab: ${tab}`);
    setSelectedTab(tab);
  };
    // Hàm thêm nhóm mới vào messages
    const addNewGroup = async (newConversation) => {
      console.log("Thêm nhóm mới:", newConversation);
  
      // Kiểm tra xem nhóm đã tồn tại chưa
      if (messages.some((msg) => msg.id === newConversation._id)) {
        console.log("Nhóm đã tồn tại, bỏ qua:", newConversation._id);
        return;
      }
  
      // Lấy profile của các thành viên trong nhóm
      const participantIds = newConversation.participants
        .map((p) => p.userId)
        .filter((id) => id !== currentUserId);
  
      const profiles = await Promise.all(
        participantIds.map(async (userId) => {
          try {
            const response = await Api_Profile.getProfile(userId);
            return response?.data?.user || null;
          } catch (error) {
            console.error(`Lỗi khi lấy profile cho userId ${userId}:`, error);
            return null;
          }
        })
      );
  
      // Chuyển đổi nhóm mới thành định dạng message
      const newMessage = transformConversationsToMessages(
        [newConversation],
        currentUserId,
        profiles
      )[0];
  
      // Thêm nhóm mới vào đầu danh sách messages
      setMessages((prevMessages) => [newMessage, ...prevMessages]);
    };

  // Load và cập nhật conversations
  useEffect(() => {
    if (!socket || !currentUserId) {
      console.warn("Thiếu socket hoặc userId");
      return;
    }

    const handleConversations = async (conversations) => {
      console.log("Nhận conversations:", conversations);

      // Lấy profile của các user còn lại
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
            const response = await Api_Profile.getProfile(userId);
            return response?.data?.user || null;
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
      console.log("Cập nhật conversation:", updatedConversation);
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

    // Xử lý nhóm mới được tạo từ socket
    const handleNewGroupConversation = (newConversation) => {
      console.log("Nhóm mới từ socket:", newConversation);
      addNewGroup(newConversation);
    };

    // Xử lý nhóm mới từ prop (callback từ Search)
    if (onGroupCreated) {
      onGroupCreated(addNewGroup); // Đăng ký hàm addNewGroup để Search gọi
    }
    // Cập nhật trạng thái pin và mute từ chatInfo
    const handleChatInfoUpdated = (updatedInfo) => {
      console.log("Nhận cập nhật chatInfo:", updatedInfo);
      setMessages((prevMessages) => {
        return prevMessages.map((msg) => {
          if (msg.id === updatedInfo._id) {
            const participant = updatedInfo.participants?.find(
              (p) => p.userId === currentUserId
            );
            return {
              ...msg,
              participants: updatedInfo.participants || msg.participants,
              name: updatedInfo.name || msg.name,
              isGroup: updatedInfo.isGroup ?? msg.isGroup,
              isPinned: participant?.isPinned || false,
              mute: participant?.mute || false,
            };
          }
          return msg;
        });
      });
    };


    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    onConversationUpdate(socket, handleConversationUpdate);
    onChatInfoUpdated(socket, handleChatInfoUpdated);

    return () => {
      console.log("Gỡ sự kiện socket");
      cleanupLoad();
      offConversationUpdate(socket);
      offChatInfoUpdated(socket);
    };
  }, [socket, currentUserId]);

  return (
    <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
      {/* Thanh tìm kiếm */}
      <div className="p-2 bg-white shadow-md">
      <SearchCompo onGroupCreated={(groupData) => addNewGroup(groupData)} />
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
          />
        )}
        {activeTab === "/contact" && <SibarContact />}
      </div>
    </div>
  );
}

export default ChatList;