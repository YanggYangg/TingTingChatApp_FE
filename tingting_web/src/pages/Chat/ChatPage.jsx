import React, { useState, useEffect, useRef } from "react";
import ChatInfo from "../../layouts/components/chatwindow/ChatInfo";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { useSelector, useDispatch } from "react-redux";
import { clearSelectedMessage } from "../../redux/slices/chatSlice";
import ChatHeader from "./ChatWindow/ChatHeader";
import MessageItem from "./ChatWindow/MessageItem";
import ChatFooter from "./ChatWindow/ChatFooter";
import TingTingImage from "../../assets/TingTing_Chat.png";
import axios from "axios";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ChatHeaderCloud from "./ChatWindow/ChatHeaderCloud"
import ChatFooterCloud from "./ChatWindow/ChatFooterCloud";

function ChatPage() {
  const [isChatInfoVisible, setIsChatInfoVisible] = useState(false);
  const [cloudMessages, setCloudMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null); // 👈 ref để scroll

  const cloudChat = {
    id: "my-cloud",
    name: "Cloud của tôi",
    avatar: "https://help.zalo.me/wp-content/uploads/2023/08/z4650065944256_2971e71cc06a5cfcb0aef41782e5f30e.jpg",
    type: "cloud",
    messages: cloudMessages,
  };

  const mockMessages = [
    cloudChat,
    {
      id: 1,
      name: "HMH và những người bạn",
      avatar: "https://picsum.photos/200",
      type: "group",
      members: 99,
      messages: [],
    },
    {
      id: 2,
      name: "Khánh",
      avatar: "https://picsum.photos/200",
      type: "personal",
      messages: [],
    },
  ];

  const dispatch = useDispatch();
  const selectedMessageId = useSelector((state) => state.chat.selectedMessage);
  const selectedChat = mockMessages.find((chat) => chat.id === selectedMessageId) || null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: vi });
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };

  const fetchCloudMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/messages/user/user123');
      const sortedMessages = response.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setCloudMessages(sortedMessages);
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn cloud:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (selectedMessageId === 'my-cloud') {
      fetchCloudMessages();
    }
  }, [selectedMessageId]);

  useEffect(() => {
    if (selectedMessageId === 'my-cloud') {
      scrollToBottom();
    }
  }, [cloudMessages]);

  const renderCloudMessage = (message) => {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-100 p-3 rounded-lg max-w-md relative min-w-64">
          {message.content && (
            <p className="text-sm text-gray-800 mb-4">{message.content}</p>
          )}

          {message.fileUrls && message.fileUrls.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.fileUrls.map((url, index) => {
                const filename = message.filenames?.[index] ||
                                url.split('/').pop() || 
                                "File đính kèm";
                const isImage = /\.(jpg|jpeg|png|gif)$/i.test(url);

                return (
                  <div key={index} className="flex items-center space-x-2">
                    {isImage ? (
                      <div className="flex items-center space-x-2">
                        <img
                          src={message.thumbnailUrls?.[index] || url}
                          alt={filename}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{filename}</p>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs">
                            Đã có trên Cloud
                          </a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-200 p-1 rounded">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{filename}</p>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs">
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

          <span className="text-xs text-gray-500 absolute right-2 bottom-2 ">
            {formatDate(message.timestamp)}
          </span>
        </div>
      </div>  
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="min-h-screen bg-gray-100 flex">
        {selectedChat ? (
          <div className={`flex w-full transition-all duration-300`}>
            <div className={`flex-1 transition-all duration-300 ${isChatInfoVisible ? "w-[calc(100%-400px)]" : "w-full"}`}>
              {selectedChat.type === 'cloud' ? (
                <ChatHeaderCloud
                  name={selectedChat.name}
                  avatar={selectedChat.avatar}
                />
              ) : (
                <ChatHeader
                  type={selectedChat.type}
                  name={selectedChat.name}
                  lastActive={6}
                  avatar={selectedChat.avatar}
                  isChatInfoVisible={isChatInfoVisible}
                  setIsChatInfoVisible={setIsChatInfoVisible}
                />
              )}
              
              {selectedChat.type === 'cloud' ? (
                <>
                  <div className="p-4 h-[calc(100vh-200px)] overflow-y-auto">
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
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  <ChatFooterCloud onReload={fetchCloudMessages} className="fixed bottom-0 left-0 w-full bg-white shadow-md" />
                </>
              ) : (
                <>
                  <div className="p-2 w-full h-[calc(100vh-200px)] overflow-y-auto">
                    {selectedChat.messages.map((msg, index) => (
                      <MessageItem key={index} msg={msg} />
                    ))}
                  </div>
                  <ChatFooter className="fixed bottom-0 left-0 w-full bg-white shadow-md" />
                </>
              )}
            </div>

            {isChatInfoVisible && selectedChat.type !== 'cloud' && (
              <div className="w-[400px] bg-white border-l p-2 max-h-screen transition-all duration-300">
                <ChatInfo />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-white">
            <h1 className="text-2xl font-bold justify-center">Chào mừng đến với TingTing PC!</h1>
            <p className="text-gray-600">
              Khám phá các tiện ích hỗ trợ làm việc và trò chuyện cùng người thân, bạn bè.
            </p>
            <img src={TingTingImage} alt="Welcome" className="mt-4 w-64 h-64 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
