import React from "react";

const MessageItem = ({ msg, currentUserId }) => {
  const isCurrentUser = msg.userId === currentUserId; // Sử dụng currentUserId thực tế

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
              : `📞 Cuộc gọi ${msg.content || "không rõ thời lượng"}`}
          </p>
        );
      default:
        return <p className="text-gray-500">[Loại tin nhắn không hỗ trợ]</p>;
    }
  };

  return (
    <div
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`p-3 rounded-lg w-fit max-w-xs ${
          isCurrentUser ? "bg-blue-200 text-black" : "bg-gray-200 text-black"
        }`}
      >
        {!isCurrentUser && (
          <p className="text-xs font-semibold text-gray-700">{msg.sender}</p>
        )}
        {renderMessageContent()}
        <p className="text-xs text-gray-500 text-right mt-1">{msg.time}</p>
      </div>
    </div>
  );
};

export default MessageItem;
