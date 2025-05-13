import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  clearSelectedMessage,
  setLastMessageUpdate,
  setChatInfoUpdate,
  setMessages,
} from "../../redux/slices/chatSlice";
import ChatHeader from "./ChatWindow/ChatHeader";
import MessageItem from "./ChatWindow/MessageItem";
import ChatFooter from "./ChatWindow/ChatFooter";
import TingTingImage from "../../assets/TingTing_Chat.png";
import ChatHeaderCloud from "./ChatWindow/ChatHeaderCloud";
import ChatFooterCloud from "./ChatWindow/ChatFooterCloud";
import ChatInfo from "../../layouts/components/chatwindow/ChatInfo";
import ChatInfoCloud from "./ChatCloud/ChatInfoCloud";
import ShareModal from "../../components/chat/ShareModal";
import ConfirmModal from "../../components/ConfirmModal";
import { useSocket } from "../../contexts/SocketContext";
import { useCloudSocket } from "../../contexts/CloudSocketContext";
import { Api_Profile } from "../../../apis/api_profile";
import { toast } from "react-toastify";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { onChatInfoUpdated, offChatInfoUpdated } from "../../services/sockets/events/chatInfo";

function ChatPage() {
  const [isChatInfoVisible, setIsChatInfoVisible] = useState(false);
  const [cloudMessages, setCloudMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    message: null,
    fileIndex: null,
  });
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatDetails, setChatDetails] = useState({
    name: "Unknown",
    avatar: "https://picsum.photos/200",
    members: 0,
    lastActive: 6,
  });
  const [replyingTo, setReplyingTo] = useState(null);

  const { socket, userId: currentUserId } = useSocket();
  const socketCloud = useCloudSocket();
  const messagesEndRef = useRef(null);
  const cloudChatContainerRef = useRef(null);
  const joinedRoomRef = useRef(null);
  const dispatch = useDispatch();

  // Lấy trạng thái từ Redux
  const messages = useSelector((state) => state.chat.messages);
  const selectedMessage = useSelector((state) => state.chat.selectedMessage);
  const selectedMessageId = selectedMessage?.id;
  const currUserId = localStorage.getItem("userId");

  console.log("ChatPage: Current socket", { socket, socketCloud, currUserId }); // Nhi thêm

  const receiverId = selectedMessage?.participants?.find(
    (p) => p.userId !== currentUserId
  )?.userId;

  const cloudChat = {
    id: "my-cloud",
    name: "Cloud của tôi",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
    type: "cloud",
    messages: cloudMessages,
  };

  const conversationId = selectedMessageId;

  // Lấy thông tin người dùng từ API hoặc cache
  const fetchUserInfo = async (userId) => {
    if (userCache[userId]) {
      console.log("ChatPage: Lấy thông tin người dùng từ cache", { userId, userInfo: userCache[userId] }); // Nhi thêm
      return userCache[userId];
    }

    try {
      const response = await Api_Profile.getProfile(userId);
      if (response?.data?.user) {
        const userInfo = {
          name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
          avatar: response.data.user.avatar || "https://picsum.photos/200",
        };
        console.log("ChatPage: Nhận thông tin người dùng từ API", { userId, userInfo }); // Nhi thêm
        setUserCache((prev) => ({ ...prev, [userId]: userInfo }));
        return userInfo;
      }
    } catch (error) {
      console.error("ChatPage: Lỗi khi lấy thông tin người dùng", { userId, error }); // Nhi thêm
      return { name: "Unknown", avatar: "https://picsum.photos/200" };
    }
  };

  // Tải thông tin người dùng khi danh sách tin nhắn thay đổi
  useEffect(() => {
    const loadUserInfos = async () => {
      const userIds = [
        ...new Set(
          messages.map((msg) => msg.userId).filter((id) => id !== currentUserId)
        ),
      ];
      console.log("ChatPage: Tải thông tin người dùng", { userIds }); // Nhi thêm
      for (const userId of userIds) {
        await fetchUserInfo(userId);
      }
    };

    if (messages.length > 0) {
      loadUserInfos();
    }
  }, [messages, currentUserId]);

  // Cập nhật thông tin chi tiết cuộc trò chuyện
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!selectedMessage || !currentUserId) {
        console.warn("ChatPage: Thiếu selectedMessage hoặc currentUserId", { selectedMessage, currentUserId }); // Nhi thêm
        return;
      }

      let name = "Unknown";
      let avatar = "https://picsum.photos/200";
      let members = 0;
      let lastActive = 6;

      if (selectedMessage.isGroup && selectedMessage.name) {
        name = selectedMessage.name;
        avatar = selectedMessage.imageGroup || avatar;
        members = selectedMessage.participants?.length || 0;
      } else if (selectedMessage.participants) {
        const otherParticipant = selectedMessage.participants.find(
          (p) => p.userId !== currentUserId
        );
        if (otherParticipant?.userId) {
          const userInfo = await fetchUserInfo(otherParticipant.userId);
          name = userInfo.name;
          avatar = userInfo.avatar;
        }
      }

      console.log("ChatPage: Cập nhật chatDetails", { name, avatar, members, lastActive }); // Nhi thêm
      setChatDetails({ name, avatar, members, lastActive });
    };

    fetchChatDetails();
  }, [selectedMessage, currentUserId]);

  // Cuộn xuống cuối khi tin nhắn thay đổi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Xử lý socket events cho cloud chat
  useEffect(() => {
    if (!socketCloud || selectedMessageId !== "my-cloud") {
      console.warn("ChatPage: Không xử lý socket cho cloud", { socketCloud: !!socketCloud, selectedMessageId }); // Nhi thêm
      return;
    }

    console.log("ChatPage: Socket for cloud active", { currUserId }); // Nhi thêm

    socketCloud.on("newMessage", (newMessage) => {
      console.log("ChatPage: Nhận newMessage từ cloud", newMessage); // Nhi thêm
      if (!newMessage.userId) {
        console.warn("ChatPage: newMessage thiếu userId", newMessage); // Nhi thêm
        return;
      }
      if (newMessage.userId === currentUserId) {
        setCloudMessages((prevMessages) => {
          if (
            !prevMessages.some(
              (msg) => msg.messageId === newMessage.messageId
            )
          ) {
            console.log("ChatPage: Thêm newMessage vào cloudMessages", newMessage); // Nhi thêm
            const updatedMessages = [...prevMessages, newMessage].sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
            setShouldScrollToBottom(true);
            return updatedMessages;
          }
          console.log("ChatPage: Message đã tồn tại", newMessage.messageId); // Nhi thêm
          return prevMessages;
        });
      }
    });

    socketCloud.on("messageDeleted", ({ messageId }) => {
      console.log("ChatPage: Nhận messageDeleted từ cloud", { messageId }); // Nhi thêm
      setCloudMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.messageId !== messageId)
      );
    });

    socketCloud.on("error", (error) => {
      console.error("ChatPage: Socket error trong cloud", error); // Nhi thêm
    });

    socketCloud.on("connect", () => {
      console.log("ChatPage: Socket reconnected cho cloud"); // Nhi thêm
    });

    socketCloud.on("disconnect", () => {
      console.warn("ChatPage: Socket disconnected cho cloud"); // Nhi thêm
    });

    socketCloud.on("connect_error", (error) => {
      console.error("ChatPage: Socket connect_error trong cloud", error.message); // Nhi thêm
    });

    return () => {
      console.log("ChatPage: Gỡ socket listeners cho cloud"); // Nhi thêm
      socketCloud.off("newMessage");
      socketCloud.off("messageDeleted");
      socketCloud.off("error");
      socketCloud.off("connect");
      socketCloud.off("disconnect");
      socketCloud.off("connect_error");
    };
  }, [socketCloud, selectedMessageId, currentUserId]);

  // Xử lý socket events cho cuộc trò chuyện thông thường
  useEffect(() => {
    if (!socket || !selectedMessageId || selectedMessageId === "my-cloud") {
      console.warn("ChatPage: Không xử lý socket events", {
        socket: !!socket,
        selectedMessageId,
      }); // Nhi thêm
      return;
    }

    console.log("ChatPage: Tham gia phòng", { selectedMessageId }); // Nhi thêm
    if (joinedRoomRef.current !== selectedMessageId) {
      socket.emit("joinConversation", { conversationId: selectedMessageId });
      joinedRoomRef.current = selectedMessageId;
      socket.once("joinedConversation", ({ conversationId }) => {
        console.log("ChatPage: Đã tham gia phòng thành công", { conversationId }); // Nhi thêm
      });
    }

    socket.on("loadMessages", (data) => {
      console.log("ChatPage: Nhận loadMessages", data); // Nhi thêm
      dispatch(setMessages(data));
    });

    socket.on("receiveMessage", (newMessage) => {
      console.log("ChatPage: Nhận receiveMessage", newMessage); // Nhi thêm
      dispatch(setMessages([...messages, newMessage]));
      dispatch(
        setLastMessageUpdate({
          conversationId: newMessage.conversationId,
          lastMessage: newMessage,
        })
      );
    });

    socket.on("newMessage", (newMessage) => {
      console.log("ChatPage: Nhận newMessage", newMessage); // Nhi thêm
      const messageConversationId = newMessage.conversationId?._id
        ? newMessage.conversationId._id.toString()
        : newMessage.conversationId.toString();
      console.log("ChatPage: So sánh conversationId", {
        messageConversationId,
        selectedMessageId,
      }); // Nhi thêm

      if (messageConversationId === selectedMessageId) {
        dispatch(setMessages([...messages, newMessage]));
        dispatch(
          setLastMessageUpdate({
            conversationId: newMessage.conversationId,
            lastMessage: newMessage,
          })
        );
      }
    });

    socket.on("messageSent", (newMessage) => {
      console.log("ChatPage: Nhận messageSent", newMessage); // Nhi thêm
      dispatch(setMessages([...messages, newMessage]));
      dispatch(
        setLastMessageUpdate({
          conversationId: newMessage.conversationId,
          lastMessage: newMessage,
        })
      );
    });

    socket.on("messageDeleted", ({ messageId }) => {
      console.log("ChatPage: Nhận messageDeleted", { messageId }); // Nhi thêm
      dispatch(setMessages(messages.filter((msg) => msg._id !== messageId)));
    });

    socket.on("messageRevoked", ({ messageId }) => {
      console.log("ChatPage: Nhận messageRevoked", { messageId }); // Nhi thêm
      dispatch(
        setMessages(
          messages.map((msg) =>
            msg._id === messageId ? { ...msg, isRevoked: true } : msg
          )
        )
      );
    });

    socket.on("userTyping", async ({ userId, conversationId }) => {
      console.log("ChatPage: Nhận userTyping", { userId, conversationId }); // Nhi thêm
      if (conversationId === selectedMessageId && userId !== currentUserId) {
        const userInfo = await fetchUserInfo(userId);
        setTypingUsers((prev) => {
          if (!prev.some((user) => user.userId === userId)) {
            return [...prev, { userId, name: userInfo.name }];
          }
          return prev;
        });
      }
    });

    socket.on("userStopTyping", ({ userId, conversationId }) => {
      console.log("ChatPage: Nhận userStopTyping", { userId, conversationId }); // Nhi thêm
      if (conversationId === selectedMessageId) {
        setTypingUsers((prev) =>
          prev.filter((user) => user.userId !== userId)
        );
      }
    });

    socket.on("deleteAllChatHistory", ({ conversationId, deletedBy }) => {
      console.log("ChatPage: Nhận deleteAllChatHistory", { conversationId, deletedBy }); // Nhi thêm
      if (conversationId === selectedMessageId && deletedBy === currentUserId) {
        dispatch(setMessages([]));
        dispatch(clearSelectedMessage());
        toast.success("Toàn bộ lịch sử trò chuyện đã được xóa!");
        console.log("ChatPage: Xóa lịch sử và chuyển về trang chính", { userId: currentUserId }); // Nhi thêm
      } else if (conversationId === selectedMessageId) {
        dispatch(
          setMessages(
            messages.filter(
              (msg) => !msg.deletedBy?.includes(deletedBy)
            )
          )
        );
        console.log("ChatPage: Giữ nguyên tin nhắn cho người không xóa", { userId: currentUserId }); // Nhi thêm
      }
    });

    socket.on("conversationUpdated", ({ conversationId, lastMessage }) => {
      console.log("ChatPage: Nhận conversationUpdated", { conversationId, lastMessage }); // Nhi thêm
      if (conversationId === selectedMessageId) {
        dispatch(
          setLastMessageUpdate({ conversationId, lastMessage })
        );
      }
    });

    socket.on("error", (error) => {
      console.error("ChatPage: Socket error", error); // Nhi thêm
      toast.error(error.message || "Lỗi hệ thống.");
    });

    socket.on("connect", () => {
      console.log("ChatPage: Socket connected", { socketId: socket.id }); // Nhi thêm
      if (selectedMessageId && selectedMessageId !== "my-cloud" && joinedRoomRef.current !== selectedMessageId) {
        console.log("ChatPage: Tham gia lại phòng khi reconnect", selectedMessageId); // Nhi thêm
        socket.emit("joinConversation", { conversationId: selectedMessageId });
        joinedRoomRef.current = selectedMessageId;
      }
    });

    socket.on("disconnect", () => {
      console.warn("ChatPage: Socket disconnected"); // Nhi thêm
    });

    return () => {
      console.log("ChatPage: Gỡ socket events"); // Nhi thêm
      socket.off("loadMessages");
      socket.off("receiveMessage");
      socket.off("newMessage");
      socket.off("messageSent");
      socket.off("messageDeleted");
      socket.off("messageRevoked");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("deleteAllChatHistory");
      socket.off("conversationUpdated");
      socket.off("error");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("joinedConversation");
    };
  }, [socket, selectedMessageId, currentUserId, dispatch, messages]);

  // Xử lý sự kiện chatInfoUpdated
  useEffect(() => {
    if (!socket || !selectedMessageId || selectedMessageId === "my-cloud") {
      console.warn("ChatPage: Không xử lý chatInfoUpdated", {
        socket: !!socket,
        selectedMessageId,
      }); // Nhi thêm
      return;
    }

    console.log("ChatPage: Đăng ký sự kiện chatInfoUpdated", { selectedMessageId }); // Nhi thêm

    const handleChatInfoUpdated = (updatedInfo) => {
      console.log("ChatPage: Nhận sự kiện chatInfoUpdated", updatedInfo); // Nhi thêm
      const infoId = updatedInfo._id || updatedInfo.conversationId;
      console.log("ChatPage: So sánh selectedMessageId", { selectedMessageId, infoId }); // Nhi thêm
      if (infoId === selectedMessageId) {
        setChatDetails((prev) => {
          const newDetails = {
            ...prev,
            name: updatedInfo.name || prev.name,
            avatar: updatedInfo.imageGroup || prev.avatar,
            members: updatedInfo.participants?.length || prev.members,
          };
          console.log("ChatPage: Cập nhật chatDetails với tên mới", newDetails); // Nhi thêm
          return newDetails;
        });
        dispatch(setChatInfoUpdate(updatedInfo));
      } else {
        console.warn("ChatPage: chatInfoUpdated không khớp với selectedMessageId", {
          selectedMessageId,
          infoId,
        }); // Nhi thêm
      }
    };

    onChatInfoUpdated(socket, handleChatInfoUpdated);

    return () => {
      console.log("ChatPage: Gỡ sự kiện chatInfoUpdated"); // Nhi thêm
      offChatInfoUpdated(socket);
    };
  }, [socket, selectedMessageId, dispatch]);

  // Cuộn xuống cuối cho cloud messages
  useLayoutEffect(() => {
    if (shouldScrollToBottom && cloudChatContainerRef.current) {
      console.log("ChatPage: Cuộn xuống cuối cloud messages", { length: cloudMessages.length }); // Nhi thêm
      cloudChatContainerRef.current.scrollTop = cloudChatContainerRef.current.scrollHeight;
      setShouldScrollToBottom(false);
    }
  }, [cloudMessages, shouldScrollToBottom]);

  // Tải tin nhắn cloud
  useEffect(() => {
    if (selectedMessageId === "my-cloud") {
      console.log("ChatPage: Tải cloud messages"); // Nhi thêm
      const fetchCloudMessages = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `http://localhost:3000/api/messages/user/${currUserId}`
          );
          const sortedMessages = response.data.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          console.log("ChatPage: Nhận cloud messages", sortedMessages); // Nhi thêm
          setCloudMessages(sortedMessages);
          setShouldScrollToBottom(true);
        } catch (error) {
          console.error("ChatPage: Lỗi khi tải tin nhắn cloud", error); // Nhi thêm
        } finally {
          setLoading(false);
        }
      };
      fetchCloudMessages();
    }
  }, [selectedMessageId, currUserId]);

  // Đóng context menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = () => {
      console.log("ChatPage: Đóng context menu do click outside"); // Nhi thêm
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Memoized selectedChat
  const selectedChat = useMemo(
    () =>
      selectedMessage
        ? {
            id: selectedMessageId,
            name: chatDetails.name,
            avatar: chatDetails.avatar,
            type: selectedMessage.type || "personal",
          }
        : null,
    [selectedMessage, selectedMessageId, chatDetails.name, chatDetails.avatar]
  );

  // Gửi tin nhắn
  const sendMessage = (message) => {
    if (socket && selectedMessageId && selectedMessageId !== "my-cloud") {
      const payload = {
        conversationId: selectedMessageId,
        message: {
          content: message.content,
          messageType: message.messageType,
          ...(message.linkURL && { linkURL: message.linkURL }),
          ...(message.replyMessageId && {
            replyMessageId: message.replyMessageId,
          }),
        },
      };
      console.log("ChatPage: Gửi sendMessage", payload); // Nhi thêm
      socket.emit("sendMessage", payload);
    } else {
      console.error("ChatPage: Không thể gửi tin nhắn", { socket, selectedMessageId }); // Nhi thêm
    }
  };

  // Xử lý trả lời tin nhắn
  const handleReply = (msg) => {
    console.log("ChatPage: Trả lời tin nhắn", msg); // Nhi thêm
    setReplyingTo(msg);
  };

  // Xử lý chuyển tiếp tin nhắn
  const handleForward = (msg) => {
    console.log("ChatPage: Chuyển tiếp tin nhắn", msg); // Nhi thêm
    setMessageToForward(msg);
    setIsShareModalVisible(true);
  };

  // Xử lý đóng modal chia sẻ
  const handleCloseShareModal = () => {
    console.log("ChatPage: Đóng ShareModal"); // Nhi thêm
    setIsShareModalVisible(false);
    setMessageToForward(null);
  };

  // Xử lý chia sẻ tin nhắn
  const handleShare = (selectedConversations, messageContent) => {
    console.log("ChatPage: Chia sẻ tin nhắn", { selectedConversations, messageContent, messageToForward }); // Nhi thêm
    handleCloseShareModal();
  };

  // Xử lý xóa tin nhắn
  const handleDelete = (msg) => {
    const confirmDelete = () => {
      console.log("ChatPage: Xóa tin nhắn", { messageId: msg._id }); // Nhi thêm
      socket.emit("messageDeleted", { messageId: msg._id });
      dispatch(setMessages(messages.filter((message) => message._id !== msg._id)));
    };

    return (
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={confirmDelete}
        title="Xóa tin nhắn"
        message="Bạn có chắc muốn xóa tin nhắn này? Nếu muốn xóa cả hai bên thì hãy nhấn vào nút thu hồi."
      />
    );
  };

  // Xử lý thu hồi tin nhắn
  const handleRevoke = (msg) => {
    const confirmRevoke = () => {
      console.log("ChatPage: Thu hồi tin nhắn", { messageId: msg._id }); // Nhi thêm
      socket.emit("messageRevoked", { messageId: msg._id });
      dispatch(
        setMessages(
          messages.map((message) =>
            message._id === msg._id ? { ...message, isRevoked: true } : message
          )
        )
      );
    };

    return (
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={confirmRevoke}
        title="Thu hồi tin nhắn"
        message="Bạn có chắc muốn thu hồi tin nhắn này?"
      />
    );
  };

  // Format thời gian
  const formatTime = (createdAt) => {
    return new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: vi });
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: vi });
  };

  // Context menu cho cloud messages
  const ContextMenu = ({ x, y, message, fileIndex, onClose }) => {
    const isFile = fileIndex !== null;
    const fileUrl = isFile ? message.fileUrls[fileIndex] : null;
    const isImage = isFile && /\.(jpg|jpeg|png|gif)$/i.test(fileUrl);

    const handleCopyText = () => {
      if (message.content) {
        console.log("ChatPage: Sao chép nội dung tin nhắn", message.content); // Nhi thêm
        navigator.clipboard.writeText(message.content);
      }
      onClose();
    };

    const handleCopyImage = () => {
      if (fileUrl) {
        console.log("ChatPage: Sao chép URL hình ảnh", fileUrl); // Nhi thêm
        navigator.clipboard.writeText(fileUrl);
      }
      onClose();
    };

    const handleDelete = async () => {
      console.log("ChatPage: Xóa tin nhắn cloud", { messageId: message.messageId }); // Nhi thêm
      try {
        await axios.delete(`http://localhost:3000/api/messages/${message.messageId}`);
      } catch (error) {
        console.error("ChatPage: Lỗi khi xóa tin nhắn cloud", error); // Nhi thêm
      }
      onClose();
    };

    const handleDownload = () => {
      if (fileUrl) {
        console.log("ChatPage: Tải xuống file", { fileUrl }); // Nhi thêm
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download =
          message.filenames?.[fileIndex] || fileUrl.split("/").pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      onClose();
    };

    return (
      <div
        className="fixed bg-white shadow-lg rounded-md py-2 z-50"
        style={{ top: y, left: x }}
      >
        {!isFile && message.content && (
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={handleCopyText}
          >
            Sao Chép
          </button>
        )}
        {!isFile && (
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={handleDelete}
          >
            Xóa
          </button>
        )}
        {isFile && !isImage && (
          <>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={handleDownload}
            >
              Tải xuống
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={handleDelete}
            >
              Xóa
            </button>
          </>
        )}
        {isFile && isImage && (
          <>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={handleCopyImage}
            >
              Sao Chép
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={handleDownload}
            >
              Tải xuống
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={handleDelete}
            >
              Xóa
            </button>
          </>
        )}
      </div>
    );
  };

  // Render tin nhắn cloud
  const renderCloudMessage = (message) => {
    const handleContextMenu = (e, fileIndex = null) => {
      e.preventDefault();
      console.log("ChatPage: Mở context menu cho cloud message", { messageId: message.messageId, fileIndex }); // Nhi thêm
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        message,
        fileIndex,
      });
    };

    return (
      <div
        className="flex justify-end mb-4"
        onContextMenu={(e) => handleContextMenu(e)}
      >
        <div className="bg-blue-100 p-3 rounded-lg max-w-md relative min-w-64">
          {message.content && (
            <p className="text-sm text-gray-800 mb-4">{message.content}</p>
          )}
          {message.fileUrls?.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.fileUrls.map((url, index) => {
                const filename =
                  message.filenames?.[index] || url.split("/").pop() || "File";
                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(url);
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-2"
                    onContextMenu={(e) => handleContextMenu(e, index)}
                  >
                    {isImage ? (
                      <div className="flex items-center space-x-2">
                        <img
                          src={message.thumbnailUrls?.[index] || url}
                          alt={filename}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{filename}</p>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 text-xs"
                          >
                            Đã có trên Cloud
                          </a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-200 p-1 rounded">
                          <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{filename}</p>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 text-xs"
                          >
                            Đã có trên Cloud
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <span className="text-xs text-gray-500 absolute right-2 bottom-2">
            {formatDate(message.timestamp)}
          </span>
        </div>
      </div>
    );
  };

  console.log("ChatPage: Render với", { selectedChat, chatDetails, messages, cloudMessages }); // Nhi thêm

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {selectedChat ? (
        <div className={`flex w-full transition-all duration-300`}>
          <div
            className={`flex flex-col h-screen transition-all duration-300 ${
              isChatInfoVisible ? "w-[calc(100%-400px)]" : "w-full"
            }`}
          >
            {selectedChat.type === "cloud" ? (
              <ChatHeaderCloud
                name={cloudChat.name}
                avatar={cloudChat.avatar}
                isChatInfoVisible={isChatInfoVisible}
                setIsChatInfoVisible={setIsChatInfoVisible}
              />
            ) : (
              <ChatHeader
                type={chatDetails.type}
                name={chatDetails.name}
                avatar={chatDetails.avatar}
                members={chatDetails.members}
                lastActive={chatDetails.lastActive}
                isChatInfoVisible={isChatInfoVisible}
                setIsChatInfoVisible={setIsChatInfoVisible}
                conversationId={selectedMessageId}
                userId={currUserId}
                receiverId={receiverId}
              />
            )}
            {selectedChat.type === "cloud" ? (
              <>
                <div
                  ref={cloudChatContainerRef}
                  className="p-4 h-[calc(100vh-200px)] overflow-y-auto"
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <p>Đang tải tin nhắn từ Cloud...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cloudMessages.map((message, index) => {
                        const currentDate = formatDateSeparator(
                          message.timestamp
                        );
                        const prevMessage =
                          index > 0 ? cloudMessages[index - 1] : null;
                        const prevDate = prevMessage
                          ? formatDateSeparator(prevMessage.timestamp)
                          : null;
                        const showDateSeparator =
                          index === 0 || currentDate !== prevDate;

                        return (
                          <React.Fragment key={message.messageId || index}>
                            {showDateSeparator && (
                              <div className="flex justify-center my-4">
                                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                  {currentDate}
                                </span>
                              </div>
                            )}
                            {renderCloudMessage(message)}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
                <ChatFooterCloud
                  onReload={() => setCloudMessages([])}
                  className="fixed bottom-0 left-0 w-full bg-white shadow-md"
                />
              </>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length > 0 ? (
                    messages
                      .filter(
                        (msg) =>
                          msg.conversationId === selectedMessageId &&
                          !msg.deletedBy?.includes(currentUserId)
                      )
                      .map((msg) => (
                        <MessageItem
                          key={msg._id}
                          msg={{
                            ...msg,
                            sender:
                              msg.userId === currentUserId
                                ? "Bạn"
                                : userCache[msg.userId]?.name || "Unknown",
                            time: formatTime(msg.createdAt),
                            messageType: msg.messageType || "text",
                            content: msg.content || "",
                            linkURL: msg.linkURL || "",
                            userId: msg.userId,
                          }}
                          currentUserId={currentUserId}
                          onReply={handleReply}
                          onForward={handleForward}
                          onRevoke={handleRevoke}
                          onDelete={handleDelete}
                          messages={messages}
                        />
                      ))
                  ) : (
                    <div></div> // Nhi thêm
                  )}
                  <div ref={messagesEndRef} />
                </div>
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500 text-xs italic flex items-center gap-1">
                      {typingUsers.map((user) => user.name).join(", ")} đang gõ...
                    </span>
                    <img
                      src="/public/typingv1.gif"
                      alt="typing..."
                      className="w-6 h-5"
                    />
                  </div>
                )}
                <ChatFooter
                  className="fixed bottom-0 left-0 w-full bg-white shadow-md"
                  sendMessage={sendMessage}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  conversationId={selectedMessageId}
                />
              </>
            )}
          </div>
          {isChatInfoVisible && (
            <div className="w-[400px] bg-white border-l p-2 max-h-screen transition-all duration-300">
              {selectedChat.type === "cloud" ? (
                <ChatInfoCloud
                  userId={currentUserId}
                  conversationId={conversationId}
                  cloudMessages={cloudMessages}
                />
              ) : (
                <ChatInfo
                  userId={currentUserId}
                  conversationId={conversationId}
                  socket={socket}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-white">
          <h1 className="text-2xl font-bold">Chào mừng đến với TingTing PC!</h1>
          <p className="text-gray-500 text-center mt-2 px-4">
            Khám phá các tiện ích hỗ trợ làm việc và trò chuyện cùng người thân,
            bạn bè.
          </p>
          <img
            src={TingTingImage}
            alt="Welcome"
            className="mt-4 w-64 h-auto rounded-lg"
          />
        </div>
      )}
      {isShareModalVisible && (
        <ShareModal
          isOpen={isShareModalVisible}
          onClose={handleCloseShareModal}
          onShare={handleShare}
          messageToForward={messageToForward}
          userId={currentUserId}
          messageId={messageToForward?._id}
        />
      )}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          fileIndex={contextMenu.fileIndex}
          onClose={() =>
            setContextMenu((prev) => ({ ...prev, visible: false }))
          }
        />
      )}
    </div>
  );
}

export default ChatPage;