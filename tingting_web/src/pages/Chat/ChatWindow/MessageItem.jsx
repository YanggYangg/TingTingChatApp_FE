import {
  IoReturnDownBack,
  IoArrowRedoOutline,
  IoTrashOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { AiFillFileText } from "react-icons/ai";
import { HiDownload } from "react-icons/hi";
import { MdCall, MdVideocam } from "react-icons/md";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileScreen from "../../../layouts/components/profile/ProfileScreen";

const MessageItem = ({
  msg,
  currentUserId,
  onReply,
  onForward,
  onDelete,
  onRevoke,
  messages,
  isLastMessage,
  participants,
  userCache,
  markMessageAsRead,
  highlightedMessageId,
}) => {
  // Nhi thêm: Kiểm tra nếu tin nhắn đã bị xóa bởi người dùng hiện tại
  if (msg.deletedBy?.includes(currentUserId)) {
    return null;
  }
  console.log("msg", msg)

  // Nhi thêm:  Kiểm tra nếu tin nhắn là media/file nhưng linkURL rỗng
  if (
    (msg.messageType === "image" || msg.messageType === "video" || msg.messageType === "file") &&
    (!msg.linkURL || (Array.isArray(msg.linkURL) && msg.linkURL.length === 0))
  ) {
    return null; // Không render tin nhắn nếu linkURL rỗng
  }
  console.log("userCache", userCache)
  const isCurrentUser = msg.userId === currentUserId;
  const repliedMessage = messages?.find((m) => m._id === msg.replyMessageId);
  const isHighlighted = msg._id === highlightedMessageId;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mở modal khi nhấn vào tên hoặc avatar
  const handleProfileClick = () => {
    if (!isCurrentUser && msg.userId) {
      setIsModalOpen(true);
    }
  };

  // Đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  // Add useEffect to mark message as read when it becomes visible
  useEffect(() => {
    if (msg && !isCurrentUser && markMessageAsRead) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && (!msg.status?.readBy || !msg.status.readBy.includes(currentUserId))) {
              markMessageAsRead(msg._id);
            }
          });
        },
        { threshold: 0.5 }
      );

      const messageElement = document.getElementById(`message-${msg._id}`);
      if (messageElement) {
        observer.observe(messageElement);
      }

      return () => {
        if (messageElement) {
          observer.unobserve(messageElement);
        }
      };
    }
  }, [msg, isCurrentUser, currentUserId, markMessageAsRead]);

  // Function to get message status text
  // const getMessageStatus = () => {
  //   if (!isCurrentUser || !isLastMessage) return null;

  //   // If no read status or empty readBy array
  //   if (!msg.status?.readBy || msg.status.readBy.length === 0) {
  //     return "Đã gửi";
  //   }

  //   // For group chat (more than 2 participants)
  //   if (participants && participants.length > 2) {
  //     // Get all other members (excluding current user)
  //     const otherMembers = participants.filter(p => p.userId !== currentUserId);
  //     const totalOtherMembers = otherMembers.length;

  //     // Check both object format (_id) and direct ID format
  //     const readMembers = msg.status.readBy.filter(user => {
  //       const userId = typeof user === 'object' ? user._id : user;
  //       return userId !== currentUserId;
  //     });

  //     if (readMembers.length === totalOtherMembers) {
  //       return "Tất cả đã xem";
  //     }

  //     // Get names of users who have read from userCache
  //     const readNames = readMembers.map(userId => {
  //       const cachedUser = userCache[userId];
  //       return cachedUser?.name || "Unknown";
  //     }).join(", ");

  //     return readNames ? `Đã xem: ${readNames}` : "Đã gửi";
  //   }

  //   // For personal chat (2 participants)
  //   const receiverId = participants?.find(p => p.userId !== currentUserId)?.userId;

  //   // Check both object format (_id) and direct ID format
  //   const isRead = msg.status.readBy.some(user => 
  //     (typeof user === 'object' && user._id === receiverId) || 
  //     (typeof user === 'string' && user === receiverId)
  //   );

  //   return isRead ? "Đã xem" : "Đã gửi";
  // };

  const handleRevokeClick = () => {
    if (onRevoke && msg && msg._id) {
      console.log("Revoking message with ID:", msg._id);
      onRevoke(msg);
    } else {
      console.error("Cannot revoke message: missing onRevoke or msg._id");
    }
  };

  const renderCallMessage = () => {
    const isVideoCall = msg.content.toLowerCase().includes("video");
    return (
      <div className="flex items-center space-x-2">
        {isVideoCall ? (
          <MdVideocam size={20} className="text-blue-500" />
        ) : (
          <MdCall size={20} className="text-green-500" />
        )}
        <p className="text-sm text-gray-700">{msg.content}</p>
      </div>
    );
  };
  const [openMedia, setOpenMedia] = useState(null);
  // Nhi thêm: Sử dụng các biến kiểm tra rõ ràng hơn
  const isImage = msg.messageType === "image";
  const isVideo = msg.messageType === "video";
  const isFile = msg.messageType === "file";
  const isCall = msg.messageType === "call";
  const isReply = msg.messageType === "reply";
  const isLink = msg.messageType === "link";
  const isText = msg.messageType === "text" && !msg.replyMessageId;

  const handleMediaClick = () => {
    if (isImage || isVideo) {
      setOpenMedia(msg.linkURL);
    }
  };

  const handleCloseMedia = () => {
    setOpenMedia(null);
  };
  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-words"
          >
            {part}
          </a>
        );
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  // Function to get message status text
  const getMessageStatus = () => {
    if (!isCurrentUser || !isLastMessage) return null;

    // If no read status or empty readBy array
    if (!msg.status?.readBy || msg.status.readBy.length === 0) {
      return "Đã gửi";
    }

    // For group chat (more than 2 participants)
    if (participants && participants.length > 2) {
      // Get all other members (excluding current user)
      const otherMembers = participants.filter(p => p.userId !== currentUserId);
      const totalOtherMembers = otherMembers.length;

      // Check both object format (_id) and direct ID format
      const readMembers = msg.status.readBy.filter(user => {
        const userId = typeof user === 'object' ? user._id : user;
        return userId !== currentUserId;
      });

      if (readMembers.length === totalOtherMembers) {
        return "Tất cả đã xem";
      }

      // Get names of users who have read from userCache
      const readNames = readMembers.map(userId => {
        const cachedUser = userCache[userId];
        return cachedUser?.name || "Unknown";
      }).join(", ");

      return readNames ? `Đã xem: ${readNames}` : "Đã gửi";
    }

    // For personal chat (2 participants)
    const receiverId = participants?.find(p => p.userId !== currentUserId)?.userId;

    // Check both object format (_id) and direct ID format
    const isRead = msg.status.readBy.some(user =>
      (typeof user === 'object' && user._id === receiverId) ||
      (typeof user === 'string' && user === receiverId)
    );

    return isRead ? "Đã xem" : "Đã gửi";
  };

  // Add useEffect to mark message as read when it becomes visible
  useEffect(() => {
    if (msg && !isCurrentUser && markMessageAsRead) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && (!msg.status?.readBy || !msg.status.readBy.includes(currentUserId))) {
              markMessageAsRead(msg._id);
            }
          });
        },
        { threshold: 0.5 }
      );

      const messageElement = document.getElementById(`message-${msg._id}`);
      if (messageElement) {
        observer.observe(messageElement);
      }

      return () => {
        if (messageElement) {
          observer.unobserve(messageElement);
        }
      };
    }
  }, [msg, isCurrentUser, currentUserId, markMessageAsRead]);

  return (
    <>
      <div
        id={`message-${msg._id}`} // Đảm bảo có ID để cuộn đến
        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mt-10 ${isHighlighted ? "highlighted" : ""
          }`}
      >
        {!isCurrentUser && !msg.isRevoked && (
          <div className="mr-2">
            {userCache[msg.userId]?.avatar && (
              <img
                src={userCache[msg.userId].avatar}
                alt={msg.sender}
                className="w-8 h-8 rounded-full cursor-pointer"
                onClick={handleProfileClick}
              />
            )}
          </div>
        )}
        <div
          className={`p-3 rounded-lg max-w-xs relative ${isCurrentUser
              ? "bg-blue-200 text-black ml-auto"
              : "bg-gray-200 text-black"
            } ${msg.isRevoked ? "" : "group"}`}
        >
          {!isCurrentUser && !msg.isRevoked && (
            <p
              className="text-xs font-semibold text-gray-700 mb-1 cursor-pointer"
              onClick={handleProfileClick}
            >
              {msg.sender}
            </p>
          )}
          {msg.isRevoked ? (
            <p className="italic text-gray-500">Tin nhắn đã được thu hồi</p>
          ) : (
            <>
              {msg.messageType === "reply" && (
                <div className="bg-gray-100 p-2 rounded-md mb-1 border-l-4 border-blue-400 pl-3">
                  <p className="text-sm text-gray-700 font-semibold">
                    {repliedMessage?.sender || ""}
                  </p>
                  <p className="text-sm text-gray-600 italic line-clamp-2">
                    {repliedMessage?.messageType === "image"
                      ? "[Ảnh]"
                      : repliedMessage?.messageType === "file"
                        ? "[Tệp]"
                        : repliedMessage?.messageType === "call"
                          ? "[Cuộc gọi]"
                          : repliedMessage?.content || "[Tin nhắn đã bị xóa]"}
                  </p>
                  <p className="text-sm text-gray-900">{msg.content}</p>
                </div>
              )}

              {msg.messageType === "call" && renderCallMessage()}

              {isText && (
                <p className="break-words">{renderTextWithLinks(msg.content)}</p>
              )}

              {isLink && (
                <a
                  href={msg.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-words"
                >
                  {msg.content}
                </a>
              )}

             {isImage && (
  <>
    {Array.isArray(msg.linkURL) && msg.linkURL.length > 1 ? (
      <div
        className={`grid gap-2 ${
          msg.linkURL.length === 2
            ? 'grid-cols-2'
            : msg.linkURL.length >= 3
            ? 'grid-cols-3'
            : ''
        }`}
      >
        {msg.linkURL.map((url, index) =>
          url ? (
            <div key={index} className="w-auto h-auto">
              <img
                src={url}
                alt={`Ảnh ${index + 1}`}
                className="w-full h-full rounded-lg cursor-pointer object-cover"
                onClick={() => setOpenMedia(url)}
              />
            </div>
          ) : null
        )}
      </div>
    ) : (
      <div className="relative">
        <img
          src={Array.isArray(msg.linkURL) ? msg.linkURL[0] : msg.linkURL}
          className="w-[200px] rounded-lg cursor-pointer object-contain bg-gray-100"
          alt="Ảnh"
          onClick={handleMediaClick}
        />
      </div>
    )}
  </>
)}


              {isVideo && (
                <video
                  controls
                  className="w-40 h-auto rounded-lg cursor-pointer mt-1"
                  onClick={handleMediaClick}
                >
                  <source src={msg.linkURL} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              )}

              {isFile && (
                <div className="flex items-center justify-between space-x-3 bg-white rounded-md p-2 shadow-sm mt-1">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <AiFillFileText size={24} className="text-blue-500" />
                    <p className="text-sm text-gray-700 truncate max-w-[150px]">
                      {msg.content || "Tệp đính kèm"}
                    </p>
                  </div>
                  <a
                    href={msg.linkURL}
                    download
                    title="Tải xuống"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <HiDownload size={20} />
                  </a>
                </div>
              )}
            </>
          )}

          <p className="text-xs text-gray-500 text-right mt-1">{msg.time}</p>

          {isCurrentUser && isLastMessage && (
            <div className="absolute -bottom-5 right-2">
              {participants && participants.length > 2 && msg.status?.readBy?.length > 0 ? (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {Array.from(new Set(msg.status.readBy
                    .filter((user) => {
                      const userId = typeof user === "object" ? user._id : user;
                      return userId !== currentUserId;
                    })
                    .map((userId) => userCache[userId]?.name || "Unknown")))
                    .join(", ")}{" "}
                  đã xem
                </span>
              ) : (
                <span className="text-xs text-gray-500">{getMessageStatus()}</span>
              )}
            </div>
          )}

          {!msg.isRevoked && (
            <div
              className={`absolute top-[-36px] ${isCurrentUser ? "right-0" : "left-0"
                } flex space-x-2 opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity duration-200`}
            >
              <button
                onClick={() => onReply(msg)}
                title="Trả lời"
                className="p-1 rounded-full bg-white/80 hover:bg-blue-100 transition-all shadow-md hover:scale-110 text-gray-600 hover:text-blue-600"
              >
                <IoReturnDownBack size={18} />
              </button>
              <button
                onClick={() => onForward(msg)}
                title="Chuyển tiếp"
                className="p-1 rounded-full bg-white/80 hover:bg-green-100 transition-all shadow-md hover:scale-110 text-gray-600 hover:text-green-600"
              >
                <IoArrowRedoOutline size={18} />
              </button>
              {isCurrentUser && (
                <>
                  <button
                    onClick={() => onDelete(msg)}
                    title="Xóa"
                    className="p-1 rounded-full bg-white/80 hover:bg-red-100 transition-all shadow-md hover:scale-110 text-gray-600 hover:text-red-500"
                  >
                    <IoTrashOutline size={18} />
                  </button>
                  <button
                    onClick={handleRevokeClick}
                    title="Thu hồi"
                    className="p-1 rounded-full bg-white/80 hover:bg-purple-100 transition-all shadow-md hover:scale-110 text-gray-600 hover:text-purple-500"
                  >
                    <IoRefreshOutline size={18} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Hiển thị modal khi isModalOpen là true */}
      {isModalOpen && (
        <ProfileScreen userId={msg.userId} onClose={handleCloseModal} />
      )}
      {/* Modal xem ảnh/video */}
      {openMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <button
            onClick={handleCloseMedia}
            className="absolute top-4 right-4 text-white text-3xl font-bold bg-black/60 rounded-full px-3 py-1 hover:bg-red-500 transition z-50"
            title="Đóng"
          >
            ×
          </button>

          <div className="relative max-w-[90%] max-h-[90%] flex items-center justify-center">
            {typeof openMedia === "string" &&
              /\.(mp4|mov|avi|mkv)$/i.test(openMedia) ? (
              <video
                controls
                autoPlay
                className="max-w-[600px] max-h-[80vh] object-contain rounded-lg z-10"
              >
                <source
                  src={openMedia}
                  type={`video/${openMedia.split(".").pop()}`}
                />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            ) : (
              <img
                src={openMedia}
                alt="Media"
                className="max-w-[600px] max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MessageItem;