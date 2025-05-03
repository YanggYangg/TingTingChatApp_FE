import React, { useState, useEffect } from "react";
import { Phone, MessageCircle, Pin, BellOff } from "lucide-react";
import { Api_Profile } from "../../../apis/api_profile";

const MessageList = ({ messages, onMessageClick, onPinConversation, userId, userCache }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  // Hàm lấy tên cuộc trò chuyện
  const getConversationName = (msg, memberDetails) => {
    if (msg?.customName) return msg.customName;
    if (msg?.isGroup) {
      return msg.name;
    } else if (msg?.participants) {
      const otherParticipant = msg.participants.find(
        (participant) => participant.userId !== userId
      );
      return memberDetails?.[otherParticipant?.userId]?.name || userCache?.[otherParticipant?.userId]?.name || "Unknown";
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
      return (
        memberDetails?.[otherParticipant?.userId]?.avatar ||
        userCache?.[otherParticipant?.userId]?.avatar ||
        "https://via.placeholder.com/150"
      );
    }
    return "https://via.placeholder.com/150";
  };

  // Lấy thông tin thành viên
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
                  console.error("MessageList: Lỗi khi lấy thông tin người dùng:", error);
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
                console.error("MessageList: Lỗi khi lấy thông tin người dùng:", error);
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
  }, [messages, userId, userCache]);

  return (
    <div className="w-full max-w-md mx-auto bg-white text-black p-2">
      {/* {loadingDetails && (
        <p className="text-center text-gray-500">Đang tải thông tin...</p>
      )} */}
      {errorDetails && (
        <p className="text-center text-red-500">{errorDetails}</p>
      )}
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

          const isPinned = msg.participants?.find(
            (p) => p.userId === userId
          )?.isPinned || false;
          const isMuted = msg.participants?.find(
            (p) => p.userId === userId
          )?.mute || false;

          return (
            <div
              key={msg.id}
              className="flex items-center justify-between p-2 rounded-lg transition hover:bg-[#dbebff] hover:text-black cursor-pointer"
              onClick={() => onMessageClick(msg)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={getConversationAvatar(
                      { ...msg, ...customProps },
                      memberDetails?.[msg.id]?.memberDetails
                    )}
                    alt={getConversationName(
                      { ...msg, ...customProps },
                      memberDetails?.[msg.id]?.memberDetails
                    )}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {msg.isGroup && msg.participants?.length > 2 && (
                    <span className="absolute -bottom-1 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {msg.participants.length}
                    </span>
                  )}
                </div>
                <div className="w-40">
                  <span className="font-semibold truncate">
                    {getConversationName(
                      { ...msg, ...customProps },
                      memberDetails?.[msg.id]?.memberDetails
                    )}
                  </span>
                  <div className="text-sm text-gray-400 flex items-center space-x-1">
                    {msg.isCall ? (
                      <>
                        <Phone size={14} className="text-green-500" />
                        <span>
                          Cuộc gọi thoại {msg.missed ? "bỏ lỡ" : "đến"}
                        </span>
                      </>
                    ) : (
                      <>
                        <MessageCircle size={14} className="text-blue-500" />
                        <span className="truncate">{msg.lastMessage}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isPinned && <Pin size={16} className="text-yellow-500" />}
                {isMuted && <BellOff size={16} className="text-gray-500" />}
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default MessageList;