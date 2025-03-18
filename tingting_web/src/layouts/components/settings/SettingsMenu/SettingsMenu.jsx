import { useRef, useEffect } from "react";
import {
  FaUser,
  FaCog,
  FaDatabase,
  FaGlobe,
  FaQuestionCircle,
  FaSignOutAlt,
  FaTimes,
  FaChevronRight,
} from "react-icons/fa";

function SettingsMenu({ isOpen, onClose, position }) {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Calculate position based on the sidebar position
  const menuStyle = {
    left: position === "left" ? "8px" : "auto",
    right: position === "right" ? "8px" : "auto",
    bottom: "4rem",
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute w-64 bg-white shadow-lg rounded-sm z-50"
      style={menuStyle}
    >
      <ul className="py-1">
        <MenuItem
          icon={<FaUser className="text-black" />}
          text="Thông tin tài khoản"
        />

        <MenuItem icon={<FaCog className="text-black" />} text="Cài đặt" />

        <MenuItem
          icon={<FaDatabase className="text-black" />}
          text="Dữ liệu"
          hasSubmenu
        />

        <MenuItem
          icon={<FaGlobe className="text-black" />}
          text="Ngôn ngữ"
          hasSubmenu
        />

        <MenuItem
          icon={<FaQuestionCircle className="text-black" />}
          text="Hỗ trợ"
          hasSubmenu
        />

        <li className="border-t border-gray-200 my-1"></li>

        <MenuItem
          icon={<FaSignOutAlt className="text-red-600" />}
          text="Đăng xuất"
          textClass="text-red-600"
        />

        <MenuItem icon={<FaTimes className="text-black" />} text="Thoát" />
      </ul>
    </div>
  );
}

function MenuItem({ icon, text, hasSubmenu = false, onClick, textClass = "" }) {
  return (
    <li
      className="px-4 py-2 hover:bg-gray-100 flex items-center justify-between cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center text-black">
        <span className="w-6">{icon}</span>
        <span className={`ml-2 ${textClass}`}>{text}</span>
      </div>
      {hasSubmenu && <FaChevronRight className="text-gray-400 text-xs" />}
    </li>
  );
}

export default SettingsMenu;
