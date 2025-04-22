import React, { useState } from "react";
import {
  PanelRight,
  Search,
  Video,
  UserPlus,
  User,
  PhoneCall,
  Phone,
} from "lucide-react";

import { useCallManager } from "../../../contexts/CallManagerContext";

const ChatHeader = ({
  type,
  name,
  members,
  lastActive,
  avatar,
  isChatInfoVisible,
  setIsChatInfoVisible,
  conversationId,
  userId,
  receiverId,
}) => {
  const { initiateCall } = useCallManager();

  const handleCall = (type) => {
    if (!conversationId || !userId || !receiverId) {
      console.error("Missing required call parameters", {
        conversationId,
        userId,
        receiverId,
      });
      return;
    }

    initiateCall({
      conversationId,
      callerId: userId,
      receiverId,
      callType: type,
    });
  };

  return (
    <div className="flex items-center justify-between p-2 border-b bg-white">
      <div className="flex items-center">
        <img
          src={avatar}
          alt="Avatar"
          className="w-12 h-12 rounded-full mr-4"
        />
        <div>
          <h2 className="text-lg font-bold">{name}</h2>
          {type === "group" ? (
            <p className="flex text-x text-gray-500">
              <User size={20} />
              {members} thành viên
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Truy cập {lastActive} phút trước
            </p>
          )}
        </div>
      </div>

      <div className="ml-auto flex space-x-3">
        <button className="text-gray-500 hover:text-gray-700">
          <UserPlus />
        </button>
        <button
          onClick={() => handleCall("voice")}
          className="text-gray-500 hover:text-gray-700"
        >
          <Phone size={22} />
        </button>
        <button
          onClick={() => handleCall("video")}
          className="text-gray-500 hover:text-gray-700"
        >
          <Video size={26} />
        </button>
        <button className="text-gray-500 hover:text-gray-700">
          <Search />
        </button>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {
            setIsChatInfoVisible(!isChatInfoVisible);
            console.log("isChatInfoVisible:", !isChatInfoVisible);
          }}
        >
          <PanelRight />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
