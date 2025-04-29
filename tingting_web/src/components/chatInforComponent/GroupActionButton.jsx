import React from "react";
import { FaBellSlash, FaThumbtack, FaUserPlus, FaCog } from "react-icons/fa";

const iconMap = {
  mute: <FaBellSlash size={16} />,
  pin: <FaThumbtack size={16} />,
  add: <FaUserPlus size={16} />,
  settings: <FaCog size={16} />,
  unpin: <FaThumbtack size={16} />,
};

const GroupActionButton = ({ icon, text, onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center text-sm text-gray-700 hover:text-blue-500 ${
        isActive ? "text-blue-500" : ""
      }`}
    >
      {iconMap[icon] || <FaCog size={16} />}
      <span>{text}</span>
    </button>
  );
};

export default GroupActionButton;