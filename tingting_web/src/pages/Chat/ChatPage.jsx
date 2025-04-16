import React, { useState, useEffect, useRef } from "react";
import ChatInfo from "../../layouts/components/chatwindow/ChatInfo";
import { useSelector, useDispatch } from "react-redux";
import { clearSelectedMessage } from "../../redux/slices/chatSlice";
import ChatHeader from "./ChatWindow/ChatHeader";
import MessageItem from "./ChatWindow/MessageItem";
import ChatFooter from "./ChatWindow/ChatFooter";
import TingTingImage from "../../assets/TingTing_Chat.png";
import { useSocket } from "../../contexts/SocketContext";
import ShareModal from "../../components/chat/ShareModal";

function ChatPage() {
  const [isChatInfoVisible, setIsChatInfoVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const socket = useSocket();
  const currentUserId = socket?.io?.opts?.query?.userId;
  const messagesEndRef = useRef(null);

  const [isShareModalVisible, setIsShareModalVisible] = useState(false); // State cho ShareModal
  const [messageToForward, setMessageToForward] = useState(null); // State để lưu tin nhắn cần chuyển tiếp
  
  const dispatch = useDispatch();
  const selectedMessage = useSelector((state) => state.chat.selectedMessage);
  const selectedMessageId = selectedMessage?.id;



  const conversationId = selectedMessageId;
  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Xử lý socket events
  useEffect(() => {
    if (socket && selectedMessageId) {
      socket.emit("joinConversation", { conversationId: selectedMessageId });

      // Tải tin nhắn
      socket.on("loadMessages", (data) => {
        setMessages(data);
        console.log("Loaded messages:", data);
      });

      // Nhận tin nhắn mới
      socket.on("receiveMessage", (newMessage) => {
        setMessages((prevMessages) => {
          if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
            return [...prevMessages, newMessage];
          }
          return prevMessages;
        });
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

      // Xử lý lỗi
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      // Dọn dẹp khi component unmount
      return () => {
        socket.off("loadMessages");
        socket.off("receiveMessage");
        socket.off("messageSent");
        // socket.off("messageDeleted");
        socket.off("error");
      };
    }
  }, [socket, selectedMessageId]);

  const selectedChat = selectedMessage
    ? {
        id: selectedMessageId,
        name:
          selectedMessage.participants?.find((p) => p.userId !== currentUserId)
            ?.userId === currentUserId
            ? "Bạn"
            : "Unknown",
        avatar: "https://picsum.photos/200",
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
    if (socket && selectedMessageId) {
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

  const handleReply = (msg) => setReplyingTo(msg);
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
    // ... logic chia sẻ thực tế ...
    console.log("Thực hiện chia sẻ đến:", selectedConversations, "với nội dung:", messageContent, "tin nhắn:", messageToForward);
    handleCloseShareModal(); // Đóng modal sau khi chia sẻ (hoặc hủy)
  };

  const handleDelete = (msg) => {
    if (
      window.confirm(
        "Bạn có chắc muốn xóa tin nhắn này?Nếu muốn xóa cả hai bên thì hãy nhấn vào nút thu hồi"
      )
    ) {
      // Lắng nghe tin nhắn bị xóa
      socket.emit("messageDeleted", { messageId: msg._id });
      // Xóa tin nhắn khỏi danh sách
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {selectedChat ? (
        <div className={`flex w-full transition-all duration-300`}>
          {/* <div
            className={`flex-1 transition-all duration-300 ${
              isChatInfoVisible ? "w-[calc(100%-400px)]" : "w-full"
            }`}
          > */}
          <div className={`flex flex-col h-screen transition-all duration-300 ${isChatInfoVisible ? "w-[calc(100%-400px)]" : "w-full"}`}>
          <ChatHeader
              type={selectedChat.type}
              name={selectedChat.name}
              lastActive={6}
              avatar={selectedChat.avatar}
              isChatInfoVisible={isChatInfoVisible}
              setIsChatInfoVisible={setIsChatInfoVisible}
            />
            <div className="flex-1 overflow-y-auto p-4">
              {messages
                .filter((msg) => msg.conversationId === selectedMessageId)
                .map((msg) => (
                  <MessageItem
                    key={msg._id}
                    msg={{
                      ...msg,
                      id: msg._id,
                      sender:
                        msg.userId === currentUserId
                          ? "Bạn"
                          : selectedMessage.participants?.find(
                            (p) => p.userId === msg.userId
                          )
                            ? ""
                            : "Unknown",
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
      {/* Hiển thị ShareModal có điều kiện */}
      <ShareModal
        isOpen={isShareModalVisible}
        onClose={handleCloseShareModal} // Hàm đóng modal
        onShare={handleShare} // Hàm xử lý logic chia sẻ
        messageToForward={messageToForward}
        userId={currentUserId} // Truyền userId vào ShareModal
        messageId={messageToForward?._id} // Truyền messageId vào ShareModal
      />

    </div>
    
  );
}

export default ChatPage;
