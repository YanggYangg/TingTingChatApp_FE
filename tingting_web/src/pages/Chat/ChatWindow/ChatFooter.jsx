import React, { useState } from "react";
import {
  FaPaperclip,
  FaSmile,
  FaMicrophone,
  FaRegImage,
  FaPaperPlane,
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";

function ChatFooter({ sendMessage }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Fix typo here

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage({
        messageType: "text",
        content: message,
      });
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white p-3 rounded-lg flex flex-col items-center border-t border-gray-300 relative">
      <div className="flex justify-start w-full space-x-4 mb-2">
        <button className="p-2 text-gray-500 hover:text-gray-700">
          <FaPaperclip size={20} />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-700">
          <FaRegImage size={20} />
        </button>
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <FaSmile size={20} />
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-3 z-10 bg-white shadow-md rounded-lg border border-gray-200">
          <EmojiPicker
            onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)}
          />
        </div>
      )}

      <div className="flex w-full items-center">
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
          onClick={handleSendMessage}
        >
          <FaPaperPlane size={20} />
        </button>
      </div>
    </div>
  );
}

export default ChatFooter;
