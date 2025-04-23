import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import ChatInfo from "../../layouts/components/chatwindow/ChatInfo";
import { useSelector, useDispatch } from "react-redux";
import { clearSelectedMessage } from "../../redux/slices/chatSlice";
import ChatHeader from "./ChatWindow/ChatHeader";
import MessageItem from "./ChatWindow/MessageItem";
import ChatFooter from "./ChatWindow/ChatFooter";
import TingTingImage from "../../assets/TingTing_Chat.png";
import axios from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import ChatHeaderCloud from "./ChatWindow/ChatHeaderCloud";
import ChatFooterCloud from "./ChatWindow/ChatFooterCloud";
import { useSocket } from "../../contexts/SocketContext";
import { useCloudSocket } from "../../contexts/CloudSocketContext";
import ShareModal from "../../components/chat/ShareModal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../apis/api_profile";
import ConfirmModal from "../../components/ConfirmModal";

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
  const [userCache, setUserCache] = useState({}); // Cache lưu thông tin người dùng

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

  // Hàm lấy thông tin người dùng từ API và lưu vào cache
  const fetchUserInfo = async (userId) => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    try {
      const response = await Api_Profile.getProfile(userId);
      if (response?.data?.user) {
        const userInfo = {
          name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
          avatar: response.data.user.avatar || "https://picsum.photos/200",
        };
        setUserCache((prev) => ({ ...prev, [userId]: userInfo }));
        return userInfo;
      }
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin người dùng ${userId}:`, error);
      return { name: "Unknown", avatar: "https://picsum.photos/200" };
    }
  };

  // Tải thông tin người dùng khi messages thay đổi
  useEffect(() => {
    const loadUserInfos = async () => {
      const userIds = [
        ...new Set(
          messages.map((msg) => msg.userId).filter((id) => id !== currentUserId)
        ),
      ];
      for (const userId of userIds) {
        await fetchUserInfo(userId);
      }
    };

    if (messages.length > 0) {
      loadUserInfos();
    }
  }, [messages, currentUserId]);

  // Lấy thông tin chi tiết cuộc trò chuyện
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!selectedMessage || !currentUserId) return;

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

      setChatDetails({ name, avatar, members, lastActive });
    };

    fetchChatDetails();
  }, [selectedMessage, currentUserId]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.IO cho phần cloud
  useEffect(() => {
    if (socketCloud && selectedMessageId === "my-cloud") {
      console.log("Socket for cloud active, currentUserId:", currUserId);

      socketCloud.on("newMessage", (newMessage) => {
        console.log("Received newMessage:", newMessage);
        if (!newMessage.userId) {
          console.warn("newMessage missing userId:", newMessage);
          return;
        }
        if (newMessage.userId === currentUserId) {
          setCloudMessages((prevMessages) => {
            if (
              !prevMessages.some(
                (msg) => msg.messageId === newMessage.messageId
              )
            ) {
              console.log("Adding new message to cloudMessages:", newMessage);
              const updatedMessages = [...prevMessages, newMessage].sort(
                (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
              );
              setShouldScrollToBottom(true);
              return updatedMessages;
            }
            console.log("Message already exists:", newMessage.messageId);
            return prevMessages;
          });
        }
      });

      socketCloud.on("messageDeleted", ({ messageId }) => {
        console.log("Received messageDeleted:", messageId);
        setCloudMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.messageId !== messageId)
        );
      });

      socketCloud.on("error", (error) => {
        console.error("Socket error in cloud:", error);
      });

      socketCloud.on("connect", () => {
        console.log("Socket reconnected for cloud");
      });

      socketCloud.on("disconnect", () => {
        console.warn("Socket disconnected for cloud");
      });

      socketCloud.on("connect_error", (error) => {
        console.error("Socket connect_error in cloud:", error.message);
      });

      return () => {
        console.log("Cleaning up socket listeners for cloud");
        socketCloud.off("newMessage");
        socketCloud.off("messageDeleted");
        socketCloud.off("error");
        socketCloud.off("connect");
        socketCloud.off("disconnect");
        socketCloud.off("connect_error");
      };
    } else if (selectedMessageId === "my-cloud" && !socketCloud) {
      console.warn(
        "Socket not initialized for cloud, check userId in localStorage"
      );
    }
  }, [socketCloud, selectedMessageId, currUserId]);

  // Xử lý socket events
  useEffect(() => {
    if (socket && selectedMessageId && selectedMessageId !== "my-cloud") {
      socket.emit("joinConversation", { conversationId: selectedMessageId });

      socket.on("loadMessages", (data) => {
        setMessages(data);
        console.log("Loaded messages:", data);
      });

      socket.on("receiveMessage", (newMessage) => {
        setMessages((prevMessages) => {
          if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
            return [...prevMessages, newMessage];
          }
          return prevMessages;
        });
      });

      // Nhận tin nhắn từ cuộc gọi (newMessage từ callHandler.js)
      socket.on("newMessage", (newMessage) => {
        console.log("Received newMessage:", newMessage);
        // Xử lý conversationId có thể là object hoặc string
        const messageConversationId = newMessage.conversationId?._id
          ? newMessage.conversationId._id.toString()
          : newMessage.conversationId.toString();
        console.log("Comparing conversationId:", {
          messageConversationId,
          selectedMessageId,
        });

        if (messageConversationId === selectedMessageId) {
          setMessages((prevMessages) => {
            if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
              console.log("Adding newMessage to messages:", newMessage);
              return [...prevMessages, newMessage];
            }
            console.log("Message already exists:", newMessage._id);
            return prevMessages;
          });
        } else {
          console.log(
            "New message for different conversation:",
            messageConversationId,
            "Current selected:",
            selectedMessageId
          );
          // (Tùy chọn) Cập nhật selectedMessageId nếu cần
          // dispatch(selectConversation(messageConversationId));
        }
      });

      // Xác nhận tin nhắn đã gửi
      socket.on("messageSent", (newMessage) => {
        setMessages((prevMessages) => {
          if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
            return [...prevMessages, newMessage];
          }
          return prevMessages;
        });
      });

      socket.on("messageDeleted", ({ messageId }) => {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg._id !== messageId)
        );
      });

      socket.on("messageRevoked", ({ messageId }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId ? { ...msg, isRevoked: true } : msg
          )
        );
      });

      // Xử lý lỗi
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      return () => {
        socket.off("loadMessages");
        socket.off("receiveMessage");
        socket.off("messageSent");
        socket.off("newMessage");
        socket.off("messageDeleted");
        socket.off("messageRevoked");
        socket.off("error");
      };
    }
  }, [socket, selectedMessageId]);

  const selectedChat = selectedMessage
    ? {
        id: selectedMessageId,
        name: chatDetails.name,
        avatar: chatDetails.avatar,
        type: selectedMessage.type || "personal",
      }
    : null;

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
      console.log("Emitting sendMessage:", payload);
      socket.emit("sendMessage", payload);
    } else {
      console.error("Cannot send message: missing socket or conversationId");
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
  };

  const handleForward = (msg) => {
    setMessageToForward(msg);
    setIsShareModalVisible(true);
    console.log("Mở ShareModal để chuyển tiếp:", msg);
  };

  const handleCloseShareModal = () => {
    setIsShareModalVisible(false);
    setMessageToForward(null);
    console.log("Đóng ShareModal");
  };

  const handleShare = (selectedConversations, messageContent) => {
    console.log(
      "Thực hiện chia sẻ đến:",
      selectedConversations,
      "với nội dung:",
      messageContent,
      "tin nhắn:",
      messageToForward
    );
    handleCloseShareModal();
  };

  const handleDelete = (msg) => {
    if (
      window.confirm(
        "Bạn có chắc muốn xóa tin nhắn này? Nếu muốn xóa cả hai bên thì hãy nhấn vào nút thu hồi"
      )
    ) {
      socket.emit("messageDeleted", { messageId: msg._id });
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message._id !== msg._id)
      );
      console.log("Deleted message:", msg._id);
    }
  };

  const handleRevoke = (msg) => {
    if (window.confirm("Bạn có chắc muốn thu hồi tin nhắn này?")) {
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
        `http://localhost:3000/api/messages/user/${localStorage.getItem(
          "userId"
        )}`
      );
      const sortedMessages = response.data.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      setCloudMessages(sortedMessages);
      setShouldScrollToBottom(true);
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn cloud:", error);
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    if (shouldScrollToBottom && cloudChatContainerRef.current) {
      console.log(
        "Scrolling to bottom, cloudMessages length:",
        cloudMessages.length
      );
      const container = cloudChatContainerRef.current;
      container.scrollTop = container.scrollHeight;
      setShouldScrollToBottom(false);
    }
  }, [cloudMessages, shouldScrollToBottom]);

  useEffect(() => {
    if (selectedMessageId === "my-cloud") {
      fetchCloudMessages();
    }
  }, [selectedMessageId]);

  useEffect(() => {
    const handleClickOutside = () => {
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
    const isImage = isFile && /\.(jpg|jpeg|png|gif)$/i.test(fileUrl);

    const handleCopyText = () => {
      if (message.content) {
        navigator.clipboard.writeText(message.content);
      }
      onClose();
    };

    const handleCopyImage = () => {
      if (fileUrl) {
        navigator.clipboard.writeText(fileUrl);
      }
      onClose();
    };

    const handleDelete = async () => {
      try {
        await axios.delete(
          `http://localhost:3000/api/messages/${message.messageId}`
        );
      } catch (error) {
        console.error("Lỗi khi xóa tin nhắn:", error);
      }
      onClose();
    };

    const handleDownload = () => {
      if (fileUrl) {
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
                  {messages
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
                    ))}
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
