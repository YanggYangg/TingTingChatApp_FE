import React, { useState, useEffect } from "react";
import { Phone, MessageCircle, BellOff, Pin } from "lucide-react";
import { Api_Profile } from "../../../apis/api_profile";
import { useSocket } from "../../contexts/SocketContext";

// Component MessageItem
const MessageItem = ({ message, userId, memberDetails, onMessageClick, isSelected }) => {
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

  const participant = message.participants?.find((p) => p.userId === userId);
  const isMuted = !!participant?.mute;
  const isPinned = !!participant?.isPinned;

  return (
    <div
      key={message.id}
      className={`flex items-center justify-between p-2 rounded-lg transition cursor-pointer ${
        isSelected ? "bg-[#dbebff] text-black" : "hover:bg-[#dbebff] hover:text-black"
      }`}
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
          <div className="font-semibold truncate">
            {getConversationName(
              message,
              memberDetails?.[message.id]?.memberDetails
            )}
          </div>
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
      <div className="flex flex-col items-end">
        <div className="text-xs text-gray-400 whitespace-nowrap flex items-center space-x-1">
          <span>{message.time}</span>
          {isMuted && <BellOff size={12} className="text-gray-400" />}
          {isPinned && <Pin size={14} className="text-gray-400 mt-1" />}
        </div>
      </div>
    </div>
  );
};

// Component MessageList
const MessageList = ({ messages, onMessageClick, userId, selectedMessage }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatedMessages, setUpdatedMessages] = useState(messages);
  const { socket } = useSocket();

  // Cập nhật updatedMessages khi messages prop thay đổi
  useEffect(() => {
    setUpdatedMessages(messages);
  }, [messages]);

  // Lắng nghe sự kiện Socket.IO để cập nhật messages
  useEffect(() => {
    if (!socket) return;

    socket.on("chatInfoUpdated", (updatedChatInfo) => {
      setUpdatedMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === updatedChatInfo.conversationId) {
            return {
              ...msg,
              name: updatedChatInfo.name || msg.name,
              imageGroup: updatedChatInfo.imageGroup || msg.imageGroup,
              participants: updatedChatInfo.participants || msg.participants,
            };
          }
          return msg;
        })
      );
    });

    // Cleanup
    return () => {
      socket.off("chatInfoUpdated");
    };
  }, [socket]);

  // Fetch thông tin thành viên
  useEffect(() => {
    const fetchMemberDetails = async () => {
      setLoadingDetails(true);
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
                    name: "Không tìm thấy",
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

  if (loadingDetails) {
    return <div className="text-center p-4">Đang tải thông tin...</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white text-black p-2">
      {updatedMessages &&
        updatedMessages.map((msg, index) => {
          const customProps =
            index === 0
              ? {
                  customName: "Cloud của tôi",
                  customAvatar:
                    "https://encrypted-tbn0.gstatic.com/images?q=tbngcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
                }
              : {};

          return (
            <MessageItem
              key={msg.id}
              message={{ ...msg, ...customProps }}
              userId={userId}
              memberDetails={memberDetails}
              onMessageClick={onMessageClick}
              isSelected={selectedMessage?.id === msg.id}
            />
          );
        })}
    </div>
  );
};

export default MessageList;