import React, { useState, useEffect } from "react";
import { Phone, MessageCircle, Pin, BellOff, Bot } from "lucide-react"; // Nhi thêm: Thêm Pin, BellOff, Bot
import { Api_Profile } from "../../../apis/api_profile";
import { useNavigate } from "react-router-dom"; // File 1

const MessageItem = ({ message, userId, memberDetails, userCache, onMessageClick }) => {
  // Hàm lấy tên cuộc trò chuyện
  const getConversationName = (msg, memberDetails) => {
    if (msg?.customName) return msg.customName;
    if (msg?.isGroup) {
      return msg.name;
    } else if (msg?.participants) {
      const otherParticipant = msg.participants.find(
        (participant) => participant.userId !== userId
      );
      // Nhi thêm: Sử dụng userCache làm fallback
      return memberDetails?.[otherParticipant?.userId]?.name || 
             userCache?.[otherParticipant?.userId]?.name || 
             "Unknown";
    }
    return "Unknown Conversation";
  };

  // Hàm lấy avatar cuộc trò chuyện
  const getConversationAvatar = (msg, memberDetails) => {
    if (msg?.customAvatar) return msg.customAvatar;
    if (msg?.isGroup && msg.imageGroup) {
      return msg.imageGroup;
    } else if (msg?.participants) {
      const otherParticipant = msg.participants.find(
        (participant) => participant.userId !== userId
      );
      // Nhi thêm: Sử dụng userCache làm fallback
      return (
        memberDetails?.[otherParticipant?.userId]?.avatar ||
        userCache?.[otherParticipant?.userId]?.avatar ||
        "https://via.placeholder.com/150"
      );
    }
    return "https://via.placeholder.com/150";
  };

  // Nhi thêm: Lấy trạng thái ghim và tắt thông báo
  const isPinned = message.participants?.find(
    (p) => p.userId === userId
  )?.isPinned || false;
  const isMuted = message.participants?.find(
    (p) => p.userId === userId
  )?.mute || false;

  return (
    <div
      key={message.id}
      className="flex items-center justify-between p-2 rounded-lg transition hover:bg-[#dbebff] hover:text-black cursor-pointer"
      onClick={() => onMessageClick(message)}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={getConversationAvatar(
              message,
              memberDetails?.[message.id]?.memberDetails
            )}
            alt={getConversationName(
              message,
              memberDetails?.[message.id]?.memberDetails
            )}
            className="w-12 h-12 rounded-full object-cover"
          />
          {message.isGroup && message.participants?.length > 2 && (
            <span className="absolute -bottom-1 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {message.participants.length}
            </span>
          )}
        </div>
        <div className="w-40">
          <span className="font-semibold truncate">
            {getConversationName(
              message,
              memberDetails?.[message.id]?.memberDetails
            )}
          </span>
          <div className="text-sm text-gray-400 flex items-center space-x-1">
            {message.isCall ? (
              <>
                <Phone size={14} className="text-green-500" />
                <span>Cuộc gọi thoại {message.missed ? "bỏ lỡ" : "đến"}</span>
              </>
            ) : (
              <>
                <MessageCircle size={14} className="text-blue-500" />
                <span className="truncate">{message.lastMessage}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {/* Nhi thêm: Hiển thị biểu tượng ghim và tắt thông báo */}
        {isPinned && <Pin size={16} className="text-yellow-500" />}
        {isMuted && <BellOff size={16} className="text-gray-500" />}
        <div className="text-xs text-gray-400 whitespace-nowrap">
          {message.time}
        </div>
      </div>
    </div>
  );
};

const MessageList = ({ messages, onMessageClick, onPinConversation, userId, userCache }) => {
  console.log("MessageList received messages:", messages); // File 1
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const navigate = useNavigate(); // File 1

  useEffect(() => {
    const fetchMemberDetails = async () => {
      setLoadingDetails(true);
      setErrorDetails(null);
      const details = {};

      if (messages && Array.isArray(messages)) {
        const conversationDetailsPromises = messages.map(async (msg) => {
          if (msg?.isGroup && msg.participants) {
            const participantDetails = {};
            const fetchParticipantPromises = msg.participants.map(
              async (member) => {
                // Nhi thêm: Kiểm tra userCache trước khi gọi API
                if (userCache[member.userId]) {
                  participantDetails[member.userId] = userCache[member.userId];
                  return;
                }
                try {
                  const response = await Api_Profile.getProfile(member.userId);
                  if (response?.data?.user) {
                    participantDetails[member.userId] = {
                      name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
                      avatar: response.data.user.avatar,
                    };
                  } else {
                    participantDetails[member.userId] = {
                      name: "Không tìm thấy",
                      avatar: null,
                    };
                  }
                } catch (error) {
                  console.error("MessageList: Lỗi khi lấy thông tin người dùng:", error); // Nhi thêm
                  participantDetails[member.userId] = {
                    name: "Lỗi tải",
                    avatar: null,
                  };
                }
              }
            );
            await Promise.all(fetchParticipantPromises);
            details[msg.id] = { memberDetails: participantDetails };
          } else if (msg?.participants && msg.participants.length === 2) {
            const otherParticipant = msg.participants.find(
              (participant) => participant.userId !== userId
            );
            if (otherParticipant?.userId) {
              // Nhi thêm: Kiểm tra userCache trước khi gọi API
              if (userCache[otherParticipant.userId]) {
                details[msg.id] = {
                  memberDetails: {
                    [otherParticipant.userId]: userCache[otherParticipant.userId],
                  },
                };
                return;
              }
              try {
                const response = await Api_Profile.getProfile(
                  otherParticipant.userId
                );
                if (response?.data?.user) {
                  details[msg.id] = {
                    memberDetails: {
                      [otherParticipant.userId]: {
                        name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
                        avatar: response.data.user.avatar,
                      },
                    },
                  };
                } else {
                  details[msg.id] = {
                    memberDetails: {
                      [otherParticipant.userId]: {
                        name: "Không tìm thấy",
                        avatar: null,
                      },
                    },
                  };
                }
              } catch (error) {
                console.error("MessageList: Lỗi khi lấy thông tin người dùng:", error); // Nhi thêm
                details[msg.id] = {
                  memberDetails: {
                    [otherParticipant.userId]: {
                      name: "Lỗi tải",
                      avatar: null,
                    },
                  },
                };
              }
            } else {
              details[msg.id] = { memberDetails: {} };
            }
          } else {
            details[msg.id] = { memberDetails: {} };
          }
        });
        await Promise.all(conversationDetailsPromises);
        setMemberDetails(details);
      }
      setLoadingDetails(false);
    };

    fetchMemberDetails();
  }, [messages, userId, userCache]); // Nhi thêm: Thêm userCache vào dependencies

  return (
    <div className="w-full max-w-md mx-auto bg-white text-black p-2">
      {/* File 1: Comment loading indicator, giữ nguyên ý định */}
      {/* {loadingDetails && (
        <p className="text-center text-gray-500">Đang tải thông tin...</p>
      )} */}
      {errorDetails && (
        <p className="text-center text-red-500">{errorDetails}</p>
      )}
      {/* ChatGPT default conversation */}
      <div
        className="flex items-center justify-between p-2 rounded-lg transition hover:bg-[#dbebff] hover:text-black cursor-pointer"
        onClick={() => onMessageClick({
          id: 'chatgpt',
          name: 'ChatGPT',
          lastMessage: 'Xin chào! Tôi có thể giúp gì cho bạn?',
          time: 'Bây giờ',
          isGroup: false,
          participants: [{ userId: 'chatgpt' }]
        })}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg"
              alt="ChatGPT"
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>
          <div className="w-40">
            <span className="font-semibold truncate">ChatGPT</span>
            <div className="text-sm text-gray-400 flex items-center space-x-1">
              <Bot size={14} className="text-green-500" />
              <span className="truncate">Xin chào! Tôi có thể giúp gì cho bạn?</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap">
          Bây giờ
        </div>
      </div>

      {messages &&
        messages.map((msg, index) => {
          const customProps =
            index === 0
              ? {
                  customName: "Cloud của tôi",
                  customAvatar:
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
                }
              : {};

          return (
            <MessageItem
              key={msg.id}
              message={{ ...msg, ...customProps }}
              userId={userId}
              memberDetails={memberDetails}
              userCache={userCache}
              onMessageClick={onMessageClick}
            />
          );
        })}
    </div>
  );
};

export default MessageList;