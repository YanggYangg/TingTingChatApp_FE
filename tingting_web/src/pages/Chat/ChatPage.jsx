import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoClose } from "react-icons/io5";
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
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { toast } from "react-toastify";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { onChatInfoUpdated, offChatInfoUpdated } from "../../services/sockets/events/chatInfo";
import {
  getChatMedia,
  getChatFiles,
  getChatLinks,
} from "../../services/sockets/events/chatInfo";

import ChatHeaderChatGPT from './ChatWindow/ChatHeaderChatGPT';
import ChatFooterChatGPT from './ChatWindow/ChatFooterChatGPT';
import MessageItemChatGPT from './ChatWindow/MessageItemChatGPT';
import { Api_ChatGPT } from '../../../apis/api_chatgpt';
import {
  setMessages as setChatGPTMessages,
  addMessage as addChatGPTMessage,
  clearMessages as clearChatGPTMessages
} from "../../redux/slices/chatGPTSlice";

function ChatPage() {
  const [isChatInfoVisible, setIsChatInfoVisible] = useState(false);
  const [cloudMessages, setCloudMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
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
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isRevokeModalVisible, setIsRevokeModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [messageToRevoke, setMessageToRevoke] = useState(null);

  const { socket, userId: currentUserId } = useSocket();
  const socketCloud = useCloudSocket();
  const messagesEndRef = useRef(null);
  const cloudChatContainerRef = useRef(null);
  const joinedRoomRef = useRef(null);
  const dispatch = useDispatch();

  const messages = useSelector((state) => state.chat.messages);
  const selectedMessage = useSelector((state) => state.chat.selectedMessage);
  const selectedMessageId = selectedMessage?.id;
  const currUserId = localStorage.getItem("userId");


  // Thêm state tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  // Thêm các state mới vào đầu component ChatPage
  const [filterSender, setFilterSender] = useState("all"); // Mặc định là "all" để không lọc theo người gửi
  const [filterStartDate, setFilterStartDate] = useState(""); // Ngày bắt đầu
  const [filterEndDate, setFilterEndDate] = useState(""); // Ngày kết thúc
  const [senders, setSenders] = useState([]); // Danh sách người gửi
  const [highlightedMessageId, setHighlightedMessageId] = useState(null); 
  const messagesContainerRef = useRef(null);

  const chatGPTMessages = useSelector((state) => state.chatGPT.messages);

  console.log("ChatPage: Current socket", { socket, socketCloud, currUserId });

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

const fetchUserInfo = async (userId) => {
  if (userCache[userId]) {
    console.log("ChatPage: Lấy thông tin người dùng từ cache", { userId, userInfo: userCache[userId] });
    return userCache[userId];
  }

  try {
    const response = await Api_Profile.getProfile(userId);
    if (response?.data?.user) {
      const userInfo = {
        name: `${response.data.user.firstname || ''} ${response.data.user.surname || ''}`.trim() || `Người dùng ${userId.slice(-4)}`,
        avatar: response.data.user.avatar || "https://picsum.photos/200",
      };
      console.log("ChatPage: Nhận thông tin người dùng từ API", { userId, userInfo });
      setUserCache((prev) => ({ ...prev, [userId]: userInfo }));
      return userInfo;
    }
  } catch (error) {
    console.error("ChatPage: Lỗi khi lấy thông tin người dùng", { userId, error });
    return { name: `Người dùng ${userId.slice(-4)}`, avatar: "https://picsum.photos/200" };
  }
};

  useEffect(() => {
  const loadUserInfos = async () => {
    const userIds = [
      ...new Set(
        messages.map((msg) => msg.userId).filter((id) => id !== currentUserId)
      ),
    ];
    console.log("ChatPage: Tải thông tin người dùng", { userIds });
    for (const userId of userIds) {
      await fetchUserInfo(userId);
    }
    if (selectedMessage?.participants) {
      const participantIds = selectedMessage.participants
        .map((p) => p.userId)
        .filter((id) => id !== currentUserId && !userCache[id]);
      for (const userId of participantIds) {
        await fetchUserInfo(userId);
      }
    }
  };

  if (messages.length > 0 || selectedMessage?.participants) {
    loadUserInfos();
  }
}, [messages, selectedMessage, currentUserId, userCache]);

  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!selectedMessage || !currentUserId) {
        console.warn("ChatPage: Thiếu selectedMessage hoặc currentUserId", { selectedMessage, currentUserId });
        return;
      }

      let name = selectedMessage.name || "Unknown"; // Ưu tiên selectedMessage.name
      let avatar = selectedMessage.imageGroup || "https://picsum.photos/200";
      let members = 0;
      let lastActive = 6;

      if (selectedMessage.isGroup) {
        // Đối với nhóm, sử dụng selectedMessage.name nếu có
        name = selectedMessage.name || "Nhóm không tên";
        avatar = selectedMessage.imageGroup || avatar;
        members = selectedMessage.participants?.length || 0;
      } else if (selectedMessage.participants && (!name || name === "Unknown")) {
        // Đối với cuộc trò chuyện 1:1, chỉ gọi fetchUserInfo nếu name không hợp lệ
        const otherParticipant = selectedMessage.participants.find(
          (p) => p.userId !== currentUserId
        );
        if (otherParticipant?.userId) {
          const userInfo = await fetchUserInfo(otherParticipant.userId);
          name = userInfo.name || `Người dùng ${otherParticipant.userId.slice(-4)}`;
          avatar = userInfo.avatar || avatar;
        }
      }

      console.log("ChatPage: Cập nhật chatDetails", { name, avatar, members, lastActive });
      setChatDetails({ name, avatar, members, lastActive });
    };

    fetchChatDetails();
  }, [selectedMessage, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socketCloud || selectedMessageId !== "my-cloud") {
      console.warn("ChatPage: Không xử lý socket cho cloud", { socketCloud: !!socketCloud, selectedMessageId });
      return;
    }

    console.log("ChatPage: Socket for cloud active", { currUserId });

    socketCloud.on("newMessage", (newMessage) => {
      console.log("ChatPage: Nhận newMessage từ cloud", newMessage);
      if (!newMessage.userId) {
        console.warn("ChatPage: newMessage thiếu userId", newMessage);
        return;
      }
      if (newMessage.userId === currentUserId) {
        setCloudMessages((prevMessages) => {
          if (
            !prevMessages.some(
              (msg) => msg.messageId === newMessage.messageId
            )
          ) {
            console.log("ChatPage: Thêm newMessage vào cloudMessages", newMessage);
            const updatedMessages = [...prevMessages, newMessage].sort(
              (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
            );
            setShouldScrollToBottom(true);
            return updatedMessages;
          }
          console.log("ChatPage: Message đã tồn tại", newMessage.messageId);
          return prevMessages;
        });
      }
    });

    socketCloud.on("messageDeleted", ({ messageId }) => {
      console.log("ChatPage: Nhận messageDeleted từ cloud", { messageId });
      setCloudMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.messageId !== messageId)
      );
    });

    socketCloud.on("error", (error) => {
      console.error("ChatPage: Socket error trong cloud", error);
    });

    socketCloud.on("connect", () => {
      console.log("ChatPage: Socket reconnected cho cloud");
    });

    socketCloud.on("disconnect", () => {
      console.warn("ChatPage: Socket disconnected cho cloud");
    });

    socketCloud.on("connect_error", (error) => {
      console.error("ChatPage: Socket connect_error trong cloud", error.message);
    });

    return () => {
      console.log("ChatPage: Gỡ socket listeners cho cloud");
      socketCloud.off("newMessage");
      socketCloud.off("messageDeleted");
      socketCloud.off("error");
      socketCloud.off("connect");
      socketCloud.off("disconnect");
      socketCloud.off("connect_error");
    };
  }, [socketCloud, selectedMessageId, currentUserId]);

  useEffect(() => {
    if (!socket || !selectedMessageId || selectedMessageId === "my-cloud") {
      console.warn("ChatPage: Không xử lý socket events", {
        socket: !!socket,
        selectedMessageId,
      });
      return;
    }

    console.log("ChatPage: Tham gia phòng", { selectedMessageId });
    if (joinedRoomRef.current !== selectedMessageId) {
      socket.emit("joinConversation", { conversationId: selectedMessageId });
      joinedRoomRef.current = selectedMessageId;
      socket.once("joinedConversation", ({ conversationId }) => {
        console.log("ChatPage: Đã tham gia phòng thành công", { conversationId });
      });
    }

    socket.on("loadMessages", (data) => {
      console.log("ChatPage: Nhận loadMessages", data);
      dispatch(setMessages(data));
    });

    socket.on("receiveMessage", (newMessage) => {
      console.log("ChatPage: Nhận receiveMessage", newMessage);
      dispatch(setMessages([...messages, newMessage]));
      dispatch(
        setLastMessageUpdate({
          conversationId: newMessage.conversationId,
          lastMessage: newMessage,
        })
      );
    });

    socket.on("newMessage", (newMessage) => {
      console.log("ChatPage: Nhận newMessage", newMessage);
      const messageConversationId = newMessage.conversationId?._id
        ? newMessage.conversationId._id.toString()
        : newMessage.conversationId.toString();
      console.log("ChatPage: So sánh conversationId", {
        messageConversationId,
        selectedMessageId,
      });

      if (messageConversationId === selectedMessageId) {
        dispatch(setMessages([...messages, newMessage]));
        dispatch(
          setLastMessageUpdate({
            conversationId: newMessage.conversationId,
            lastMessage: newMessage,
          })
        );
        // Cập nhật chatInfo khi nhận tin nhắn mới
        if (newMessage.messageType === "image" || newMessage.messageType === "video") {
          console.log("ChatPage: Cập nhật media trong chatInfo");
          getChatMedia(socket, { conversationId: selectedMessageId });
        } else if (newMessage.messageType === "file") {
          console.log("ChatPage: Cập nhật file trong chatInfo");
          getChatFiles(socket, { conversationId: selectedMessageId });
        } else if (newMessage.messageType === "link") {
          console.log("ChatPage: Cập nhật link trong chatInfo");
          getChatLinks(socket, { conversationId: selectedMessageId });
        }
      }
    });

    socket.on("messageSent", (newMessage) => {
      console.log("ChatPage: Nhận messageSent", newMessage);
      dispatch(setMessages([...messages, newMessage]));
      dispatch(
        setLastMessageUpdate({
          conversationId: newMessage.conversationId,
          lastMessage: newMessage,
        })
      );
    });

  socket.on("messageDeleted", ({ messageId, urlIndex, isMessageDeleted, deletedBy }) => {
  console.log("ChatPage: Nhận messageDeleted", { messageId, urlIndex, isMessageDeleted, deletedBy });

  // Cập nhật danh sách tin nhắn trong Redux
  dispatch(setMessages(
    messages
      .map((msg) => {
        if (msg._id === messageId) {
          if (isMessageDeleted) {
            // Thêm userId vào deletedBy nếu tin nhắn bị xóa hoàn toàn
            return {
              ...msg,
              deletedBy: [...(msg.deletedBy || []), deletedBy]
            };
          } else if (urlIndex !== null && Array.isArray(msg.linkURL)) {
            // Xóa URL cụ thể nếu chỉ xóa một link
            const updatedLinkURL = [...msg.linkURL];
            updatedLinkURL.splice(urlIndex, 1);
            return {
              ...msg,
              linkURL: updatedLinkURL
            };
          }
        }
        return msg;
      })
      // Lọc bỏ tin nhắn nếu deletedBy chứa currentUserId
      .filter((msg) => !msg.deletedBy?.includes(currentUserId))
  ));

  // Kích hoạt cập nhật ChatInfo dựa trên loại tin nhắn
  const deletedMessage = messages.find((msg) => msg._id === messageId);
  if (deletedMessage) {
    if (deletedMessage.messageType === "image" || deletedMessage.messageType === "video") {
      console.log("ChatPage: Yêu cầu cập nhật media trong ChatInfo");
      getChatMedia(socket, { conversationId: selectedMessageId });
    } else if (deletedMessage.messageType === "file") {
      console.log("ChatPage: Yêu cầu cập nhật file trong ChatInfo");
      getChatFiles(socket, { conversationId: selectedMessageId });
    } else if (deletedMessage.messageType === "link") {
      console.log("ChatPage: Yêu cầu cập nhật link trong ChatInfo");
      getChatLinks(socket, { conversationId: selectedMessageId });
    }
  }
});


    socket.on("messageRevoked", ({ messageId }) => {
      console.log("ChatPage: Nhận messageRevoked", { messageId });
      dispatch(
        setMessages(
          messages.map((msg) =>
            msg._id === messageId ? { ...msg, isRevoked: true } : msg
          )
        )
      );
    });

    socket.on("userTyping", async ({ userId, conversationId }) => {
      console.log("ChatPage: Nhận userTyping", { userId, conversationId });
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
      console.log("ChatPage: Nhận userStopTyping", { userId, conversationId });
      if (conversationId === selectedMessageId) {
        setTypingUsers((prev) =>
          prev.filter((user) => user.userId !== userId)
        );
      }
    });

    socket.on("deleteAllChatHistory", ({ conversationId, deletedBy }) => {
      if (conversationId === selectedMessageId) {
        if (deletedBy === currentUserId) {
          dispatch(setMessages([]));
          dispatch(clearSelectedMessage());
          setChatDetails((prev) => ({
            ...prev,
            lastMessage: null,
          }));
          toast.success("Toàn bộ lịch sử trò chuyện đã được xóa!");
        } else {
          dispatch(setMessages(messages.filter((msg) => !msg.deletedBy?.includes(deletedBy))));
          setChatDetails((prev) => ({
            ...prev,
            lastMessage: null,
          }));
        }
      }
    });

    socket.on("conversationUpdated", ({ conversationId, lastMessage, updatedAt }) => {
      console.log("ChatPage: Nhận conversationUpdated", { conversationId, lastMessage });
      if (conversationId === selectedMessageId) {
        dispatch(setLastMessageUpdate({ conversationId, lastMessage }));
        if (!lastMessage) {
          dispatch(setMessages([])); // Xóa toàn bộ tin nhắn nếu lastMessage là null
          dispatch(setChatInfoUpdate({
            ...chatInfo,
            lastMessage: null,
            media: [],
            files: [],
            links: [],
          }));
          toast.info("Lịch sử trò chuyện đã được xóa!");
        }
      }
    });

    socket.on("error", (error) => {
      console.error("ChatPage: Socket error", error);
      // toast.error(error.message || "Lỗi hệ thống.");
    });

    socket.on("connect", () => {
      console.log("ChatPage: Socket connected", { socketId: socket.id });
      if (selectedMessageId && selectedMessageId !== "my-cloud" && joinedRoomRef.current !== selectedMessageId) {
        console.log("ChatPage: Tham gia lại phòng khi reconnect", selectedMessageId);
        socket.emit("joinConversation", { conversationId: selectedMessageId });
        joinedRoomRef.current = selectedMessageId;
      }
    });

    socket.on("disconnect", () => {
      console.warn("ChatPage: Socket disconnected");
    });

    return () => {
      console.log("ChatPage: Gỡ socket events");
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
      socket.off("joinedConversation"); // Nhi thêm
    };
  }, [socket, selectedMessageId, currentUserId, dispatch, messages]);

  useEffect(() => {
    if (!socket || !selectedMessageId || selectedMessageId === "my-cloud") {
      console.warn("ChatPage: Không xử lý chatInfoUpdated", {
        socket: !!socket,
        selectedMessageId,
      });
      return;
    }

    console.log("ChatPage: Đăng ký sự kiện chatInfoUpdated", { selectedMessageId });

    const handleChatInfoUpdated = (updatedInfo) => {
      console.log("ChatPage: Nhận sự kiện chatInfoUpdated", updatedInfo);
      const infoId = updatedInfo._id || updatedInfo.conversationId;
      console.log("ChatPage: So sánh selectedMessageId", { selectedMessageId, infoId });
      if (infoId === selectedMessageId) {
        setChatDetails((prev) => {
          const newDetails = {
            ...prev,
            name: updatedInfo.name || prev.name,
            avatar: updatedInfo.imageGroup || prev.avatar,
            members: updatedInfo.participants?.length || prev.members,
          };
          console.log("ChatPage: Cập nhật chatDetails với tên mới", newDetails);
          return newDetails;
        });
        dispatch(setChatInfoUpdate(updatedInfo));
      } else {
        console.warn("ChatPage: chatInfoUpdated không khớp với selectedMessageId", {
          selectedMessageId,
          infoId,
        });
      }
    };

    onChatInfoUpdated(socket, handleChatInfoUpdated);

    return () => {
      console.log("ChatPage: Gỡ sự kiện chatInfoUpdated");
      offChatInfoUpdated(socket);
    };
  }, [socket, selectedMessageId, dispatch]);

  useLayoutEffect(() => {
    if (shouldScrollToBottom && cloudChatContainerRef.current) {
      console.log("ChatPage: Cuộn xuống cuối cloud messages", { length: cloudMessages.length });
      cloudChatContainerRef.current.scrollTop = cloudChatContainerRef.current.scrollHeight;
      setShouldScrollToBottom(false);
    }
  }, [cloudMessages, shouldScrollToBottom]);

  useEffect(() => {
    if (selectedMessageId === "my-cloud") {
      console.log("ChatPage: Tải cloud messages");
      const fetchCloudMessages = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `http://184.73.0.29:3000/api/messages/user/${currUserId}`
          );
          const sortedMessages = response.data.sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );
          console.log("ChatPage: Nhận cloud messages", sortedMessages);
          setCloudMessages(sortedMessages);
          setShouldScrollToBottom(true);
        } catch (error) {
          console.error("ChatPage: Lỗi khi tải tin nhắn cloud", error);
        } finally {
          setLoading(false);
        }
      };
      fetchCloudMessages();
    }
  }, [selectedMessageId, currUserId]);

  useEffect(() => {
    const handleClickOutside = () => {
      console.log("ChatPage: Đóng context menu do click outside");
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

const selectedChat = useMemo(
  () =>
    selectedMessage
      ? {
          id: selectedMessageId,
          name: selectedMessageId === 'chatgpt' ? 'ChatGPT Assistant' : chatDetails.name,
          avatar: selectedMessageId === 'chatgpt' ? 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' : chatDetails.avatar,
          type: selectedMessageId === 'chatgpt' ? 'chatgpt' : (selectedMessage.type || 'personal'),
        }
      : null,
  [selectedMessage, selectedMessageId, chatDetails.name, chatDetails.avatar]
);

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
      console.log("ChatPage: Gửi sendMessage", payload);
      socket.emit("sendMessage", payload, (response) => {
        if (response && response.success) {
          console.log("ChatPage: Gửi tin nhắn thành công", response.data);
          // Cập nhật chatInfo dựa trên loại tin nhắn
          if (message.messageType === "image" || message.messageType === "video") {
            console.log("ChatPage: Gửi yêu cầu cập nhật media trong chatInfo");
            getChatMedia(socket, { conversationId: selectedMessageId });
          } else if (message.messageType === "file") {
            console.log("ChatPage: Gửi yêu cầu cập nhật file trong chatInfo");
            getChatFiles(socket, { conversationId: selectedMessageId });
          } else if (message.messageType === "link") {
            console.log("ChatPage: Gửi yêu cầu cập nhật link trong chatInfo");
            getChatLinks(socket, { conversationId: selectedMessageId });
          }
        } else {
          console.error("ChatPage: Lỗi khi gửi tin nhắn", response?.message);
          toast.error("Không thể gửi tin nhắn: " + (response?.message || "Lỗi hệ thống"));
        }
      });
    } else {
      console.error("ChatPage: Không thể gửi tin nhắn", { socket, selectedMessageId });
      toast.error("Không thể gửi tin nhắn: Thiếu kết nối hoặc hội thoại");
    }
  };

  const handleReply = (msg) => {
    console.log("ChatPage: Trả lời tin nhắn", msg);
    setReplyingTo(msg);
  };

  const handleForward = (msg) => {
    console.log("ChatPage: Chuyển tiếp tin nhắn", msg);
    setMessageToForward(msg);
    setIsShareModalVisible(true);
  };

  const handleCloseShareModal = () => {
    console.log("ChatPage: Đóng ShareModal");
    setIsShareModalVisible(false);
    setMessageToForward(null);
  };

  const handleShare = (selectedConversations, messageContent) => {
    console.log("ChatPage: Chia sẻ tin nhắn", { selectedConversations, messageContent, messageToForward });
    handleCloseShareModal();
  };

  const handleDelete = (msg) => {
    setMessageToDelete(msg);
    setIsDeleteModalVisible(true);
  };

  const handleRevoke = (msg) => {
    setMessageToRevoke(msg);
    setIsRevokeModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (messageToDelete) {
      console.log("ChatPage: Xóa tin nhắn", { messageId: messageToDelete._id });
      socket.emit("messageDeleted", { messageId: messageToDelete._id });
      dispatch(setMessages(messages.filter((message) => message._id !== messageToDelete._id)));
    }
    setIsDeleteModalVisible(false);
    setMessageToDelete(null);
  };

  const handleConfirmRevoke = () => {
    if (messageToRevoke) {
      console.log("ChatPage: Thu hồi tin nhắn", { messageId: messageToRevoke._id });
      socket.emit("messageRevoked", { messageId: messageToRevoke._id });
      dispatch(
        setMessages(
          messages.map((message) =>
            message._id === messageToRevoke._id ? { ...message, isRevoked: true } : message
          )
        )
      );
    }
    setIsRevokeModalVisible(false);
    setMessageToRevoke(null);
  };

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

  const ContextMenu = ({ x, y, message, fileIndex, onClose }) => {
    const isFile = fileIndex !== null;
    const fileUrl = isFile ? message.fileUrls[fileIndex] : null;
    const isImage = isFile && /\.(jpg|jpeg|png|gif)$/i.test(fileUrl);

    const handleCopyText = () => {
      if (message.content) {
        console.log("ChatPage: Sao chép nội dung tin nhắn", message.content);
        navigator.clipboard.writeText(message.content);
      }
      onClose();
    };

    const handleCopyImage = () => {
      if (fileUrl) {
        console.log("ChatPage: Sao chép URL hình ảnh", fileUrl);
        navigator.clipboard.writeText(fileUrl);
      }
      onClose();
    };

    const handleDelete = async () => {
      console.log("ChatPage: Xóa tin nhắn cloud", { messageId: message.messageId });
      try {
        await axios.delete(`http://184.73.0.29:3000/api/messages/${message.messageId}`);
      } catch (error) {
        console.error("ChatPage: Lỗi khi xóa tin nhắn cloud", error);
      }
      onClose();
    };

    const handleDownload = () => {
      if (fileUrl) {
        console.log("ChatPage: Tải xuống file", { fileUrl });
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

  const renderCloudMessage = (message) => {
    const handleContextMenu = (e, fileIndex = null) => {
      e.preventDefault();
      console.log("ChatPage: Mở context menu cho cloud message", { messageId: message.messageId, fileIndex });
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

  // Auto mark last message as read if it's from another user
  useEffect(() => {
    if (
      messages.length > 0 &&
      selectedMessageId &&
      selectedMessageId !== "my-cloud" &&
      socket &&
      currentUserId
    ) {
      const filteredMessages = messages.filter(
        (msg) =>
          msg.conversationId === selectedMessageId &&
          !msg.deletedBy?.includes(currentUserId)
      );
      if (filteredMessages.length > 0) {
        const lastMsg = filteredMessages[filteredMessages.length - 1];
        if (
          lastMsg.userId !== currentUserId &&
          (!lastMsg.status?.readBy || !lastMsg.status.readBy.includes(currentUserId))
        ) {
          markMessageAsRead(lastMsg._id);
        }
      }
    }
  }, [messages, selectedMessageId, socket, currentUserId]);

  useEffect(() => {
    if (!socket || !selectedMessageId || selectedMessageId === "my-cloud") return;

    const handleMessageRead = ({ messageId, userId, readBy }) => {
      console.log("ChatPage: Nhận messageRead", { messageId, userId, readBy });
      dispatch(setMessages(
        messages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                status: {
                  ...msg.status,
                  readBy: readBy,
                },
              }
            : msg
        )
      ));
    };

    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("messageRead", handleMessageRead);
    };
  }, [socket, selectedMessageId, messages, dispatch]);

  // Add this function to mark a message as read (emit trực tiếp)
  const markMessageAsRead = (messageId) => {
    if (
      socket &&
      selectedMessageId &&
      messageId &&
      selectedMessageId !== "my-cloud"
    ) {
      // Find the message
      const msg = messages.find((m) => m._id === messageId);
      if (!msg) return;
      // Only mark as read if the message is not from the current user and not already read
      if (
        msg.userId !== currentUserId &&
        (!msg.status?.readBy || !msg.status.readBy.includes(currentUserId))
      ) {
        socket.emit("readMessage", {
          conversationId: selectedMessageId,
          messageId,
          userId: currentUserId,
        });
      }
    }
  };

  // Auto mark last message as read if it's from another user
  useEffect(() => {
    if (
      messages.length > 0 &&
      selectedMessageId &&
      selectedMessageId !== "my-cloud" &&
      socket &&
      currentUserId
    ) {
      const filteredMessages = messages.filter(
        (msg) =>
          msg.conversationId === selectedMessageId &&
          !msg.deletedBy?.includes(currentUserId)
      );
      if (filteredMessages.length > 0) {
        const lastMsg = filteredMessages[filteredMessages.length - 1];
        if (
          lastMsg.userId !== currentUserId &&
          (!lastMsg.status?.readBy ||
            !lastMsg.status.readBy.includes(currentUserId))
        ) {
          markMessageAsRead(lastMsg._id);
        }
      }
    }
  }, [messages, selectedMessageId, socket, currentUserId]);

  useEffect(() => {
    if (!socket || !selectedMessageId || selectedMessageId === "my-cloud")
      return;

    const handleMessageRead = ({ messageId, userId, readBy }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? {
              ...msg,
              status: {
                ...msg.status,
                readBy: readBy, // cập nhật lại mảng readBy mới nhất từ BE
              },
            }
            : msg
        )
      );
    };

    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("messageRead", handleMessageRead);
    };
  }, [socket, selectedMessageId]);
  const sendMessageToChatGPT = async (message) => {
    try {
      // First, add the user's message to the UI immediately
      const userMessage = {
        _id: Date.now().toString(),
        content: message.content,
        userId: currentUserId,
        conversationId: 'chatgpt',
        createdAt: new Date().toISOString(),
        time: formatTime(new Date()),
        role: 'user',
        messageType: message.messageType || 'text'
      };
      
      // Update messages with user's message
      const updatedMessages = [...chatGPTMessages, userMessage];
      dispatch(setChatGPTMessages(updatedMessages));

      // Show loading state for ChatGPT's response
      const loadingMessageId = 'loading-' + Date.now();
      const loadingMessage = {
        _id: loadingMessageId,
        content: 'ChatGPT đang trả lời...',
        userId: 'chatgpt',
        conversationId: 'chatgpt',
        createdAt: new Date().toISOString(),
        time: formatTime(new Date()),
        isLoading: true,
        role: 'assistant'
      };
      
      // Add loading message
      dispatch(setChatGPTMessages([...updatedMessages, loadingMessage]));

      // Make API call to ChatGPT service
      const response = await Api_ChatGPT.sendMessage(message.content.toString());

      // Remove loading message and add ChatGPT's response
      const finalMessages = updatedMessages.filter(msg => msg._id !== loadingMessageId);
      const chatGPTResponse = {
        _id: Date.now().toString(),
        content: response.data.message,
        userId: 'chatgpt',
        conversationId: 'chatgpt',
        createdAt: new Date().toISOString(),
        time: formatTime(new Date()),
        role: response.data.role || 'assistant'
      };

      dispatch(setChatGPTMessages([...finalMessages, chatGPTResponse]));
    } catch (error) {
      console.error('Error sending message to ChatGPT:', error);
      toast.error('Không thể gửi tin nhắn đến ChatGPT. Vui lòng thử lại sau.');
      
      // Remove loading message but keep user's message
      const loadingMessageId = 'loading-' + Date.now();
      const finalMessages = chatGPTMessages.filter(msg => msg._id !== loadingMessageId);
      dispatch(setChatGPTMessages(finalMessages));
    }
  };


  // Hàm khởi tạo danh sách senders
