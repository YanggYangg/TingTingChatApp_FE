import React, { useState } from "react";
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

function SidebarCompo({ setActiveTab }) {
  // Start Menu setting
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  // End Menu setting

  return(
        <div className="w-16 h-screen bg-blue-600 flex flex-col items-center py-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-white mb-4" onClick={toggleModal}>
            <SidebarItem icon={FaUserCircle} />
        </div>

      {/* Top*/}
      <SidebarItem
        icon={FaComments}
        to={routes.chat}
        onClick={() => setActiveTab(routes.chat)}
      />
      <SidebarItem
        icon={FaAddressBook}
        badge="3"
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
