import React, { useState, useEffect, useRef } from "react";
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
  offConversationRemoved,
  onConversationRemoved,
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
  const joinedRoomsRef = useRef(new Set()); // Lưu trữ các phòng đã tham gia

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

  const handleMessageClick = (message) => {
    console.log("ChatList: Chọn conversation", { id: message.id });
    if (message.id !== "my-cloud" && !joinedRoomsRef.current.has(message.id)) {
      console.log("ChatList: Tham gia phòng khi click", message.id);
      joinConversation(socket, message.id);
      joinedRoomsRef.current.add(message.id);
    }
    dispatch(setSelectedMessage(message));
  };

  const handleTabClick = (tab) => {
    console.log("ChatList: Chuyển tab", { tab });
    setSelectedTab(tab);
  };

  const addNewGroup = async (newConversation) => {
    console.log("ChatList: Thêm nhóm mới", newConversation);

    if (messages.some((msg) => msg.id === newConversation._id)) {
      console.log("ChatList: Nhóm đã tồn tại, bỏ qua", { id: newConversation._id });
      return;
    }

    const participantIds = newConversation.participants
      .map((p) => p.userId)
      .filter((id) => id !== currentUserId);

    const profiles = await Promise.all(
      participantIds.map(async (userId) => {
        try {
          const response = await Api_Profile.getProfile(userId);
          console.log("ChatList: Nhận profile cho user", { userId, profile: response?.data?.user });
          return response?.data?.user || null;
        } catch (error) {
          console.error("ChatList: Lỗi khi lấy profile cho userId", { userId, error });
          return null;
        }
      })
    );

    const newMessage = transformConversationsToMessages(
      [newConversation],
      currentUserId,
      profiles
    )[0];

    console.log("ChatList: Chuyển đổi nhóm mới thành message", newMessage);

    setMessages((prevMessages) => {
      const updatedMessages = [newMessage, ...prevMessages];
      const uniqueMessages = Array.from(
        new Map(updatedMessages.map((msg) => [msg.id, msg])).values()
      );
      console.log("ChatList: Cập nhật messages với nhóm mới", uniqueMessages);
      return uniqueMessages;
    });

    if (newConversation._id && !joinedRoomsRef.current.has(newConversation._id)) {
      console.log("ChatList: Tham gia phòng cho nhóm mới", newConversation._id);
      joinConversation(socket, newConversation._id);
      joinedRoomsRef.current.add(newConversation._id);
    }
  };

  useEffect(() => {
    if (!socket || !currentUserId) {
      console.warn("ChatList: Thiếu socket hoặc userId", { socket, currentUserId });
      return;
    }

    console.log("ChatList: Đăng ký lắng nghe socket events", { socketId: socket.id });

    const handleConversations = async (conversations) => {
      console.log("ChatList: Nhận conversations", conversations);

      // Tham gia các phòng chưa tham gia
      conversations.forEach((conversation) => {
        if (!joinedRoomsRef.current.has(conversation._id)) {
          console.log("ChatList: Tham gia phòng", conversation._id);
          joinConversation(socket, conversation._id);
          joinedRoomsRef.current.add(conversation._id);
        }
      });

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
            console.log("ChatList: Nhận profile cho user", { userId, profile: response?.data?.user });
            return response?.data?.user || null;
          } catch (error) {
            console.error("ChatList: Lỗi khi lấy profile cho userId", { userId, error });
            return null;
          }
        })
      );

      const transformedMessages = transformConversationsToMessages(
        conversations,
        currentUserId,
        profiles
      );
      const uniqueMessages = Array.from(
        new Map(transformedMessages.map((msg) => [msg.id, msg])).values()
      );
      console.log("ChatList: Transform và lọc messages", uniqueMessages);
      setMessages(uniqueMessages);
    };

    const handleConversationUpdate = (updatedConversation) => {
      console.log("ChatList: Cập nhật conversation", updatedConversation);
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
            console.log("ChatList: Cập nhật message", updatedMsg);
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
          console.log("ChatList: Thêm message mới", newMessage);
          return [newMessage, ...updatedMessages];
        }

        console.log("ChatList: Messages sau khi cập nhật conversation", updatedMessages);
        return updatedMessages;
      });
    };

    const handleNewGroupConversation = (newConversation) => {
      console.log("ChatList: Nhận nhóm mới từ socket", newConversation);
      addNewGroup(newConversation);
    };

    const handleConversationRemoved = (data) => {
      console.log("ChatList: Cuộc trò chuyện đã bị xóa", data);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== data.conversationId)
      );
      dispatch(setSelectedMessage(null));
    };

    const handleChatInfoUpdated = (updatedInfo) => {
      console.log("ChatList: Nhận sự kiện chatInfoUpdated", updatedInfo);
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
            console.log("ChatList: Cập nhật message với tên mới", updatedMsg);
            return updatedMsg;
          }
          return msg;
        });
        console.log("ChatList: Danh sách messages sau khi cập nhật", updatedMessages);
        return [...updatedMessages];
      });
    };

    if (onGroupCreated) {
      console.log("ChatList: Đăng ký callback onGroupCreated");
      onGroupCreated(addNewGroup);
    }

    // Debug trạng thái socket
    socket.on("connect", () => {
      console.log("ChatList: Socket connected", { socketId: socket.id });
      // Tham gia lại các phòng khi reconnect
      messages.forEach((msg) => {
        if (msg.id !== "my-cloud" && !joinedRoomsRef.current.has(msg.id)) {
          console.log("ChatList: Tham gia lại phòng khi reconnect", msg.id);
          joinConversation(socket, msg.id);
          joinedRoomsRef.current.add(msg.id);
        }
      });
    });
    socket.on("disconnect", () => {
      console.warn("ChatList: Socket disconnected");
    });
    socket.on("error", (error) => {
      console.error("ChatList: Socket error", error);
    });

    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    onConversationUpdate(socket, handleConversationUpdate);
    onChatInfoUpdated(socket, handleChatInfoUpdated);
    socket.on("newGroupConversation", handleNewGroupConversation);
    onConversationRemoved(socket, handleConversationRemoved);

    return () => {
      console.log("ChatList: Gỡ sự kiện socket");
      cleanupLoad();
      offConversationUpdate(socket);
      offChatInfoUpdated(socket);
      socket.off("newGroupConversation", handleNewGroupConversation);
      offConversationRemoved(socket);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("error");
    };
  }, [socket, currentUserId, onGroupCreated, dispatch]); // Loại bỏ messages khỏi dependencies

  console.log("ChatList: Render với messages", messages);

  return (
    <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
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