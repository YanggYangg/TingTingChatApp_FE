import React from "react";
import { Phone, MessageCircle } from "lucide-react";

const MessageList = ({ messages, onMessageClick }) => {
  console.log("MessageList received messages:", messages);

  return (
    <div className="w-full max-w-md mx-auto bg-white text-black p-2">
      {messages.map((msg, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 rounded-lg transition hover:bg-[#dbebff] hover:text-black cursor-pointer"
          onClick={() => onMessageClick(msg)} // Gọi hàm khi bấm vào tin nhắn
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={msg.avatar}
                alt={msg.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {msg.type === "group" && (
                <span className="absolute -bottom-1 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {msg.members}+
                </span>
              )}
            </div>
            <div className="w-40">
              <div className="font-semibold truncate">{msg.name}</div>
              <div className="text-sm text-gray-400 flex items-center space-x-1">
                {msg.isCall ? (
                  <>
                    <Phone size={14} className="text-green-500" />
                    <span>Cuộc gọi thoại {msg.missed ? "bỏ lỡ" : "đến"}</span>
                  </>
                ) : (
                  <>
                    <MessageCircle size={14} className="text-blue-500" />
                    <span className="truncate">{msg.lastMessage}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400 whitespace-nowrap">
            {msg.time}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
