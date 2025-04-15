import React from "react";
import {
  IoReturnDownBack,
  IoArrowRedoOutline,
  IoTrashOutline,
} from "react-icons/io5";

const MessageItem = ({ msg, currentUserId, setReplyingTo }) => {
  const isCurrentUser = msg.userId === currentUserId;

  const renderMessageContent = () => {
    switch (msg.messageType) {
      case "text":
        return <p>{msg.content || "[Tin nhắn trống]"}</p>;
      case "image":
        return msg.linkURL ? (
          <img
            src={msg.linkURL}
            alt="Sent image"
            className="w-40 h-auto rounded-lg"
          />
        ) : (
          <p className="text-gray-500">[Hình ảnh không khả dụng]</p>
        );
      case "file":
        return msg.linkURL ? (
          <a
            href={msg.linkURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline flex items-center"
          >
            📎 {msg.content || "Tệp không tên"}
          </a>
        ) : (
          <p className="text-gray-500">[Tệp không khả dụng]</p>
        );
      case "video":
        return msg.linkURL ? (
          <video
            src={msg.linkURL}
            controls
            className="w-40 h-auto rounded-lg"
          />
        ) : (
          <p className="text-gray-500">[Video không khả dụng]</p>
        );
      case "call":
        return (
          <p className="text-red-500">
            {msg.content?.includes("missed")
              ? "Cuộc gọi nhỡ"
              : `📞 Cuộc gọi ${msg.content || "không rõ thời lượng"} `}
          </p>
        );
      default:
        return <p className="text-gray-500">[Loại tin nhắn không hỗ trợ]</p>;
    }
  };

  // Hiển thị tin nhắn trả lời (nếu có)
  const renderReplyContent = () => {
    if (!msg.replyTo) return null;
    const repliedMessage = msg.replyTo; // Giả sử server trả về thông tin tin nhắn gốc
    return (
      <div className="border-l-4 border-blue-500 pl-2 mb-2 bg-gray-100 rounded-r-lg">
        <p className="text-xs font-semibold text-gray-700">
          {repliedMessage.sender || "Unknown"}
        </p>
        <p className="text-xs text-gray-600">
          {repliedMessage.messageType === "text"
            ? repliedMessage.content?.substring(0, 50) +
              (repliedMessage.content?.length > 50 ? "..." : "")
            : `[${repliedMessage.messageType}]`}
        </p>
      </div>
    );
  };

  const handleReply = () => {
    setReplyingTo(msg); // Lưu tin nhắn đang trả lời
  };

  const handleForward = () => {
    console.log("Forward message:", msg._id);
  };

  const handleRevoke = () => {
    console.log("Revoke message:", msg._id);
  };

  return (
    <div
      className={`flex ${
        isCurrentUser ? "justify-end" : "justify-start"
      } mb-4 group relative hover:bg-gray-100/50 transition-colors duration-150`}
    >
      <div
        className={`p-3 rounded-lg w-fit max-w-xs relative ${
          isCurrentUser ? "bg-blue-200 text-black" : "bg-gray-200 text-black"
        }`}
      >
        {!isCurrentUser && (
          <p className="text-xs font-semibold text-gray-700">{msg.sender}</p>
        )}
        {renderReplyContent()}
        {renderMessageContent()}
        <p className="text-xs text-gray-500 text-right mt-1">{msg.time}</p>

        {/* Action buttons on hover */}
        <div
          className={`absolute top-[-30px] ${
            isCurrentUser ? "right-0" : "left-0"
          } flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out`}
        >
          <button
            className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
            onClick={handleReply}
            title="Trả lời"
          >
            <IoReturnDownBack size={18} />
          </button>
          <button
            className="text-gray-500 hover:text-green-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
            onClick={handleForward}
            title="Chuyển tiếp"
          >
            <IoArrowRedoOutline size={18} />
          </button>
          {isCurrentUser && (
            <button
              className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-gray-200 transition-colors"
              onClick={handleRevoke}
              title="Thu hồi"
            >
              <IoTrashOutline size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
