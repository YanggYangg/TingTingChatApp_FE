import React, { useState, useEffect } from "react";
import SidebarItem from "./SidebarItem";
import {
  FaUserCircle,
  FaComments,
  FaAddressBook,
  FaCog,
  FaCloud,
} from "react-icons/fa";
import routes from "../../config/routes";

import SettingsMenu from "../../layouts/components/settings/SettingsMenu/SettingsMenu";
import ModalProfile from "../profile/ModalProfile";
import FriendRequests from "../../layouts/components/contact-form/FriendRequests";
import { Api_FriendRequest } from "../../../apis/api_friendRequest";  

function SidebarCompo({ setActiveTab }) {
  // Start Menu setting
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);
  //State dem loi moi kban
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };
  
  const userId = localStorage.getItem("userId");

  const fetchFriendRequests = async () => {
    try {
      const res = await Api_FriendRequest.getReceivedRequests(userId);
      setFriendRequestCount(res.data.length);
    } catch (error) {
      console.error("Lỗi khi lấy lời mời kết bạn:", error);
    }
  };
  // useEffect(() => {
  //   fetchFriendRequests();
  //   // Optional: poll dữ liệu mỗi 30s
  //   const interval = setInterval(fetchFriendRequests, 30000);
  //   return () => clearInterval(interval);
  // }, []);
  useEffect(() => {
    const handleCountUpdate = (e) => {
      setFriendRequestCount(e.detail);
    };
  
    window.addEventListener("updateFriendRequestCount", handleCountUpdate);
  
    // fetch lần đầu
    fetchFriendRequests();
  
    const interval = setInterval(() => {
      fetchFriendRequests();
    }, 30000);
  
    return () => {
      clearInterval(interval);
      window.removeEventListener("updateFriendRequestCount", handleCountUpdate);
    };
  }, []);
  


  return(
        <div className="w-16 h-screen bg-blue-600 flex flex-col items-center py-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-white mb-4" onClick={toggleModal}>
            <SidebarItem icon={FaUserCircle} />
        </div>

      {/* Top*/}
      <SidebarItem
        icon={FaComments}
        // badge='4'
        to={routes.chat}
        onClick={() => setActiveTab(routes.chat)}
      />
      <SidebarItem
        icon={FaAddressBook}
        badge={friendRequestCount > 0 ? `${friendRequestCount}` : null}
        to={routes.contacts}
        onClick={() => setActiveTab(routes.contacts)}
      />

      <div className="flex-grow"></div>

      {/*Bottom */}
      <SidebarItem
        icon={FaCloud}
        to={routes.cloud}
        onClick={() => setActiveTab(routes.cloud)}
      />
      <SidebarItem icon={FaCog} onClick={toggleSettings} />

      {/* Settings Menu */}
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        position="left"
      />

        <ModalProfile isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default SidebarCompo;