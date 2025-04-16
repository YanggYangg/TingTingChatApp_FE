import { useState, useEffect } from "react";
import {
  IoReturnDownBack,
  IoArrowRedoOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { AiFillFileText } from "react-icons/ai";
import { HiDownload } from "react-icons/hi";

const MessageItem = ({ msg, currentUserId, onReply, onForward, onRevoke }) => {
  const isCurrentUser = msg.userId === currentUserId;
  const [repliedMessage, setRepliedMessage] = useState(null);

  // Function to fetch replied message data
  const fetchRepliedMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`);
      if (!response.ok) throw new Error("Failed to fetch replied message");
      const data = await response.json();
      setRepliedMessage(data);
    } catch (error) {
      console.error("Error fetching replied message:", error);
      setRepliedMessage(null);
    }
  };

  // Fetch replied message when replyMessageId exists
  useEffect(() => {
    if (msg.replyMessageId) {
      fetchRepliedMessage(msg.replyMessageId);
    }
  }, [msg.replyMessageId]);

  console.log("MessageItem", msg, "RepliedMessage", repliedMessage);

  return (
    <div
      className={`flex ${
        isCurrentUser ? "justify-end" : "justify-start"
      } mb-4 relative`}
    >
      <div
        className={`p-3 rounded-lg w-fit max-w-xs relative group ${
          isCurrentUser ? "bg-blue-200 text-black" : "bg-gray-200 text-black"
        }`}
      >
        {!isCurrentUser && (
          <p className="text-xs font-semibold text-gray-700">{msg.sender}</p>
        )}

        {/* Display replied message content above for reply messages */}
        {msg.replyMessageId && repliedMessage && (
          <div className="mb-2 p-2 border-l-4 border-blue-400 bg-blue-100 rounded-sm text-sm">
            {repliedMessage.sender && (
              <p className="font-semibold text-blue-800">
                {repliedMessage.sender}
              </p>
            )}
            <p className="text-gray-700">
              {repliedMessage.messageType === "text" &&
                (repliedMessage.content || "No content")}
              {repliedMessage.messageType === "image" && "[Hình ảnh]"}
              {repliedMessage.messageType === "file" && "[Tệp đính kèm]"}
              {repliedMessage.messageType === "video" && "[Video]"}
              {!["text", "image", "file", "video"].includes(
                repliedMessage.messageType
              ) && (repliedMessage.content || "No content")}
            </p>
          </div>
        )}

        {/* Display current message content */}
        {(msg.messageType === "text" || msg.messageType === "reply") && (
          <p>{msg.content}</p>
        )}
        {msg.messageType === "image" && (
          <img src={msg.linkURL} className="w-40 h-auto rounded-lg" alt="Ảnh" />
        )}
        {msg.messageType === "file" && (
          <div className="flex items-center justify-between space-x-3 bg-white rounded-md p-2 shadow-sm">
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

        <p className="text-xs text-gray-500 text-right mt-1">{msg.time}</p>

        {/* Action buttons displayed on hover */}
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
            <button
              onClick={() => onRevoke(msg)}
              title="Thu hồi"
              className="p-1 rounded-full bg-white/80 hover:bg-red-100 transition-all shadow-md hover:scale-110 text-gray-600 hover:text-red-500"
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