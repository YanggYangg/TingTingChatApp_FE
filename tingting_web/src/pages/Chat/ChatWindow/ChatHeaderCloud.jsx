import React from "react";

import { PanelRight, Search, Video, UserPlus, User } from "lucide-react";
const ChatHeaderCloud = ({
  type,
  name,
  members,
  lastActive,
  avatar,
  isChatInfoVisible,
  setIsChatInfoVisible,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-2 border-b border-gray-200 bg-white`}
    >
      {/* Thông tin nhóm/người chat */}
      <div className="flex items-center">
        <img
          src={avatar}
          alt="Avatar"
          className="w-12 h-12 rounded-full mr-4"
        />
        <div>
          <h2 className="text-lg font-bold">{name}</h2>
          {type === "group" ? (
            <p className=" flex text-x text-gray-500">
              <User size={20} />
              {members} thành viên
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Lưu trữ và đồng bộ dữ liệu giữa các thiết bị
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons - Căn phải */}
      <div className="ml-auto flex space-x-3">
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {
            setIsChatInfoVisible(!isChatInfoVisible);
            console.log("isChatInfoVisible:", !isChatInfoVisible); // Kiểm tra giá trị
          }}
        >
          <PanelRight />
        </button>
      </div>
    </div>
  );
};

export default ChatHeaderCloud;
