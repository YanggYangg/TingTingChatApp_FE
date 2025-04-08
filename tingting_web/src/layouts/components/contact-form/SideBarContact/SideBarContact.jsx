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

const SibarContact = () => {
  const navigate = useNavigate(); 

  return (
    <div className="w-full h-screen bg-white  border-gray-200">
      <div>
        <ContactItem
          label="Danh sách bạn bè"
          icon={faUser}
          onClick={() => navigate("/contacts/friends")}
        />
        <ContactItem
          label="Danh sách nhóm và cộng đồng"
          icon={faUsers}
          onClick={() => navigate("/contacts/groups")}

        />
        <ContactItem
          label="Lời mời kết bạn"
          icon={faUserPlus}
          onClick={() => navigate("/contacts/friend-requests")}
        />
        <ContactItem
          label="Lời mời vào nhóm và cộng đồng"
          icon={faUserGear}
          onClick={() => navigate("/contacts/group-invites")}
        />
      </div>
    </div>
  );
};

export default SibarContact;