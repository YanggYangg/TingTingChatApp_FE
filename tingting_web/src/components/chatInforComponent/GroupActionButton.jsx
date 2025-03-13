import { FaBellSlash, FaThumbtack, FaUserPlus, FaCog } from "react-icons/fa";

const iconMap = {
  "mute": <FaBellSlash size={16} />,
  "pin": <FaThumbtack size={16} />,
  "add": <FaUserPlus size={16} />,
  "settings": <FaCog size={16} />
};

const GroupActionButton = ({ icon, text }) => {
  return (
    <button className="flex flex-col items-center text-sm text-gray-700 hover:text-blue-500">
      {iconMap[icon] || <FaCog size={16} />} {/* Mặc định là FaCog */}
      <span>{text}</span>
    </button>
  );
};

export default GroupActionButton;
