import React, { useState, useRef } from "react";
import { FaPaperclip, FaSmile, FaRegImage, FaPaperPlane } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";

function ChatFooter({ sendMessage, replyingTo, setReplyingTo }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);

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

  //Hàm upload file lên s3
  const uploadToS3 = async (file) => {
    const formData = new FormData();
    formData.append("media", file);

    const res = await fetch("http://localhost:5000/messages/sendMessageWithMedia", {
      method: "POST",
      body: formData,
    });
    const text = await res.text();//log thô dl trả về
    console.log("Raw response text:", text);

    if (!res.ok) {
      console.log("Upload failed with status:", res.status);
      throw new Error("Failed to upload file");
  }

    // const data = await res.json();
    // return data.linkURL; //Backend trả về URL S3  
    try {
      const data = JSON.parse(text);  // Chắc chắn là JSON hợp lệ
      return data.linkURL;
  } catch (err) {
      console.error("JSON parse failed:", err);
      throw new Error("Invalid JSON response from server");
  }
  };

  const handleSend = async () => {
    if (!message.trim() && !attachedFile) return;
  
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
  
      // 👉 Nếu đang reply thì gán messageType = "reply"
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
          replyMessageSender: replyingTo.sender, // optional
        }),
      };
  
      console.log("Payload gửi đi: ", payload);
      sendMessage(payload);
  
      // Reset UI
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
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-24 left-3 z-10 bg-white shadow-md rounded-lg border border-gray-200">
          <EmojiPicker
            onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)}
          />
        </div>
      )}

      {/* Reply preview */}
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

      {/* File preview */}
      {attachedFile && (
        <div className="flex items-center justify-between mb-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
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
          <button
            className="text-gray-400 hover:text-red-500 ml-2"
            onClick={() => {
              setAttachedFile(null);
              setPreviewURL(null);
            }}
          >
            <IoClose size={20} />
          </button>
        </div>
      )}

      {/* Toolbar */}
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

      {/* Hidden inputs */}
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

      {/* Message input */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded-lg outline-none bg-white text-gray-700 border border-gray-300"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          className="p-2 text-blue-500 hover:text-blue-700"
          onClick={handleSend}
        >
          <FaPaperPlane size={20} />
        </button>
      </div>
    </div>
  );
}

export default ChatFooter;