const initializeSenders = () => {
  if (selectedMessage?.participants) {
    const senderList = [
      { userId: "all", name: "Tất cả" }, // Luôn có tùy chọn "Tất cả"
      ...selectedMessage.participants.map((participant) => {
        // Chuẩn hóa userId
        let userId = participant.userId;
        if (typeof userId === "object" && userId?._id) {
          userId = userId._id; // Lấy _id nếu userId là object
        }
        userId = userId?.toString() || "unknown"; // Chuyển thành chuỗi, mặc định "unknown" nếu không có

        // Xác định tên người gửi
        const name =
          userId === currentUserId
            ? "Bạn" // Hiển thị "Bạn" nếu là người dùng hiện tại
            : userCache[userId]?.name || // Lấy từ userCache nếu có
              (participant.firstname
                ? `${participant.firstname} ${participant.surname || ""}`.trim()
                : `Người dùng ${userId.slice(-4)}`); // Dự phòng nếu không có thông tin

        return {
          userId,
          name,
        };
      }),
    ];
    console.log("ChatPage: Khởi tạo danh sách senders", senderList);
    setSenders(senderList);
  } else {
    console.warn("ChatPage: Không có participants để khởi tạo senders");
    setSenders([{ userId: "all", name: "Tất cả" }]); // Danh sách mặc định chỉ có "Tất cả"
  }
};

  // Hàm đặt lại bộ lọc
  const resetFilters = () => {
    console.log("ChatPage: Đặt lại bộ lọc");
    setFilterSender("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchKeyword(""); // Tùy chọn: đặt lại từ khóa tìm kiếm
    initializeSenders(); // Tải lại danh sách senders
    setIsSearchModalVisible(false); // Tùy chọn: đóng modal sau khi đặt lại
    // Nếu muốn làm mới kết quả tìm kiếm, có thể gọi lại searchMessages
    // searchMessages();
  };
  // useEffect để khởi tạo senders
  useEffect(() => {
    initializeSenders();
  }, [selectedMessage, userCache]);

  // Hàm tìm kiếm 
const searchMessages = async () => {
  console.log("ChatPage: Bắt đầu tìm kiếm", {
    conversationId: selectedMessageId,
    searchTerm: searchKeyword.trim(),
    userId: currentUserId,
    filterSender,
    filterStartDate,
    filterEndDate,
  });

  if (!selectedMessageId) {
    console.warn("ChatPage: Thiếu conversationId");
    toast.error("Không tìm thấy ID cuộc trò chuyện.");
    setIsSearching(false);
    return;
  }
  if (!searchKeyword.trim()) {
    console.warn("ChatPage: Từ khóa tìm kiếm rỗng");
    toast.error("Vui lòng nhập từ khóa tìm kiếm.");
    setIsSearching(false);
    return;
  }
  if (!currentUserId) {
    console.warn("ChatPage: Thiếu userId");
    toast.error("Không thể xác định người dùng hiện tại.");
    setIsSearching(false);
    return;
  }

  setIsSearching(true);
  try {
    const response = await Api_chatInfo.searchMessages({
      conversationId: selectedMessageId,
      searchTerm: searchKeyword.trim(),
      page: 1,
      limit: 20,
      userId: currentUserId,
      senderId: filterSender === "all" ? null : filterSender,
      startDate: filterStartDate || null,
      endDate: filterEndDate || null,
    });
    console.log("ChatPage: Kết quả tìm kiếm", response);

    if (response.success) {
      // Lọc bỏ tin nhắn bị xóa bởi currentUserId
      const filteredMessages = response.messages.filter(
        (msg) => !msg.deletedBy?.includes(currentUserId)
      );
      setSearchResults(filteredMessages);
      setTotalResults(filteredMessages.length); // Cập nhật total dựa trên số tin nhắn còn lại
      setIsSearchModalVisible(true);
    } else {
      console.warn("ChatPage: Tìm kiếm thất bại", response.error);
      toast.error(response.error || "Không tìm thấy tin nhắn phù hợp.");
    }
  } catch (error) {
    console.error("ChatPage: Lỗi khi tìm kiếm", {
      message: error.message,
      response: error.response,
    });
    let errorMessage = "Không thể tìm kiếm tin nhắn. Vui lòng thử lại.";
    if (error.message.includes("Network Error")) {
      errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.";
    } else if (error.response?.error) {
      errorMessage = error.response.error;
    }
    toast.error(errorMessage);
  } finally {
    setIsSearching(false);
  }
};

  // Hàm cuộn đến tin nhắn
 const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId); // Set ID để highlight
      setIsSearchModalVisible(false);
      setSearchKeyword("");

      // Tự động tắt highlight sau 3 giây
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    } else {
      toast.error("Không tìm thấy tin nhắn trong danh sách hiện tại, có thể nó đã bị xóa hoặc không còn trong cuộc trò chuyện.");
    }
  };

  // Hàm render kết quả tìm kiếm
