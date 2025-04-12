import React, { useState, useRef } from 'react';
import axios from 'axios';
import { FaPaperclip, FaSmile, FaRegImage, FaPaperPlane } from "react-icons/fa";
import EmojiPicker from 'emoji-picker-react';

function ChatFooter({ onReload }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  const userId = 'user123'; // tạm hardcode

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      const res = await axios.post('http://localhost:3000/api/files/upload', {
        userId,
        content: message,
      });

      console.log("Sent message:", res.data);
      setMessage('');

      onReload && onReload(); // ✅ gọi lại sau khi gửi
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('content', '');

    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const res = await axios.post('http://localhost:3000/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Uploaded files:", res.data);

      onReload && onReload(); // ✅ gọi lại sau khi upload
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg flex flex-col items-center border-t border-gray-300 relative">
      {/* Nút chức năng */}
      <div className="flex justify-start w-full space-x-4 mb-2">
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => fileInputRef.current.click()}
        >
          <FaPaperclip size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileChange}
        />
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <FaSmile size={20} />
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-24 left-3 bg-white shadow-md rounded-lg border border-gray-200 z-50">
          <EmojiPicker onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)} />
        </div>
      )}

      {/* Input & Send */}
      <div className="flex w-full items-center space-x-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded-lg outline-none bg-white text-gray-700 border border-gray-300"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="p-2 text-blue-500 hover:text-blue-700" onClick={handleSendMessage}>
          <FaPaperPlane size={20} />
        </button>
      </div>
    </div>
  );
}

export default ChatFooter;
