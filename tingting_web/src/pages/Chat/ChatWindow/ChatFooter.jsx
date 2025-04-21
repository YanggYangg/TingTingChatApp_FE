import React, { useState, useRef } from "react";
import { FaPaperclip, FaSmile, FaRegImage, FaPaperPlane } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";

function ChatFooter({ sendMessage, replyingTo, setReplyingTo }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [uploading, setUploading] = useState(false); // 👈 Thêm state upload

  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);

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

  const handleAttachFile = (file, type) => {
    setAttachedFile({ file, type });
    setPreviewURL(URL.createObjectURL(file));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    handleAttachFile(file, type);
    e.target.value = null;
  };

  const uploadToS3 = async (file) => {
    setUploading(true); // 👈 Bắt đầu upload
    try {
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
      if (!res.ok) throw new Error("Upload failed");

      const data = JSON.parse(text);
      return data.linkURL;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    } finally {
      setUploading(false); // 👈 Kết thúc upload
    }
  };

  const handleSend = async () => {
    if (uploading || (!message.trim() && !attachedFile)) return;

    try {
      let fileURL = null;
      let messageType = "text";
      let content = message.trim();

      if (attachedFile) {
        fileURL = await uploadToS3(attachedFile.file);
        if (!fileURL) return;

        messageType = attachedFile.type;
        content = content || attachedFile.file.name || `[${messageType}]`;
      }

      if (replyingTo) {
        messageType = "reply";
      }

      const payload = {
        messageType,
        content,
        ...(fileURL && { linkURL: fileURL }),
        ...(replyingTo && {
          replyMessageId: replyingTo._id,
          replyMessageContent: replyingTo.content,
          replyMessageType: replyingTo.messageType,
          replyMessageSender: replyingTo.sender,
        }),
      };

      sendMessage(payload);

      setMessage("");
      setAttachedFile(null);
      setPreviewURL(null);
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="bg-white p-3 border-t border-gray-300 w-full relative">
      {showEmojiPicker && (
        <div className="absolute bottom-24 left-3 z-10 bg-white shadow-md rounded-lg border border-gray-200">
          <EmojiPicker
            onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)}
          />
        </div>
      )}

      {replyingTo && (
        <div className="flex items-center justify-between mb-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
          <div className="text-sm">
            <p className="font-medium text-gray-700">
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

      {attachedFile && (
        <div className="flex items-center justify-between mb-2 p-2 border border-gray-300 rounded-lg bg-gray-50 relative">
          <div className="flex items-center space-x-3 overflow-hidden">
            {attachedFile.type === "image" ? (
              <img
                src={previewURL}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-lg"
              />
            ) : attachedFile.type === "video" ? (
              <video
                src={previewURL}
                controls
                className="w-20 h-16 object-cover rounded-lg"
              />
            ) : (
              <div className="text-sm font-medium text-gray-700 truncate max-w-xs">
                📎 {attachedFile.file.name}
              </div>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-lg">
              <svg
                className="animate-spin h-6 w-6 text-blue-500"
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
            </div>
          )}
          {!uploading && (
            <button
              className="text-gray-400 hover:text-red-500 ml-2 z-10"
              onClick={() => {
                setAttachedFile(null);
                setPreviewURL(null);
              }}
            >
              <IoClose size={20} />
            </button>
          )}
        </div>
      )}

      <div className="flex space-x-4 mb-2">
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
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, "file")}
        hidden
      />
      <input
        type="file"
        accept="image/*,video/*"
        ref={mediaInputRef}
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const type = file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("video/")
            ? "video"
            : "file";
          handleFileChange(e, type);
        }}
        hidden
      />

      <div className="flex items-center space-x-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded-lg outline-none bg-white text-gray-700 border border-gray-300"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
