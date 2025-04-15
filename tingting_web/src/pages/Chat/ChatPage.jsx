import React, { useState, useEffect, useRef } from "react";
import ChatInfo from "../../layouts/components/chatwindow/ChatInfo";
import { useSelector, useDispatch } from "react-redux";
import { clearSelectedMessage } from "../../redux/slices/chatSlice";
import ChatHeader from "./ChatWindow/ChatHeader";
import MessageItem from "./ChatWindow/MessageItem";
import ChatFooter from "./ChatWindow/ChatFooter";
import TingTingImage from "../../assets/TingTing_Chat.png";
import { useSocket } from "../../contexts/SocketContext";

function ChatPage() {
  const [isChatInfoVisible, setIsChatInfoVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const socket = useSocket();
  const currentUserId = socket?.io?.opts?.query?.userId;
  const messagesEndRef = useRef(null);

  // Redux hooks
  const dispatch = useDispatch();
  const selectedMessage = useSelector((state) => state.chat.selectedMessage);
  const selectedMessageId = selectedMessage?.id;

  // Scroll to new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle socket events
  useEffect(() => {
    if (socket && selectedMessageId) {
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

      socket.on("messageSent", (newMessage) => {
        setMessages((prevMessages) => {
          if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
            return [...prevMessages, newMessage];
          }
          return prevMessages;
        });
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      return () => {
        socket.off("loadMessages");
        socket.off("receiveMessage");
        socket.off("messageSent");
        socket.off("error");
      };
    }
  }, [socket, selectedMessageId]);

  // Chat info
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

  // Format time
  const formatTime = (createdAt) => {
    return new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Send message
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="min-h-screen bg-gray-100 flex">
        {selectedChat ? (
          <div className={`flex w-full transition-all duration-300`}>
            <div
              className={`flex-1 transition-all duration-300 ${
                isChatInfoVisible ? "w-[calc(100%-400px)]" : "w-full"
              }`}
            >
              <ChatHeader
                type={selectedChat.type}
                name={selectedChat.name}
                lastActive={6}
                avatar={selectedChat.avatar}
                isChatInfoVisible={isChatInfoVisible}
                setIsChatInfoVisible={setIsChatInfoVisible}
              />
              <div className="p-4 w-full h-[calc(100vh-200px)] overflow-y-auto">
                {messages
                  .filter((msg) => msg.conversationId === selectedMessageId)
                  .map((msg) => (
                    <MessageItem
                      key={msg._id}
                      msg={{
                        ...msg,
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
                    />
                  ))}
                <div ref={messagesEndRef} />
              </div>
              <ChatFooter
                className="fixed bottom-0 p-5 left-0 w-full bg-white shadow-md"
                sendMessage={sendMessage}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
              />
            </div>

            {isChatInfoVisible && (
              <div className="w-[400px] bg-white border-l p-2 max-h-screen transition-all duration-300">
                <ChatInfo />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-white">
            <h1 className="text-2xl font-bold justify-center">
              Chào mừng đến với TingTing PC!
            </h1>
            <p className="text-gray-500">
              Khám phá các tiện ích hỗ trợ làm việc và trò chuyện cùng người
              thân, bạn bè.
            </p>
            <img
              src={TingTingImage}
              alt="Welcome"
              className="mt-4 w-64 h-auto rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
