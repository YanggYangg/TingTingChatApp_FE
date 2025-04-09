import { useState, useEffect } from "react";
import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import ContactItem from "../ContactItem";
import styles from "./SideBarContact.module.scss";
import classNames from "classnames/bind";
import { useNavigate } from "react-router-dom";

const cx = classNames.bind(styles);

const SidebarContact = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (path) => {
    setSelectedItem(path); // Cập nhật mục đang chọn
    navigate(path);
  };

  return (
    <div className="w-full h-screen bg-white border-gray-200">
      <div>
        <ContactItem
          label="Danh sách bạn bè"
          icon={faUser}
          isSelected={selectedItem === "/contacts/friends"}
          onClick={() => handleItemClick("/contacts/friends")}
        />
        <ContactItem
          label="Danh sách nhóm và cộng đồng"
          icon={faUsers}
          isSelected={selectedItem === "/contacts/groups"}
          onClick={() => handleItemClick("/contacts/groups")}
        />
        <ContactItem
          label="Lời mời kết bạn"
          icon={faUserPlus}
          isSelected={selectedItem === "/contacts/friend-requests"}
          onClick={() => handleItemClick("/contacts/friend-requests")}
        />
        <ContactItem
          label="Lời mời vào nhóm và cộng đồng"
          icon={faUserGear}
          isSelected={selectedItem === "/contacts/group-invites"}
          onClick={() => handleItemClick("/contacts/group-invites")}
        />
      </div>
    </div>
  );
};

export default SidebarContact;
