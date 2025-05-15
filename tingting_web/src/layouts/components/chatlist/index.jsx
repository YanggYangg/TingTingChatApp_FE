import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames/bind";
import styles from "./chatlist.module.scss";
import MessageList from "../../../components/MessageList";
import SearchCompo from "../../../components/searchComponent/SearchCompo";
import { useDispatch, useSelector } from "react-redux"; // Nhi thêm
import {
  setSelectedMessage,
  setLastMessageUpdate,
  setChatInfoUpdate,
} from "../../../redux/slices/chatSlice"; // Nhi thêm: Thêm setLastMessageUpdate, setChatInfoUpdate
import { useSocket } from "../../../contexts/SocketContext";
import {
  loadAndListenConversations,
  onConversationUpdate,
  offConversationUpdate,
  joinConversation,
  onConversationRemoved,
  offConversationRemoved,
} from "../../../services/sockets/events/conversation"; // Nhi thêm: Thêm onConversationRemoved, offConversationRemoved
import {
  onChatInfoUpdated,
  offChatInfoUpdated,
  onGroupLeft,
  offGroupLeft,
} from "../../../services/sockets/events/chatInfo"; // Nhi thêm
import { transformConversationsToMessages } from "../../../utils/conversationTransformer";
import { Api_Profile } from "../../../../apis/api_profile";
import SibarContact from "../contact-form/SideBarContact/SideBarContact";
import GroupList from "../contact-form/GroupList";
import FriendRequests from "../contact-form/FriendRequests";
import GroupInvites from "../contact-form/GroupInvites";
import ContactList from "../contact-form/ContactList";
import { toast } from "react-toastify"; // Nhi thêm

const cx = classNames.bind(styles);

