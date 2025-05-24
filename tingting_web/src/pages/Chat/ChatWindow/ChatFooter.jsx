import React, { useState, useRef, useEffect } from "react";
import { FaPaperclip, FaSmile, FaRegImage, FaPaperPlane } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";
import { useSocket } from "../../../contexts/SocketContext";

function ChatFooter({
  sendMessage,
  replyingTo,
  setReplyingTo,
  conversationId,
  className,
}) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { socket } = useSocket();
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const truncateMessage = (content, maxLength = 50) =>
    content?.length > maxLength
      ? content.slice(0, maxLength) + "..."
      : content || "[Tin nhắn trống]";

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (!socket || !conversationId) {
      console.warn("Cannot send typing: socket or conversationId missing", {
        socket,
        conversationId,
      });
      return;
    }

    if (!isTypingRef.current) {
      console.log("Sending typing for conversation:", conversationId);
      socket.emit("typing", { conversationId });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      console.log("Sending stopTyping for conversation:", conversationId);
      socket.emit("stopTyping", { conversationId });
      isTypingRef.current = false;
    }, 5000);
  };

  const handleAttachFiles = (files) => {
    const newFiles = Array.from(files).map((file) => ({
      file,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file",
      previewURL: URL.createObjectURL(file),
      name: file.name, // Lưu tên file gốc
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const uploadToS3 = async (file) => {
    const formData = new FormData();
    formData.append("media", file);
    const res = await fetch(
      "http://localhost:5000/messages/sendMessageWithMedia",
      {
        method: "POST",
        body: formData,
      }
    );
    const text = await res.text();
    if (!res.ok) throw new Error(`Upload failed: ${text}`);
    return JSON.parse(text).linkURL;
  };

 const handleSend = async () => {
  if (uploading || (!message.trim() && attachedFiles.length === 0)) return;
  setUploading(true);

  if (socket && conversationId && isTypingRef.current) {
    console.log("Sending stopTyping on message send:", conversationId);
    socket.emit("stopTyping", { conversationId });
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }

  try {
    let uploadedLinks = [];
    if (attachedFiles.length > 0) {
      const uploadPromises = attachedFiles.map((item) =>
        uploadToS3(item.file)
      );
      uploadedLinks = await Promise.all(uploadPromises);
    }

    // Hàm kiểm tra xem nội dung có phải là URL hợp lệ không
    const isValidURL = (str) => {
      const urlRegex = /^(https?:\/\/[^\s]+)/;
      return urlRegex.test(str.trim());
    };

    if (uploadedLinks.length > 0) {
      const firstType = attachedFiles[0]?.type || "image";
      const fileNames =
        attachedFiles.length === 1
          ? attachedFiles[0].name
          : attachedFiles.map((item) => item.name).join(", ");
      const payload = {
        messageType: firstType,
        content: message.trim() || fileNames,
        linkURL: uploadedLinks,
        ...(replyingTo && {
          messageType: "reply",
          replyMessageId: replyingTo._id,
          replyMessageContent: replyingTo.content,
          replyMessageType: replyingTo.messageType,
          replyMessageSender: replyingTo.sender,
        }),
      };
      console.log("ChatFooter: Sending file message", payload);
      sendMessage(payload);
    } else if (message.trim()) {
      // Kiểm tra xem message có phải là URL hay không
      const messageType = isValidURL(message) ? "link" : replyingTo ? "reply" : "text";
      const payload = {
        messageType,
        content: message.trim(),
        ...(messageType === "link" && { linkURL: message.trim() }),
        ...(replyingTo && {
          replyMessageId: replyingTo._id,
          replyMessageContent: replyingTo.content,
          replyMessageType: replyingTo.messageType,
          replyMessageSender: replyingTo.sender,
        }),
      };
      console.log(`ChatFooter: Sending ${messageType} message`, payload);
      sendMessage(payload);
    }

    setMessage("");
    setAttachedFiles([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);
  } catch (err) {
    console.error("Error sending message:", err);
  } finally {
    setUploading(false);
  }
};

  useEffect(() => {
    // Thu hồi các URL preview khi component unmount
    return () => {
      attachedFiles.forEach((item) => {
        if (item.previewURL) URL.revokeObjectURL(item.previewURL);
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && conversationId && isTypingRef.current) {
        socket.emit("stopTyping", { conversationId });
      }
    };
  }, [socket, conversationId, attachedFiles]);

  return (
    <div
      className={`bg-white p-4 border-t border-gray-200 w-full relative ${className}`}
    >
      {showEmojiPicker && (
        <div className="absolute bottom-28 left-4 z-20 bg-white shadow-xl rounded-lg border border-gray-200">
          <EmojiPicker
            onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)}
          />
        </div>
      )}
      {replyingTo && (
        <div className="flex items-center justify-between mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-sm">
            <p className="font-semibold text-gray-700">
              Đang trả lời {replyingTo.sender || "Unknown"}
            </p>
            <p className="text-gray-500">
              {truncateMessage(
                replyingTo.messageType === "text"
                  ? replyingTo.content
                  : `[${replyingTo.messageType}]`
              )}
            </p>
          </div>
          <button
            className="text-gray-400 hover:text-red-500 ml-2"
            onClick={() => setReplyingTo(null)}
          >
            <IoClose size={20} />
          </button>
        </div>
      )}
      {attachedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {attachedFiles.map((item, index) => (
            <div
              key={index}
              className="relative border border-gray-200 p-1 rounded-md bg-gray-50"
            >
              {item.type === "image" ? (
                <img
                  src={item.previewURL}
                  alt="Preview"
                  className="w-full h-24 object-cover rounded"
                />
              ) : item.type === "video" ? (
                <video
                  src={item.previewURL}
                  controls
                  className="w-full h-24 object-cover rounded"
                />
              ) : (
                <p className="text-sm truncate text-gray-600">
                  📎 {item.name}
                </p>
              )}
              {!uploading && (
                <button
                  onClick={() => {
                    setAttachedFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    );
                    URL.revokeObjectURL(item.previewURL);
                  }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 text-red-500 hover:text-red-700"
                >
                  <IoClose size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex space-x-4 mb-3">
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => fileInputRef.current.click()}
        >
          <FaPaperclip size={20} />
        </button>
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => mediaInputRef.current.click()}
        >
          <FaRegImage size={20} />
        </button>
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <FaSmile size={20} />
        </button>
      </div>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files.length) handleAttachFiles(e.target.files);
          e.target.value = null;
        }}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        ref={mediaInputRef}
        onChange={(e) => {
          if (e.target.files.length) handleAttachFiles(e.target.files);
          e.target.value = null;
        }}
        className="hidden"
      />
      <div className="flex items-center space-x-2">
        <input
          type="text"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyPress}
          disabled={uploading}
        />
        <button
          className={`p-2 ${
            uploading
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-500 hover:text-blue-700"
          }`}
          onClick={handleSend}
          disabled={uploading}
        >
          {uploading ? (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          ) : (
            <FaPaperPlane size={20} />
          )}
        </button>
      </div>
    </div>
  );
}

export default ChatFooter;