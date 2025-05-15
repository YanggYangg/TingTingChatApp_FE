import React, { useState, useEffect } from "react";
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
import { useSocket } from "../../../contexts/SocketContext";

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
  const { socket } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  console.log("members", members);

  


  useEffect(() => {
    if (!socket) return;
    console.log("socket", socket);

    // Request current online users when component mounts
    socket.emit("getOnlineUsers");

    // Listen for online users updates
    socket.on("getOnlineUsers", (users) => {
      console.log("Received online users:", users);
      setOnlineUsers(users);
      // Check if the receiver is online
      if (receiverId) {
        setIsOnline(users.includes(receiverId));
      }
    });

    return () => {
      socket.off("getOnlineUsers");
    };
  }, [socket, receiverId]);

  // Handle call initiation
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
          {members > 0 ? (
            <p className="flex text-x text-gray-500">
              <User size={20} />
              {members} thành viên
            </p>
          ) : (
            <p
              className={`text-sm ${
                isOnline ? "text-green-500" : "text-gray-400"
              }`}
            >
              {isOnline ? "Đang hoạt động" : "Đang offline"}
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
        <button className="text-gray-500 hover:text-gray-700"
          onClick={() => {
            setIsChatInfoVisible(!isChatInfoVisible);
            console.log("Chat info visibility toggled:", !isChatInfoVisible);
          }}
        >
          <PanelRight />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;