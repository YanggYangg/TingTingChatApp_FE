import React, { useState, useEffect } from "react";
import { Phone, MessageCircle, Pin, BellOff } from "lucide-react";
import { Api_Profile } from "../../../apis/api_profile";

const MessageList = ({ messages, onMessageClick, userId }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  // Hàm lấy tên conversation
  const getConversationName = (msg, memberDetails) => {
    if (msg?.customName) return msg.customName;
    if (msg?.isGroup) {
      return msg.name;
    } else if (msg?.participants) {
      const otherParticipant = msg.participants.find(
        (participant) => participant.userId !== userId
      );
      return memberDetails?.[otherParticipant?.userId]?.name || "Unknown";
    }
    return "Unknown Conversation";
  };

  // Hàm lấy avatar conversation
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
                  console.error("Lỗi khi lấy thông tin người dùng:", error);
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
                console.error("Lỗi khi lấy thông tin người dùng:", error);
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
  }, [messages, userId]);

  return (
    <div className="w-full max-w-md mx-auto bg-white text-black p-2">
      {loadingDetails && (
        <p className="text-center text-gray-500">Đang tải thông tin...</p>
      )}
      {errorDetails && (
        <p className="text-center text-red-500">{errorDetails}</p>
      )}
      {messages &&
        messages.map((msg, index) => {
          // Gán custom props cho "Cloud của tôi"
          const customProps =
            index === 0
              ? {
                  customName: "Cloud của tôi",
                  customAvatar:
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
                }
              : {};

          // Kiểm tra trạng thái pin và mute
          const isPinned = msg.participants?.find(
            (p) => p.userId === userId
          )?.isPinned;
          const isMuted = msg.participants?.find(
            (p) => p.userId === userId
          )?.mute;

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
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold truncate">
                      {getConversationName(
                        { ...msg, ...customProps },
                        memberDetails?.[msg.id]?.memberDetails
                      )}
                    </span>
                    {isPinned && <Pin size={14} className="text-yellow-500" />}
                    {isMuted && <BellOff size={14} className="text-gray-500" />}
                  </div>
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
              <div className="text-xs text-gray-400 whitespace-nowrap">
                {msg.time}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default MessageList;