"use client";

import { useState, useRef, useEffect } from "react";
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
import SettingsModal from "../SettingsModal/SettingsModal";
import UserProfileModal from "../UserProfileModal/UserProfileModal";
import { Api_Auth } from "../../../../../apis/api_auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SettingsMenu({ isOpen, onClose, position }) {
  const navigator = useNavigate();
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
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

  const handleSettingsClick = () => {
    onClose(); // Close the menu
    setSettingsModalOpen(true); // Open the settings modal
  };

  const handleUserProfileClick = () => {
    onClose(); // Close the menu
    setUserProfileModalOpen(true); // Open the user profile modal
  };
  const handleLogout = async () => {
    onClose(); 
     try {
    const userId = localStorage.getItem("userId");
    const response =  await axios.post(
      "http://localhost:3002/api/v1/auth/sign-out", userId,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        withCredentials: true,
      }  
    )
    console.log(response);
    
      localStorage.removeItem("token");
      localStorage.removeItem("userId"); 
      localStorage.removeItem("phone");
      localStorage.removeItem("profile");
    
      navigator('homepage');
    }catch (error) {
      console.error("Logout failed:", error); // Log any errors
    }
  };
  

  if (!isOpen && !settingsModalOpen && !userProfileModalOpen) return null;

  return (
    <>
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute w-64 bg-white shadow-lg rounded-sm z-50"
          style={menuStyle}
        >
          <ul className="py-1">
            <MenuItem
              icon={<FaUser className="text-black" />}
              text="Thông tin tài khoản"
              onClick={handleUserProfileClick}
            />

            <MenuItem
              icon={<FaCog className="text-black" />}
              text="Cài đặt"
              onClick={handleSettingsClick}
            />

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
              onClick={handleLogout}
            />

            {/* <MenuItem icon={<FaTimes className="text-black" />} text="Thoát" onClick={handleLogout} /> */}
          </ul>
        </div>
      )}

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
      <UserProfileModal
        isOpen={userProfileModalOpen}
        onCloseUserProfile={() => setUserProfileModalOpen(false)}
      />
    </>
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
