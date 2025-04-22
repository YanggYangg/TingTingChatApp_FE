import React, { useState, useRef } from "react";
import { FaPaperclip, FaSmile, FaRegImage, FaPaperPlane } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";

function ChatFooter({ sendMessage, replyingTo, setReplyingTo }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

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

  const handleAttachFiles = (files) => {
    const newFiles = Array.from(files).map((file) => ({
      file,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "file",
      previewURL: URL.createObjectURL(file),
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
    if (!res.ok) throw new Error("Upload failed");
    return JSON.parse(text).linkURL;
  };

  const handleSend = async () => {
    if (uploading || (!message.trim() && attachedFiles.length === 0)) return;

    setUploading(true);

    try {
      let uploadedLinks = [];

      // Nếu có file đính kèm thì upload tất cả lên S3
      if (attachedFiles.length > 0) {
        const uploadPromises = attachedFiles.map((item) =>
          uploadToS3(item.file)
        );
        uploadedLinks = await Promise.all(uploadPromises);
      }

      // Nếu có file (ảnh/video/file)
      if (uploadedLinks.length > 0) {
        const firstType = attachedFiles[0]?.type || "image"; // Ưu tiên dùng loại đầu tiên

        const payload = {
          messageType: firstType, // Có thể là "image", "video", "file"
          content: message || null,
          linkURL: uploadedLinks,
          ...(replyingTo && {
            messageType: "reply",
            replyMessageId: replyingTo._id,
            replyMessageContent: replyingTo.content,
            replyMessageType: replyingTo.messageType,
            replyMessageSender: replyingTo.sender,
          }),
        };

        sendMessage(payload);
      } else if (message.trim()) {
        // Nếu chỉ gửi văn bản
        const payload = {
          messageType: replyingTo ? "reply" : "text",
          content: message.trim(),
          ...(replyingTo && {
            replyMessageId: replyingTo._id,
            replyMessageContent: replyingTo.content,
            replyMessageType: replyingTo.messageType,
            replyMessageSender: replyingTo.sender,
          }),
        };

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

      {/* Preview các file đính kèm */}
      {attachedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {attachedFiles.map((item, index) => (
            <div
              key={index}
              className="relative border p-1 rounded-md bg-gray-100"
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
                <p className="text-sm truncate">📎 {item.file.name}</p>
              )}
              {!uploading && (
                <button
                  onClick={() => {
                    setAttachedFiles((prev) =>
                      prev.filter((_, i) => i !== index)
                    );
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
        multiple
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files.length) handleAttachFiles(e.target.files);
          e.target.value = null;
        }}
        hidden
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
