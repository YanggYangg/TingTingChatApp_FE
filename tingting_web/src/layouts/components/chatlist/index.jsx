import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames/bind";
import styles from "./chatlist.module.scss";
import MessageList from "../../../components/MessageList";
import SearchCompo from "../../../components/searchComponent/SearchCompo";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedMessage, setLastMessageUpdate, setChatInfoUpdate } from "../../../redux/slices/chatSlice";
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
} from "../../../services/sockets/events/chatInfo";
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";
import { Api_Profile } from "../../../../apis/api_profile";
import SibarContact from "../contact-form/SideBarContact/SideBarContact";
import { toast } from "react-toastify";

const cx = classNames.bind(styles);

function ChatList({ activeTab, onGroupCreated }) {
  const [messages, setMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState("priority");
  const [userCache, setUserCache] = useState({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const dispatch = useDispatch();
  const { socket, userId: currentUserId } = useSocket();
  const joinedRoomsRef = useRef(new Set());
  const chatInfoUpdate = useSelector((state) => state.chat.chatInfoUpdate);
  const lastMessageUpdate = useSelector((state) => state.chat.lastMessageUpdate);

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
    isPinned: false,
  };

  useEffect(() => {
    if (!socket) {
      setIsSocketConnected(false);
      return;
    }

    const handleConnect = () => {
      console.log("ChatList: Socket đã kết nối", { socketId: socket.id });
      setIsSocketConnected(true);
      joinedRoomsRef.current.forEach((conversationId) => {
        joinConversation(socket, conversationId);
        console.log(`ChatList: Tham gia lại phòng khi reconnect: ${conversationId}`);
      });
    };

    const handleDisconnect = () => {
      console.log("ChatList: Socket mất kết nối");
      setIsSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  const handleMessageClick = (message) => {
    if (!isSocketConnected) {
      console.warn("ChatList: Socket chưa kết nối, không thể chọn hội thoại");
      return;
    }
    console.log(`ChatList: Chọn cuộc hội thoại: ${message.id}`);
    if (message.id !== "my-cloud" && !joinedRoomsRef.current.has(message.id)) {
      joinConversation(socket, message.id);
      joinedRoomsRef.current.add(message.id);
      console.log(`ChatList: Tham gia phòng: ${message.id}`);
    }
    dispatch(setSelectedMessage(message));
  };

  const handleTabClick = (tab) => {
    console.log(`ChatList: Chuyển tab sang: ${tab}`);
    setSelectedTab(tab);
  };

  const checkPinnedLimit = () => {
    const pinnedCount = messages.filter((msg) => msg.isPinned && !msg.isCloud).length;
    return pinnedCount >= 5;
  };

  const handlePinConversation = (conversationId, isPinned) => {
    if (!isSocketConnected) {
      console.warn("ChatList: Socket chưa kết nối, không thể ghim/bỏ ghim");
      toast.error("Socket chưa kết nối, vui lòng thử lại sau!");
      return;
    }

    if (!isPinned && checkPinnedLimit()) {
      toast.error("Bạn chỉ có thể ghim tối đa 5 cuộc trò chuyện!");
      return;
    }

    if (socket) {
      console.log(`ChatList: Gửi sự kiện updateChatInfo để ${isPinned ? "bỏ ghim" : "ghim"}`, { conversationId });
      socket.emit("updateChatInfo", {
        conversationId,
        userId: currentUserId,
        isPinned: !isPinned,
      });
      if (!joinedRoomsRef.current.has(conversationId)) {
        joinConversation(socket, conversationId);
        joinedRoomsRef.current.add(conversationId);
      }
    }
  };

  const sortMessages = (messages) => {
    return messages.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = new Date(a.updateAt || a.time || 0);
      const timeB = new Date(b.updateAt || b.time || 0);
      return timeB - timeA;
    });
  };

  const addNewGroup = async (newConversation) => {
    console.log("ChatList: Thêm nhóm mới:", newConversation);
    if (messages.some((msg) => msg.id === newConversation._id)) {
      console.log("ChatList: Nhóm đã tồn tại, bỏ qua:", newConversation._id);
      return;
    }

    const participantIds = newConversation.participants
      .map((p) => p.userId)
      .filter((id) => id !== currentUserId);

    const profiles = await Promise.all(
      participantIds.map(async (userId) => {
        if (userCache[userId]) {
          console.log("ChatList: Lấy thông tin từ cache:", userId);
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
          console.error(`ChatList: Lỗi khi lấy profile cho userId ${userId}:`, error);
          return null;
        }
      })
    );

    const newMessage = transformConversationsToMessages(
      [newConversation],
      currentUserId,
      profiles
    )[0];

    console.log("ChatList: Chuyển đổi nhóm mới thành message:", newMessage);
    setMessages((prevMessages) => {
      const updatedMessages = [newMessage, ...prevMessages];
      const uniqueMessages = Array.from(
        new Map(updatedMessages.map((msg) => [msg.id, msg])).values()
      );
      return sortMessages(uniqueMessages);
    });

    if (!joinedRoomsRef.current.has(newConversation._id)) {
      joinConversation(socket, newConversation._id);
      joinedRoomsRef.current.add(newConversation._id);
      console.log(`ChatList: Tham gia phòng nhóm mới: ${newConversation._id}`);
    }
  };

  useEffect(() => {
    if (!socket || !currentUserId) {
      console.warn("ChatList: Thiếu socket hoặc userId", { socket, currentUserId });
      return;
    }

    console.log("ChatList: Đăng ký sự kiện socket", { socketId: socket?.id, currentUserId });

    const handleConversations = async (conversations) => {
      console.log("ChatList: Nhận danh sách hội thoại:", conversations);
      conversations.forEach((conversation) => {
        if (!joinedRoomsRef.current.has(conversation._id)) {
          console.log("ChatList: Tham gia phòng:", conversation._id);
          joinConversation(socket, conversation._id);
          joinedRoomsRef.current.add(conversation._id);
        }
      });

      const otherParticipantIds = [
        ...new Set(
          conversations
            .map((conversation) => {
              const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
              const other = participants.find((p) => p.userId !== currentUserId);
              return other?.userId;
            })
            .filter(Boolean)
        ),
      ];

      const profiles = await Promise.all(
        otherParticipantIds.map(async (userId) => {
          if (userCache[userId]) {
            console.log("ChatList: Lấy thông tin từ cache:", userId);
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
            console.error(`ChatList: Lỗi khi lấy profile cho userId ${userId}:`, error);
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
      setMessages(sortMessages(uniqueMessages));
    };

    const handleConversationUpdate = (updatedConversation) => {
      console.log("ChatList: Nhận sự kiện conversationUpdated:", updatedConversation);
      setMessages((prevMessages) => {
        const updatedConversationId = updatedConversation.conversationId?._id || updatedConversation.conversationId || updatedConversation._id;
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === updatedConversationId) {
            const updatedMsg = {
              ...msg,
              lastMessage: updatedConversation.lastMessage?.content || msg.lastMessage || "",
              lastMessageType: updatedConversation.lastMessage?.messageType || msg.lastMessageType || "text",
              lastMessageSenderId: updatedConversation.lastMessage?.userId || msg.lastMessageSenderId || null,
              time: new Date(updatedConversation.lastMessage?.createdAt || updatedConversation.updatedAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              ),
              updateAt: updatedConversation.lastMessage?.createdAt || updatedConversation.updatedAt,
            };
            console.log("ChatList: Message đã cập nhật từ conversationUpdated:", updatedMsg);
            return updatedMsg;
          }
          return msg;
        });

        const isNew = !updatedMessages.some((msg) => msg.id === updatedConversation._id);
        if (isNew && updatedConversation._id) {
          const newMessage = transformConversationsToMessages(
            [updatedConversation],
            currentUserId,
            []
          )[0];
          console.log("ChatList: Thêm message mới:", newMessage);
          updatedMessages.push(newMessage);
          if (!joinedRoomsRef.current.has(updatedConversation._id)) {
            joinConversation(socket, updatedConversation._id);
            joinedRoomsRef.current.add(updatedConversation._id);
          }
        }

        return sortMessages(updatedMessages);
      });
    };

    const handleNewGroupConversation = (newConversation) => {
      console.log("ChatList: Nhóm mới từ socket:", newConversation);
      addNewGroup(newConversation);
    };

    const handleGroupLeft = (data) => {
      console.log("ChatList: Nhận sự kiện rời nhóm:", data);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== data.conversationId)
      );
      dispatch(setSelectedMessage(null));
    };

    const handleConversationRemoved = (data) => {
      console.log("ChatList: Hội thoại bị xóa:", data);
      setMessages((prev) => prev.filter((msg) => msg.id !== data.conversationId));
      dispatch(setSelectedMessage(null));
    };

    const handleChatInfoUpdated = (updatedInfo) => {
      console.log("ChatList: Nhận sự kiện chatInfoUpdated:", updatedInfo);
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === updatedInfo._id) {
            const participant = updatedInfo.participants?.find((p) => p.userId === currentUserId);
            const updatedMsg = {
              ...msg,
              participants: updatedInfo.participants || msg.participants,
              name: updatedInfo.name || msg.name,
              isGroup: updatedInfo.isGroup ?? msg.isGroup,
              imageGroup: updatedInfo.imageGroup || msg.imageGroup,
              isPinned: participant?.isPinned || false,
              mute: participant?.mute || false,
            };
            console.log("ChatList: Message đã cập nhật từ chatInfoUpdated:", updatedMsg);
            return updatedMsg;
          }
          return msg;
        });
        return sortMessages(updatedMessages);
      });
    };

    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    onConversationUpdate(socket, handleConversationUpdate);
    onChatInfoUpdated(socket, handleChatInfoUpdated);
    socket.on("newGroupConversation", handleNewGroupConversation);
    onConversationRemoved(socket, handleConversationRemoved);
    onGroupLeft(socket, handleGroupLeft);

    return () => {
      console.log("ChatList: Dọn dẹp sự kiện socket");
      cleanupLoad();
      offConversationUpdate(socket);
      offChatInfoUpdated(socket);
      socket.off("newGroupConversation", handleNewGroupConversation);
      offConversationRemoved(socket);
      offGroupLeft(socket);
    };
  }, [socket, currentUserId, onGroupCreated, dispatch]);

  useEffect(() => {
    if (chatInfoUpdate) {
      console.log("ChatList: Nhận chatInfoUpdate từ Redux:", chatInfoUpdate);
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === chatInfoUpdate._id) {
            const participant = chatInfoUpdate.participants?.find((p) => p.userId === currentUserId) || {};
            const updatedMsg = {
              ...msg,
              participants: chatInfoUpdate.participants || msg.participants,
              name: chatInfoUpdate.name || msg.name,
              isGroup: chatInfoUpdate.isGroup ?? msg.isGroup,
              imageGroup: chatInfoUpdate.imageGroup || msg.imageGroup,
              isPinned: participant.isPinned || false,
              mute: participant.mute || false,
            };
            console.log("ChatList: Cập nhật message từ Redux (chatInfoUpdate):", updatedMsg);
            return updatedMsg;
          }
          return msg;
        });
        return sortMessages(updatedMessages);
      });
    }
  }, [chatInfoUpdate, currentUserId]);

  useEffect(() => {
    if (lastMessageUpdate) {
      console.log("ChatList: Nhận lastMessageUpdate từ Redux:", lastMessageUpdate);
      setMessages((prevMessages) => {
        const conversationId = lastMessageUpdate.conversationId?._id || lastMessageUpdate.conversationId;
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === conversationId) {
            const updatedMsg = {
              ...msg,
              lastMessage: lastMessageUpdate.lastMessage?.content || "",
              lastMessageType: lastMessageUpdate.lastMessage?.messageType || msg.lastMessageType || "text",
              lastMessageSenderId: lastMessageUpdate.lastMessage?.userId || msg.lastMessageSenderId || null,
              time: lastMessageUpdate.lastMessage
                ? new Date(lastMessageUpdate.lastMessage.createdAt).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )
                : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              updateAt: lastMessageUpdate.lastMessage?.createdAt || new Date().toISOString(),
            };
            console.log("ChatList: Cập nhật message từ Redux (lastMessageUpdate):", updatedMsg);
            return updatedMsg;
          }
          return msg;
        });
        return sortMessages(updatedMessages);
      });
    }
  }, [lastMessageUpdate]);

  console.log("ChatList: Render với danh sách message:", messages);

  return (
    <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
      <div className="p-2 bg-white shadow-md">
        <SearchCompo onGroupCreated={(groupData) => addNewGroup(groupData)} />
      </div>
      {activeTab === "/chat" && (
        <div className="flex justify-start space-x-4 px-4 py-2 border-b">
          <button
            className={`font-semibold px-2 ${selectedTab === "priority"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
              }`}
            onClick={() => handleTabClick("priority")}
          >
            Ưu tiên
          </button>
          <button
            className={`font-semibold px-2 ${selectedTab === "others"
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
        {!isSocketConnected ? (
          <div className="text-center text-gray-500 p-4">
            Đang kết nối tới server, vui lòng chờ...
          </div>
        ) : (
          activeTab === "/chat" && (
            <MessageList
              messages={[myCloudItem, ...messages]}
              onMessageClick={handleMessageClick}
              onPinConversation={handlePinConversation}
              userId={currentUserId}
              userCache={userCache}
            />
          )
        )}
        {activeTab === "/contact" && <SibarContact />}
      </div>
    </div>
  );
}

export default ChatList;