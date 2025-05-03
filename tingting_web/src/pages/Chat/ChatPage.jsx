import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import ChatInfo from "../../layouts/components/chatwindow/ChatInfo";
import { useSelector, useDispatch } from "react-redux";
import { clearSelectedMessage, setLastMessageUpdate, setChatInfoUpdate } from "../../redux/slices/chatSlice";
import ChatHeader from "./ChatWindow/ChatHeader";
import MessageItem from "./ChatWindow/MessageItem";
import ChatFooter from "./ChatWindow/ChatFooter";
import TingTingImage from "../../assets/TingTing_Chat.png";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ChatHeaderCloud from "./ChatWindow/ChatHeaderCloud";
import ChatFooterCloud from "./ChatWindow/ChatFooterCloud";
import ShareModal from "../../components/chat/ShareModal";
import { Api_Profile } from "../../../apis/api_profile";
import { onChatInfoUpdated, offChatInfoUpdated } from "../../services/sockets/events/chatInfo";
import { useSocket } from "../../contexts/SocketContext";
import { useCloudSocket } from "../../contexts/CloudSocketContext";
import { toast } from "react-toastify";

function ChatPage() {
  const [isChatInfoVisible, setIsChatInfoVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const { socket, userId: currentUserId } = useSocket();
  const messagesEndRef = useRef(null);
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
  const cloudChatContainerRef = useRef(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [userCache, setUserCache] = useState({});
  const joinedRoomRef = useRef(null);

  const [chatDetails, setChatDetails] = useState({
    name: "Unknown",
    avatar: "https://picsum.photos/200",
    members: 0,
    lastActive: 6,
  });

  const selectedMessage = useSelector((state) => state.chat.selectedMessage);
  const selectedMessageId = selectedMessage?.id;
  const socketCloud = useCloudSocket();
  const currUserId = localStorage.getItem("userId");
  const dispatch = useDispatch();

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
          name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
          avatar: response.data.user.avatar || "https://picsum.photos/200",
        };
        console.log("ChatPage: Nhận thông tin người dùng từ API", { userId, userInfo });
        setUserCache((prev) => ({ ...prev, [userId]: userInfo }));
        return userInfo;
      }
    } catch (error) {
      console.error("ChatPage: Lỗi khi lấy thông tin người dùng", { userId, error });
      return { name: "Unknown", avatar: "https://picsum.photos/200" };
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
    };

    if (messages.length > 0) {
      loadUserInfos();
    }
  }, [messages, currentUserId]);

  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!selectedMessage || !currentUserId) {
        console.warn("ChatPage: Thiếu selectedMessage hoặc currentUserId", { selectedMessage, currentUserId });
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

      console.log("ChatPage: Cập nhật chatDetails", { name, avatar, members, lastActive });
      setChatDetails({ name, avatar, members, lastActive });
    };

    fetchChatDetails();
  }, [selectedMessage, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (socketCloud && selectedMessageId === "my-cloud") {
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
    } else if (selectedMessageId === "my-cloud" && !socketCloud) {
      console.warn("ChatPage: Socket không khởi tạo cho cloud");
    }
  }, [socketCloud, selectedMessageId, currUserId, currentUserId]);

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
    }

    socket.on("loadMessages", (data) => {
      console.log("ChatPage: Nhận loadMessages", data);
      setMessages(data);
    });

    socket.on("receiveMessage", (newMessage) => {
      console.log("ChatPage: Nhận receiveMessage", newMessage);
      setMessages((prevMessages) => {
        if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
          const updatedMessages = [...prevMessages, newMessage];
          dispatch(setLastMessageUpdate({
            conversationId: newMessage.conversationId,
            lastMessage: newMessage,
          }));
          return updatedMessages;
        }
        return prevMessages;
      });
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
        setMessages((prevMessages) => {
          if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
            const updatedMessages = [...prevMessages, newMessage];
            dispatch(setLastMessageUpdate({
              conversationId: newMessage.conversationId,
              lastMessage: newMessage,
            }));
            return updatedMessages;
          }
          console.log("ChatPage: Message đã tồn tại", newMessage._id);
          return prevMessages;
        });
      }
    });

    socket.on("messageSent", (newMessage) => {
      console.log("ChatPage: Nhận messageSent", newMessage);
      setMessages((prevMessages) => {
        if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
          const updatedMessages = [...prevMessages, newMessage];
          dispatch(setLastMessageUpdate({
            conversationId: newMessage.conversationId,
            lastMessage: newMessage,
          }));
          return updatedMessages;
        }
        return prevMessages;
      });
    });

    socket.on("messageDeleted", ({ messageId }) => {
      console.log("ChatPage: Nhận messageDeleted", { messageId });
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    });

    socket.on("messageRevoked", ({ messageId }) => {
      console.log("ChatPage: Nhận messageRevoked", { messageId });
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId ? { ...msg, isRevoked: true } : msg
        )
      );
    });

    socket.on("chatHistoryDeleted", ({ conversationId }) => {
      console.log("ChatPage: Nhận chatHistoryDeleted", { conversationId });
      if (conversationId === selectedMessageId) {
        setMessages((prevMessages) =>
          prevMessages.filter(
            (msg) => !msg.deletedBy?.includes(currentUserId)
          )
        );
      }
    });

    socket.on("deleteAllChatHistory", ({ conversationId, userId }) => {
      console.log("ChatPage: Nhận deleteAllChatHistory", { conversationId, userId });
      if (conversationId === selectedMessageId && userId === currentUserId) {
        setMessages([]);
        dispatch(setLastMessageUpdate({
          conversationId: conversationId,
          lastMessage: null,
        }));
        toast.success("Toàn bộ lịch sử trò chuyện đã được xóa!");
      } else {
        console.log("ChatPage: Bỏ qua deleteAllChatHistory vì không khớp userId hoặc conversationId", {
          userId,
          currentUserId,
          conversationId,
          selectedMessageId,
        });
      }
    });

    socket.on("conversationUpdated", ({ conversationId, lastMessage, updatedAt }) => {
      console.log("ChatPage: Nhận conversationUpdated", { conversationId, lastMessage, updatedAt });
      if (conversationId === selectedMessageId) {
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.filter(
            (msg) => !msg.deletedBy?.includes(currentUserId)
          );
          if (lastMessage && !updatedMessages.some((msg) => msg._id === lastMessage._id)) {
            const newMessages = [...updatedMessages, lastMessage];
            dispatch(setLastMessageUpdate({
              conversationId: conversationId,
              lastMessage: lastMessage,
            }));
            return newMessages;
          }
          return updatedMessages;
        });
      }
    });

    socket.on("error", (error) => {
      console.error("ChatPage: Socket error", error);
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
      socket.off("messageSent");
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("messageRevoked");
      socket.off("chatHistoryDeleted");
      socket.off("deleteAllChatHistory");
      socket.off("conversationUpdated");
      socket.off("error");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [socket, selectedMessageId, currentUserId, dispatch]);

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

  const formatTime = (createdAt) => {
    return new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
      socket.emit("sendMessage", payload);
    } else {
      console.error("ChatPage: Không thể gửi tin nhắn", { socket, selectedMessageId });
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
    if (
      window.confirm(
        "Bạn có chắc muốn xóa tin nhắn này? Nếu muốn xóa cả hai bên thì hãy nhấn vào nút thu hồi"
      )
    ) {
      console.log("ChatPage: Xóa tin nhắn", { messageId: msg._id });
      socket.emit("messageDeleted", { messageId: msg._id });
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message._id !== msg._id)
      );
    }
  };

  const handleRevoke = (msg) => {
    if (window.confirm("Bạn có chắc muốn thu hồi tin nhắn này?")) {
      console.log("ChatPage: Thu hồi tin nhắn", { messageId: msg._id });
      socket.emit("messageRevoked", { messageId: msg._id });
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message._id === msg._id ? { ...message, isRevoked: true } : message
        )
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "HH:mm", { locale: vi });
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy", { locale: vi });
  };

  const fetchCloudMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/messages/user/${localStorage.getItem("userId")}`
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
      fetchCloudMessages();
    }
  }, [selectedMessageId]);

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

  const ContextMenu = ({ x, y, message, fileIndex, onClose }) => {
    const isFile = fileIndex !== null;
    const fileUrl = isFile ? message.fileUrls[fileIndex] : null;
    const isImage = isFile && /\.(jpg|jpeg|png|gif)$/.test(fileUrl);

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
        await axios.delete(`http://localhost:3000/api/messages/${message.messageId}`);
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

          {message.fileUrls && message.fileUrls.length > 0 && (
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

  console.log("ChatPage: Render với", { selectedChat, chatDetails, messages, cloudMessages });

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
                  onReload={fetchCloudMessages}
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
                    <div></div> // Không render gì khi messages rỗng
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <ChatFooter
                  className="fixed bottom-0 left-0 w-full bg-white shadow-md"
                  sendMessage={sendMessage}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                />
              </>
            )}
          </div>

          {isChatInfoVisible && (
            <div className="w-[400px] bg-white border-l p-2 max-h-screen transition-all duration-300">
              <ChatInfo
                userId={currentUserId}
                conversationId={conversationId}
                socket={socket}
              />
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
      <ShareModal
        isOpen={isShareModalVisible}
        onClose={handleCloseShareModal}
        onShare={handleShare}
        messageToForward={messageToForward}
        userId={currentUserId}
        messageId={messageToForward?._id}
      />
    </div>
  );
}

export default ChatPage;