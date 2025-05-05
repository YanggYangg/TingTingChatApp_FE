import {
  IoReturnDownBack,
  IoArrowRedoOutline,
  IoTrashOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { AiFillFileText } from "react-icons/ai";
import { HiDownload } from "react-icons/hi";
import { MdCall, MdVideocam } from "react-icons/md";
import { useState } from "react";

const MessageItem = ({
  msg,
  currentUserId,
  onReply,
  onForward,
  onDelete,
  onRevoke,
  messages,
}) => {
  const isCurrentUser = msg.userId === currentUserId;
  const repliedMessage = messages?.find((m) => m._id === msg.replyMessageId);

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
  const isImage = msg.messageType === "image";
  const isVideo = msg.messageType === "video";
  const isFile = msg.messageType === "file";
  const isText = msg.messageType === "text";

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

  return (
    <>
      <div
        className={`flex ${
          isCurrentUser ? "justify-end" : "justify-start"
        } mb-4 relative`}
      >
        <div
          className={`p-3 rounded-lg w-fit max-w-xs relative ${
            isCurrentUser ? "bg-blue-200 text-black" : "bg-gray-200 text-black"
          } ${msg.isRevoked ? "" : "group"}`}
        >
          {!isCurrentUser && !msg.isRevoked && (
            <p className="text-xs font-semibold text-gray-700">{msg.sender}</p>
          )}

          {/* Nếu đã bị thu hồi thì chỉ hiển thị text */}
          {msg.isRevoked ? (
            <p className="italic text-gray-500">Tin nhắn đã được thu hồi</p>
          ) : (
            <>
              {/* Tin nhắn trả lời */}
              {msg.messageType === "reply" && (
                <div className="bg-gray-100 p-2 rounded-md mt-1 border-l-4 border-blue-400 pl-3">
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
                  <p className="text-sm text-gray-900 mt-1">{msg.content}</p>
                </div>
              )}

              {/* Tin nhắn cuộc gọi */}
              {msg.messageType === "call" && (
                <>
                  {/* {console.log("Rendering call message:", msg)} */}
                  {renderCallMessage()}
                </>
              )}

              {/* Tin nhắn văn bản không phải reply */}
              {msg.messageType === "text" && !msg.replyMessageId && (
                <p className="break-words">
                  {renderTextWithLinks(msg.content)}
                </p>
              )}

              {/* Tin nhắn hình ảnh (nhiều ảnh) */}
              {isImage && Array.isArray(msg.linkURL) && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {msg.linkURL.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Ảnh ${index + 1}`}
                      className="w-full h-auto rounded-lg cursor-pointer object-cover"
                      onClick={() => setOpenMedia(url)}
                    />
                  ))}
                  {msg.content && (
                    <p className="text-sm text-gray-800 mt-2">{msg.content}</p>
                  )}
                </div>
              )}

              {/* Tin nhắn hình ảnh (1 ảnh) */}
              {isImage && typeof msg.linkURL === "string" && (
                <>
                  <img
                    src={msg.linkURL}
                    className="w-40 h-auto rounded-lg cursor-pointer"
                    alt="Ảnh"
                    onClick={handleMediaClick}
                  />
                  {msg.content && (
                    <p className="text-sm text-gray-800 mt-2">{msg.content}</p>
                  )}
                </>
              )}

              {/* Tin nhắn video */}
              {isVideo && (
                <video
                  controls
                  className="w-40 h-auto rounded-lg cursor-pointer"
                  onClick={handleMediaClick}
                >
                  <source src={msg.linkURL} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              )}

              {/* Tin nhắn file */}
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

          {/* Thời gian */}
          <p className="text-xs text-gray-500 text-right mt-1">{msg.time}</p>

          {/* Nút hành động khi hover */}
          {!msg.isRevoked && (
            <div
              className={`absolute top-[-36px] ${
                isCurrentUser ? "right-0" : "left-0"
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
                    onClick={() => onRevoke(msg)}
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
