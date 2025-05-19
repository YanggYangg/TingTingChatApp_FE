import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames/bind";
import styles from "./chatlist.module.scss";
import MessageList from "../../../components/MessageList";
import SearchCompo from "../../../components/searchComponent/SearchCompo";
import PinVerificationModal from "../../../components/PinVerificationModal";
import PinLimitModal from "../../../components/chatInforComponent/PinLimitModal";
import { useDispatch, useSelector } from "react-redux";
import {
  setSelectedMessage,
  setLastMessageUpdate,
  setChatInfoUpdate,
} from "../../../redux/slices/chatSlice";
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

function ChatList({ activeTab, onGroupCreated, onConversationSelected }) {
  const [messages, setMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState("priority");
  const [userCache, setUserCache] = useState({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isPinLimitModalOpen, setIsPinLimitModalOpen] = useState(false); // State cho modal giới hạn ghim
  const [selectedConversation, setSelectedConversation] = useState(null);

  const dispatch = useDispatch();
  const { socket, userId: currentUserId } = useSocket();
  const joinedRoomsRef = useRef(new Set());
  const chatInfoUpdate = useSelector((state) => state.chat.chatInfoUpdate);
  const lastMessageUpdate = useSelector((state) => state.chat.lastMessageUpdate);

  const myCloudItem = {
    id: "my-cloud",
    name: "Cloud của tôi",
    avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
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
      socket.emit("registerUser", { userId: currentUserId });
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
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, currentUserId]);

  const handleMessageClick = (message) => {
    if (!isSocketConnected) {
      console.warn("ChatList: Socket chưa kết nối, không thể chọn hội thoại");
      toast.error("Socket chưa kết nối, vui lòng thử lại sau!");
      return;
    }

    if (message.isHidden && message.id !== "my-cloud") {
      console.log(`ChatList: Mở modal nhập PIN cho cuộc trò chuyện ẩn: ${message.id}`);
      setSelectedConversation(message);
      setIsPinModalOpen(true);
      return;
    }

    if (message.isNew) {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === message.id ? { ...msg, isNew: false } : msg
        )
      );
    }

    proceedWithMessageSelection(message);
  };

  const proceedWithMessageSelection = (message) => {
    console.log(`ChatList: Chọn cuộc hội thoại: ${message.id}`);
    if (message.id !== "my-cloud" && !joinedRoomsRef.current.has(message.id)) {
      joinConversation(socket, message.id);
      joinedRoomsRef.current.add(message.id);
      console.log(`ChatList: Tham gia phòng: ${message.id}`);
    }
    dispatch(setSelectedMessage(message));
    if (onConversationSelected) {
      onConversationSelected(message);
    }
  };

  const handlePinVerified = () => {
    if (selectedConversation) {
      console.log(`ChatList: Xác thực PIN thành công, chọn hội thoại: ${selectedConversation.id}`);
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) =>
          msg.id === selectedConversation.id ? { ...msg, isHidden: false } : msg
        );
        return sortMessages(updatedMessages);
      });
      proceedWithMessageSelection(selectedConversation);
    }
    setIsPinModalOpen(false);
    setSelectedConversation(null);
  };

  const handleClosePinModal = () => {
    console.log("ChatList: Đóng modal nhập PIN");
    setIsPinModalOpen(false);
    setSelectedConversation(null);
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
      setIsPinLimitModalOpen(true); // Hiển thị modal khi vượt quá giới hạn
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
    const filteredMessages = messages.filter((msg) => {
      if (msg.isCloud) return true;
      const participant = msg.participants?.find((p) => p.userId === currentUserId);
      return !participant?.isHidden;
    });

    return filteredMessages.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (!a.isPinned && !b.isPinned) {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
      }
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

    const newMessage = {
      ...transformConversationsToMessages([newConversation], currentUserId, profiles)[0],
      isNew: true,
    };
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

    setTimeout(() => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === newConversation._id ? { ...msg, isNew: false } : msg
        )
      );
    }, 5 * 60 * 1000);

    if (onGroupCreated) {
      onGroupCreated(newConversation);
    }
  };

  const handleTabClick = (tab) => {
    console.log(`ChatList: Chuyển tab sang: ${tab}`);
    setSelectedTab(tab);
  };

  const handleSearchResults = (results) => {
    console.log("ChatList: Nhận kết quả tìm kiếm:", results);
    setSearchResults(results);
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
        const participant = conversation.participants?.find((p) => p.userId === currentUserId);
        if (!participant?.isHidden && !joinedRoomsRef.current.has(conversation._id)) {
          joinConversation(socket, conversation._id);
          joinedRoomsRef.current.add(conversation._id);
          console.log("ChatList: Tham gia phòng:", conversation._id);
        }
      });

      const otherParticipantIds = [
        ...new Set(
          conversations
            .map((conversation) =>
              conversation.participants?.find((p) => p.userId !== currentUserId)?.userId
            )
            .filter(Boolean)
        ),
      ];

      const profiles = await Promise.all(
        otherParticipantIds.map(async (userId) => {
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
            console.error(`ChatList: Lỗi khi lấy profile cho userId ${userId}:`, error);
            return null;
          }
        })
      );

      const transformedMessages = transformConversationsToMessages(conversations, currentUserId, profiles);
      const uniqueMessages = Array.from(
        new Map(transformedMessages.map((msg) => [msg.id, msg])).values()
      );
      setMessages(sortMessages(uniqueMessages));
    };

    const handleConversationUpdate = (updatedConversation) => {
      console.log("ChatList: Nhận sự kiện conversationUpdated:", updatedConversation);
      setMessages((prevMessages) => {
        const updatedConversationId =
          updatedConversation.conversationId?._id ||
          updatedConversation.conversationId ||
          updatedConversation._id;
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === updatedConversationId) {
            return {
              ...msg,
              lastMessage: updatedConversation.lastMessage?.content || msg.lastMessage || "",
              lastMessageType: updatedConversation.lastMessage?.messageType || msg.lastMessageType || "text",
              lastMessageSenderId: updatedConversation.lastMessage?.userId || msg.lastMessageSenderId || null,
              time: new Date(
                updatedConversation.lastMessage?.createdAt || updatedConversation.updatedAt
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              updateAt: updatedConversation.lastMessage?.createdAt || updatedConversation.updatedAt,
            };
          }
          return msg;
        });

        const isNew = !updatedMessages.some((msg) => msg.id === updatedConversation._id);
        if (isNew && updatedConversation._id) {
          const newMessage = transformConversationsToMessages([updatedConversation], currentUserId, [])[0];
          const participant = updatedConversation.participants?.find((p) => p.userId === currentUserId);
          if (!participant?.isHidden) {
            updatedMessages.push(newMessage);
            if (!joinedRoomsRef.current.has(updatedConversation._id)) {
              joinConversation(socket, updatedConversation._id);
              joinedRoomsRef.current.add(updatedConversation._id);
            }
          }
        }

        return sortMessages(updatedMessages);
      });
    };

    const handleNewGroupConversation = (newConversation) => {
      console.log("ChatList: Nhóm mới từ socket:", newConversation);
      const participant = newConversation.participants?.find((p) => p.userId === currentUserId);
      if (!participant?.isHidden) {
        addNewGroup(newConversation);
      }
    };

    const handleGroupLeft = (data) => {
      console.log("ChatList: Nhận sự kiện rời nhóm:", data);
      if (data.userId === currentUserId) {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== data.conversationId));
        dispatch(setSelectedMessage(null));
        console.log(`ChatList: Xóa hội thoại ${data.conversationId} khỏi danh sách của user ${currentUserId}`);
      }
    };

    const handleConversationRemoved = (data) => {
      console.log("ChatList: Nhận sự kiện conversationRemoved:", data);
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter((msg) => msg.id !== data.conversationId);
        console.log(`ChatList: Đã xóa hội thoại ${data.conversationId} khỏi danh sách messages`);
        return updatedMessages;
      });
      dispatch(setSelectedMessage(null));
      if (joinedRoomsRef.current.has(data.conversationId)) {
        joinedRoomsRef.current.delete(data.conversationId);
        socket.emit("leaveConversation", { conversationId: data.conversationId });
        console.log(`ChatList: Rời phòng ${data.conversationId}`);
      }
      // toast.info("Bạn đã bị xóa khỏi nhóm");
    };

    const handleChatInfoUpdated = (updatedInfo) => {
      console.log("ChatList: Nhận sự kiện chatInfoUpdated:", updatedInfo);
      const participant = updatedInfo.participants?.find((p) => p.userId === currentUserId);
      if (!participant || participant.isHidden) {
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.filter((msg) => msg.id !== updatedInfo._id);
          console.log(`ChatList: Xóa hội thoại ${updatedInfo._id} vì người dùng không còn là thành viên hoặc bị ẩn`);
          return updatedMessages;
        });
        dispatch(setSelectedMessage(null));
        if (joinedRoomsRef.current.has(updatedInfo._id)) {
          socket.emit("leaveConversation", { conversationId: updatedInfo._id });
          joinedRoomsRef.current.delete(updatedInfo._id);
          console.log(`ChatList: Rời phòng ${updatedInfo._id}`);
        }
        return;
      }

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === updatedInfo._id) {
            return {
              ...msg,
              participants: updatedInfo.participants || msg.participants,
              name: updatedInfo.name || msg.name,
              isGroup: updatedInfo.isGroup ?? msg.isGroup,
              imageGroup: updatedInfo.imageGroup || msg.imageGroup,
              isPinned: participant?.isPinned || false,
              mute: participant?.mute || false,
            };
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
  }, [socket, currentUserId, dispatch]);

  useEffect(() => {
    if (chatInfoUpdate) {
      console.log("ChatList: Nhận chatInfoUpdate từ Redux:", chatInfoUpdate);
      const participant = chatInfoUpdate.participants?.find((p) => p.userId === currentUserId);
      if (!participant || participant.isHidden) {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== chatInfoUpdate._id));
        dispatch(setSelectedMessage(null));
        if (joinedRoomsRef.current.has(chatInfoUpdate._id)) {
          socket.emit("leaveConversation", { conversationId: chatInfoUpdate._id });
          joinedRoomsRef.current.delete(chatInfoUpdate._id);
        }
        return;
      }

      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === chatInfoUpdate._id) {
            return {
              ...msg,
              participants: chatInfoUpdate.participants || msg.participants,
              name: chatInfoUpdate.name || msg.name,
              isGroup: chatInfoUpdate.isGroup ?? msg.isGroup,
              imageGroup: chatInfoUpdate.imageGroup || msg.imageGroup,
              isPinned: participant.isPinned || false,
              mute: participant.mute || false,
            };
          }
          return msg;
        });
        return sortMessages(updatedMessages);
      });
    }
  }, [chatInfoUpdate, currentUserId, dispatch, socket]);

  useEffect(() => {
    if (lastMessageUpdate) {
      console.log("ChatList: Nhận lastMessageUpdate từ Redux:", lastMessageUpdate);
      setMessages((prevMessages) => {
        const conversationId = lastMessageUpdate.conversationId?._id || lastMessageUpdate.conversationId;
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === conversationId) {
            return {
              ...msg,
              lastMessage: lastMessageUpdate.lastMessage?.content || "",
              lastMessageType: lastMessageUpdate.lastMessage?.messageType || msg.lastMessageType || "text",
              lastMessageSenderId: lastMessageUpdate.lastMessage?.userId || msg.lastMessageSenderId || null,
              time: lastMessageUpdate.lastMessage
                ? new Date(lastMessageUpdate.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              updateAt: lastMessageUpdate.lastMessage?.createdAt || new Date().toISOString(),
            };
          }
          return msg;
        });
        return sortMessages(updatedMessages);
      });
    }
  }, [lastMessageUpdate]);

  return (
    <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
      <div className="p-2 bg-white shadow-md">
        <SearchCompo
          onGroupCreated={(groupData) => addNewGroup(groupData)}
          onSearchResults={handleSearchResults}
          onConversationSelected={handleMessageClick}
        />
      </div>

      {activeTab === "/chat" && (
        <div className="flex justify-start space-x-4 px-4 py-2 border-b">
          <button
            className={`font-semibold px-2 ${
              selectedTab === "priority" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
            }`}
            onClick={() => handleTabClick("priority")}
          >
            Ưu tiên
          </button>
          <button
            className={`font-semibold px-2 ${
              selectedTab === "others" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600"
            }`}
            onClick={() => handleTabClick("others")}
          >
            Khác
          </button>
        </div>
      )}

      <div className="flex-grow text-gray-700 overflow-auto">
        {!isSocketConnected ? (
          <div className="text-center text-gray-500 p-4">Đang kết nối tới server, vui lòng chờ...</div>
        ) : activeTab === "/chat" ? (
          <MessageList
            messages={searchResults.length > 0 ? searchResults : [myCloudItem, ...messages]}
            onMessageClick={handleMessageClick}
            onPinConversation={handlePinConversation}
            userId={currentUserId}
            userCache={userCache}
          />
        ) : (
          <SibarContact />
        )}
      </div>

      <PinVerificationModal
        isOpen={isPinModalOpen}
        onClose={handleClosePinModal}
        conversationId={selectedConversation?.id}
        userId={currentUserId}
        socket={socket}
        onVerified={handlePinVerified}
      />
      <PinLimitModal
        isOpen={isPinLimitModalOpen}
        onClose={() => setIsPinLimitModalOpen(false)}
      />
    </div>
  );
}

export default ChatList;