const renderSearchResult = (msg) => {
  // Kiểm tra userId của tin nhắn, có thể nằm trong msg.userId hoặc msg.userId._id
  const messageUserId = msg.userId?._id || msg.userId;
  const isCurrentUser = messageUserId === currentUserId;
  
  // Xác định tên người gửi
  const senderName = isCurrentUser
    ? "Bạn"
    : msg.userId?.firstname
      ? `${msg.userId.firstname} ${msg.userId.surname || ''}`.trim()
      : userCache[messageUserId]?.name || "Người dùng ẩn danh";

  console.log("ChatPage: Render search result", { msgId: msg._id, senderName, isCurrentUser });
  
  return (
    <div
      className="p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
      onClick={() => scrollToMessage(msg._id)}
    >
      <p className="font-bold text-sm">{senderName}</p>
      <p className="text-sm text-gray-600 truncate">{msg.content}</p>
      <p className="text-xs text-gray-500">
        {format(new Date(msg.createdAt), "HH:mm", { locale: vi })}
      </p>
    </div>
  );
};

 return (
  <div className="min-h-screen bg-gray-100 flex">
    <style>
      {`
        .highlighted {
          background-color: #e0f7fa;
          transition: background-color 0.5s ease;
          border-radius: 8px;
          padding: 4px;
        }
      `}
    </style>
    {selectedChat ? (
      <div className={`flex w-full transition-all duration-300`}>
        <div
          className={`flex flex-col h-screen transition-all duration-300 ${
            isChatInfoVisible ? "w-[calc(100%-400px)]" : "w-full"
          }`}
        >
          {/* Header Section */}
          {selectedChat.type === "cloud" ? (
            <ChatHeaderCloud
              name={cloudChat.name}
              avatar={cloudChat.avatar}
              isChatInfoVisible={isChatInfoVisible}
              setIsChatInfoVisible={setIsChatInfoVisible}
            />
          ) : selectedChat.type === "chatgpt" ? (
            <ChatHeaderChatGPT
              onBack={() => dispatch(clearSelectedMessage())}
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
              onSearch={searchMessages}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              isSearching={isSearching}
            />
          )}

          {/* Messages Section */}
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
                      const currentDate = formatDateSeparator(message.timestamp);
                      const prevMessage = index > 0 ? cloudMessages[index - 1] : null;
                      const prevDate = prevMessage ? formatDateSeparator(prevMessage.timestamp) : null;
                      const showDateSeparator = index === 0 || currentDate !== prevDate;

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
          ) : selectedChat.type === "chatgpt" ? (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {chatGPTMessages.length > 0 ? (
                  chatGPTMessages
                    .filter(msg => !msg.deletedBy?.includes(currentUserId))
                    .map((msg) => (
                      <MessageItemChatGPT
                        key={msg._id}
                        msg={msg}
                        currentUserId={currentUserId}
                      />
                    ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Bắt đầu trò chuyện với ChatGPT</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <ChatFooterChatGPT
                onSendMessage={(message) => {
                  sendMessageToChatGPT(message);
                }}
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
                    .map((msg, index, filteredMessages) => (
                      <MessageItem
                        key={msg._id}
                        msg={{
                          ...msg,
                          sender:
                            msg.userId === currentUserId
                              ? "Bạn"
                              : userCache[msg.userId]?.name || `${msg.userId?.firstname || ''} ${msg.userId?.surname || ''}`.trim() || "Unknown",
                          time: formatTime(msg.createdAt),
                          messageType: msg.messageType || "text",
                          content: msg.content || "",
                          linkURL: msg.linkURL || "",
                          userId: msg.userId,
                          receiverId: selectedMessage?.participants?.find(
                            (p) => p.userId !== currentUserId
                          )?.userId,
                        }}
                        currentUserId={currentUserId}
                        onReply={handleReply}
                        onForward={handleForward}
                        onRevoke={handleRevoke}
                        onDelete={handleDelete}
                        messages={messages}
                        isLastMessage={
                          index === filteredMessages.length - 1 &&
                          msg.userId === currentUserId
                        }
                        participants={selectedMessage?.participants}
                        userCache={userCache}
                        markMessageAsRead={markMessageAsRead}
                        highlightedMessageId={highlightedMessageId}
                      />
                    ))
                ) : (
                  <div></div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Search Modal */}
              {isSearchModalVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
                  <div
                    className="fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSearchModalVisible(false)}
                  />
                  <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col relative z-60 shadow-xl transform transition-all duration-300">
                    {/* Search Modal Content */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Kết quả tìm kiếm ({totalResults})
                      </h2>
                      <button
                        onClick={() => setIsSearchModalVisible(false)}
                        className="text-gray-500 hover:text-blue-500 transition-colors duration-200"
                      >
                        <IoClose size={24} />
                      </button>
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Người gửi
                        </label>
                        <select
                          value={filterSender}
                          onChange={(e) => setFilterSender(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          {senders.map((sender) => (
                            <option key={sender.userId} value={sender.userId}>
                              {sender.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Từ ngày
                          </label>
                          <input
                            type="date"
                            value={filterStartDate || ""}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Đến ngày
                          </label>
                          <input
                            type="date"
                            value={filterEndDate || ""}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={searchMessages}
                          className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        >
                          Áp dụng bộ lọc
                        </button>
                        <button
                          onClick={resetFilters}
                          className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                        >
                          Xóa bộ lọc
                        </button>
                      </div>
                    </div>

                    {/* Search Results */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {isSearching ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-600">Đang tìm kiếm...</p>
                          </div>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <p className="text-center text-gray-500 p-4 font-medium">
                          Không tìm thấy tin nhắn
                        </p>
                      ) : (
                        searchResults.map((msg) => renderSearchResult(msg))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Typing Indicator */}
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

              {/* Chat Footer */}
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

        {/* Chat Info Sidebar */}
        {isChatInfoVisible && (
          <div className="w-[400px] bg-white border-l p-2 max-h-screen transition-all duration-300">
            {selectedChat.type === "cloud" ? (
              <ChatInfoCloud
                userId={currentUserId}
                conversationId={conversationId}
                cloudMessages={cloudMessages}
              />
            ) : selectedChat.type === "chatgpt" ? (
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">ChatGPT</h2>
                <p className="text-gray-600">
                  ChatGPT là trợ lý AI có thể giúp bạn trả lời câu hỏi, viết code, và nhiều việc khác.
                </p>
              </div>
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

    {/* Modals */}
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
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      />
    )}

    {isDeleteModalVisible && (
      <ConfirmModal
        isOpen={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa tin nhắn"
        message="Bạn có chắc muốn xóa tin nhắn này? Nếu muốn xóa cả hai bên thì hãy nhấn vào nút thu hồi."
      />
    )}

    {isRevokeModalVisible && (
      <ConfirmModal
        isOpen={isRevokeModalVisible}
        onClose={() => setIsRevokeModalVisible(false)}
        onConfirm={handleConfirmRevoke}
        title="Thu hồi tin nhắn"
        message="Bạn có chắc muốn thu hồi tin nhắn này?"
      />
    )}
  </div>
);
}

export default ChatPage;