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

import socket1 from "../../utils/socket.js";
import { Api_FriendRequest } from "../../../apis/api_friendRequest.js";

function SidebarCompo({ setActiveTab }) {
  // Start Menu setting
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receivedRequestCount, setReceivedRequestCount] = useState(0);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };
  const profile = JSON.parse(localStorage.getItem("profile"));
  const avatar = profile?.avatar || "https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg";

  // End Menu setting


  //socket 
  useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (userId) {
    socket1.emit("add_user", userId);
  }

  const updateReceivedRequests = async () => {
    try {
      const res = await Api_FriendRequest.getReceivedRequests(userId);
      const data = await res.data;
      const pending = data.filter(req => req.status === "pending");
      setReceivedRequestCount(pending.length);
    } catch (err) {
      console.error("Lỗi khi lấy lời mời:", err);
    }
  };

  // socket1.on("friend_request_received", () => {
  //   updateReceivedRequests();
  // });

  socket1.on("friend_request_received", updateReceivedRequests);
  socket1.on("friend_request_revoked", updateReceivedRequests);

  updateReceivedRequests(); // fetch khi component mount

  return () => {
    //socket1.off("friend_request_received");
    socket1.off("friend_request_received", updateReceivedRequests);
    socket1.off("friend_request_revoked", updateReceivedRequests);
  };
}, []);

  return(
        <div className="w-16 h-screen bg-blue-600 flex flex-col items-center py-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-white mb-4" onClick={toggleModal}>
            <SidebarItem image={avatar} />
        </div>

      {/* Top*/}
      <SidebarItem
        icon={FaComments}
        to={routes.chat}
        onClick={() => setActiveTab(routes.chat)}
      />
      <SidebarItem
        icon={FaAddressBook}
        // badge="3"
        badge={receivedRequestCount > 0 ? receivedRequestCount.toString() : null}
        to={routes.contacts}
        onClick={() => setActiveTab(routes.contacts)}
      />

      <div className="flex-grow"></div>

      {/*Bottom */}
      {/* <SidebarItem icon={FaCloud} /> */}
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