function ChatList({ activeTab, onGroupCreated }) { // Nhi thêm: Thêm onGroupCreated
  const [messages, setMessages] = useState([]);
  const [selectedTab, setSelectedTab] = useState("priority");
  const [userCache, setUserCache] = useState({}); // Nhi thêm
  const [isSocketConnected, setIsSocketConnected] = useState(false); // Nhi thêm
  const dispatch = useDispatch();
  const { socket, userId: currentUserId } = useSocket();
  const joinedRoomsRef = useRef(new Set()); // Nhi thêm
  const chatInfoUpdate = useSelector((state) => state.chat.chatInfoUpdate); // Nhi thêm
  const lastMessageUpdate = useSelector((state) => state.chat.lastMessageUpdate); // Nhi thêm

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
    isPinned: false, // Nhi thêm
  };

  // Nhi thêm: Xử lý kết nối socket
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

  // Xử lý khi click vào tin nhắn
  const handleMessageClick = (message) => {
    // Nhi thêm: Kiểm tra trạng thái socket
    if (!isSocketConnected) {
      console.warn("ChatList: Socket chưa kết nối, không thể chọn hội thoại");
      return;
    }
    console.log(`ChatList: Chọn cuộc hội thoại: ${message.id}`); // Nhi thêm
    if (message.id !== "my-cloud" && !joinedRoomsRef.current.has(message.id)) { // Nhi thêm: Kiểm tra joinedRoomsRef
      joinConversation(socket, message.id);
      joinedRoomsRef.current.add(message.id); // Nhi thêm
      
      // Kiểm tra trạng thái người dùng trong cuộc trò chuyện
      socket.emit("checkUserConversation", {
        conversationId: message.id,
        userId: currentUserId
      });
      
      console.log(`ChatList: Tham gia phòng: ${message.id}`); // Nhi thêm
    }
    dispatch(setSelectedMessage(message));
  };

  // Nhi thêm: Kiểm tra giới hạn ghim hội thoại
  const checkPinnedLimit = () => {
    const pinnedCount = messages.filter((msg) => msg.isPinned && !msg.isCloud).length;
    return pinnedCount >= 5;
  };

  // Nhi thêm: Xử lý ghim/bỏ ghim hội thoại
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

  // Nhi thêm: Sắp xếp danh sách hội thoại
  const sortMessages = (messages) => {
    return messages.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = new Date(a.updateAt || a.time || 0);
      const timeB = new Date(b.updateAt || b.time || 0);
      return timeB - timeA;
    });
  };

  // Nhi thêm: Thêm nhóm mới
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

    // Nhi thêm: Gọi onGroupCreated nếu có
    if (onGroupCreated) {
      onGroupCreated(newConversation);
    }
  };

  const handleTabClick = (tab) => {
    console.log(`ChatList: Chuyển tab sang: ${tab}`); // Nhi thêm
    setSelectedTab(tab);
  };

  // Load and listen for conversations
  useEffect(() => {
    if (!socket || !currentUserId) {
      console.warn("ChatList: Thiếu socket hoặc userId", { socket, currentUserId }); // Nhi thêm
      return;
    }

    console.log("ChatList: Đăng ký sự kiện socket", { socketId: socket?.id, currentUserId }); // Nhi thêm

    // Thêm xử lý sự kiện userInConversation
    const handleUserInConversation = (data) => {
      console.log("ChatList: Nhận thông tin trạng thái người dùng trong hội thoại:", data);
      
      if (data.userId === currentUserId) {
        if (data.isInRequestedConversation) {
          console.log(`ChatList: Người dùng đang trong cuộc trò chuyện ${data.requestedConversation}`);
        } else if (data.currentConversation) {
          toast.info(`Bạn đang trong một cuộc trò chuyện khác: ${data.currentConversation}`);
          console.log(`ChatList: Người dùng đang trong cuộc trò chuyện khác: ${data.currentConversation}`);
        }
      }
    };

    const handleConversations = async (conversations) => {
      console.log("ChatList: Nhận danh sách hội thoại:", conversations);
      // Nhi thêm: Tham gia tất cả các phòng hội thoại
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
          // Nhi thêm: Sử dụng userCache
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
      // Nhi thêm: Loại bỏ trùng lặp và sắp xếp
      const uniqueMessages = Array.from(
        new Map(transformedMessages.map((msg) => [msg.id, msg])).values()
      );
      setMessages(sortMessages(uniqueMessages));
    };

    const handleConversationUpdate = (updatedConversation) => {
      console.log("ChatList: Nhận sự kiện conversationUpdated:", updatedConversation); // Nhi thêm
      setMessages((prevMessages) => {
        const updatedConversationId = updatedConversation.conversationId?._id || updatedConversation.conversationId || updatedConversation._id; // Nhi thêm
        const updatedMessages = prevMessages.map((msg) => {
          if (msg.id === updatedConversationId) {
            const updatedMsg = {
              ...msg,
              lastMessage: updatedConversation.lastMessage?.content || msg.lastMessage || "", // Nhi thêm
              lastMessageType: updatedConversation.lastMessage?.messageType || msg.lastMessageType || "text", // Nhi thêm
              lastMessageSenderId: updatedConversation.lastMessage?.userId || msg.lastMessageSenderId || null, // Nhi thêm
              time: new Date(updatedConversation.lastMessage?.createdAt || updatedConversation.updatedAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              ), // Nhi thêm: Sử dụng createdAt nếu có
              updateAt: updatedConversation.lastMessage?.createdAt || updatedConversation.updatedAt, // Nhi thêm
            };
            console.log("ChatList: Message đã cập nhật từ conversationUpdated:", updatedMsg); // Nhi thêm
            return updatedMsg;
          }
          return msg;
        });

        const isNew = !updatedMessages.some((msg) => msg.id === updatedConversation._id); // Nhi thêm
        if (isNew && updatedConversation._id) {
          const newMessage = transformConversationsToMessages(
            [updatedConversation],
            currentUserId,
            []
          )[0];
          console.log("ChatList: Thêm message mới:", newMessage); // Nhi thêm
          updatedMessages.push(newMessage);
          if (!joinedRoomsRef.current.has(updatedConversation._id)) {
            joinConversation(socket, updatedConversation._id);
            joinedRoomsRef.current.add(updatedConversation._id);
          }
        }

        return sortMessages(updatedMessages); // Nhi thêm
      });
    };

    // Nhi thêm: Xử lý nhóm mới
    const handleNewGroupConversation = (newConversation) => {
      console.log("ChatList: Nhóm mới từ socket:", newConversation);
      addNewGroup(newConversation);
    };

    // Nhi thêm: Xử lý rời nhóm
    const handleGroupLeft = (data) => {
      console.log("ChatList: Nhận sự kiện rời nhóm:", data);
      if (data.userId === currentUserId) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== data.conversationId)
        );
        dispatch(setSelectedMessage(null));
        console.log(`ChatList: Xóa hội thoại ${data.conversationId} khỏi danh sách của user ${currentUserId}`);
      } else {
        console.log(`ChatList: Không cập nhật danh sách chat cho user ${currentUserId} vì user rời là ${data.userId}`);
      }
    };

    // Nhi thêm: Xử lý xóa hội thoại
    // [Đã chỉnh sửa] Thêm toast thông báo khi bị xóa khỏi nhóm và đảm bảo rời phòng socket
    const handleConversationRemoved = (data) => {
      console.log("ChatList: Nhận sự kiện conversationRemoved:", data);
      setMessages((prev) => {
        const updatedMessages = prev.filter((msg) => msg.id !== data.conversationId);
        console.log(`ChatList: Xóa hội thoại ${data.conversationId} khỏi danh sách`);
        return updatedMessages;
      });
      dispatch(setSelectedMessage(null));
      // Bỏ tham gia phòng socket
      if (joinedRoomsRef.current.has(data.conversationId)) {
        joinedRoomsRef.current.delete(data.conversationId);
        socket.emit("leaveConversation", { conversationId: data.conversationId });
        console.log(`ChatList: Rời phòng ${data.conversationId}`);
      }
      // [Thêm mới] Hiển thị thông báo khi bị xóa khỏi nhóm
      toast.info("Bạn đã bị xóa khỏi nhóm!");
    };

    // Nhi thêm: Xử lý cập nhật thông tin chat
    // [Đã chỉnh sửa] Thêm logic rời phòng socket khi người dùng không còn trong nhóm
    const handleChatInfoUpdated = (updatedInfo) => {
      console.log("ChatList: Nhận sự kiện chatInfoUpdated:", updatedInfo);
      if (!updatedInfo.participants.some((p) => p.userId === currentUserId)) {
        console.log(`ChatList: User ${currentUserId} không còn trong nhóm ${updatedInfo._id}, xóa hội thoại`);
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== updatedInfo._id)
        );
        dispatch(setSelectedMessage(null));
        // [Thêm mới] Rời phòng socket nếu không còn là thành viên
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

    // [Thêm mới] Đảm bảo tham gia lại các phòng khi socket reconnect
    const handleConnect = () => {
      console.log("ChatList: Socket đã kết nối, tham gia lại các phòng");
      joinedRoomsRef.current.forEach((conversationId) => {
        joinConversation(socket, conversationId);
        console.log(`ChatList: Tham gia lại phòng: ${conversationId}`);
      });
    };

    const cleanupLoad = loadAndListenConversations(socket, handleConversations);
    onConversationUpdate(socket, handleConversationUpdate);
    onChatInfoUpdated(socket, handleChatInfoUpdated); // Nhi thêm
    socket.on("newGroupConversation", handleNewGroupConversation); // Nhi thêm
    socket.on("userInConversation", handleUserInConversation); // Thêm listener cho userInConversation
    onConversationRemoved(socket, handleConversationRemoved); // Nhi thêm
    onGroupLeft(socket, handleGroupLeft); // Nhi thêm
    // [Thêm mới] Lắng nghe sự kiện connect để tham gia lại phòng
    socket.on("connect", handleConnect);

    return () => {
      console.log("ChatList: Dọn dẹp sự kiện socket"); // Nhi thêm
      cleanupLoad();
      offConversationUpdate(socket);
      offChatInfoUpdated(socket); // Nhi thêm
      socket.off("newGroupConversation", handleNewGroupConversation); // Nhi thêm
      socket.off("userInConversation", handleUserInConversation); // Gỡ bỏ listener
      offConversationRemoved(socket); // Nhi thêm
      offGroupLeft(socket); // Nhi thêm
      // [Thêm mới] Gỡ bỏ lắng nghe sự kiện connect
      socket.off("connect", handleConnect);
    };
  }, [socket, currentUserId, dispatch]);

  // Nhi thêm: Xử lý cập nhật thông tin nhóm từ Redux
  useEffect(() => {
    if (chatInfoUpdate) {
      console.log("ChatList: Nhận chatInfoUpdate từ Redux:", chatInfoUpdate);
      if (!chatInfoUpdate.participants.some((p) => p.userId === currentUserId)) {
        console.log(`ChatList: User ${currentUserId} không còn trong nhóm ${chatInfoUpdate._id}, xóa hội thoại`);
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== chatInfoUpdate._id)
        );
        dispatch(setSelectedMessage(null));
        // [Thêm mới] Rời phòng socket nếu không còn là thành viên
        if (joinedRoomsRef.current.has(chatInfoUpdate._id)) {
          socket.emit("leaveConversation", { conversationId: chatInfoUpdate._id });
          joinedRoomsRef.current.delete(chatInfoUpdate._id);
          console.log(`ChatList: Rời phòng ${chatInfoUpdate._id}`);
        }
        return;
      }

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
            console.log("ChatList: Cập nhật message từ(). Redux (chatInfoUpdate):", updatedMsg);
            return updatedMsg;
          }
          return msg;
        });
        return sortMessages(updatedMessages);
      });
    }
  }, [chatInfoUpdate, currentUserId, dispatch]);

  // Nhi thêm: Xử lý cập nhật tin nhắn cuối từ Redux
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

  console.log("ChatList: Render với danh sách message:", messages); // Nhi thêm


  return (
    <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
      {/* Thanh tìm kiếm */}
      <div className="p-2 bg-white shadow-md">
        <SearchCompo onGroupCreated={(groupData) => addNewGroup(groupData)} /> {/* Nhi thêm: Thêm onGroupCreated */}
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
        {/* Nhi thêm: Hiển thị thông báo khi socket chưa kết nối */}
        {!isSocketConnected ? (
          <div className="text-center text-gray-500 p-4">
            Đang kết nối tới server, vui lòng chờ...
          </div>
        ) : (
          activeTab === "/chat" && (
            <MessageList
              messages={[myCloudItem, ...messages]}
              onMessageClick={handleMessageClick}
              onPinConversation={handlePinConversation} // Nhi thêm
              userId={currentUserId}
              userCache={userCache} // Nhi thêm
            />
          )
        )}
        {activeTab === "/contact" && <SibarContact />}
      </div>
    </div>
  );
}

export default ChatList;