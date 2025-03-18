import { useState } from "react";
import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import ContactItem from "../ContactItem";
import styles from "./SideBarContact.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

const SibarContact = ({ setActiveComponent }) => {
  const [selectedItem, setSelectedItem] = useState("friends");

  const handleSelect = (component) => {
    setSelectedItem(component);
    setActiveComponent(component);
  };

  return (
    <div className="w-[350px] h-screen bg-white text-black border-r border-gray-200">
      <div>
        <ContactItem
          label="Danh sách bạn bè"
          icon={faUser}
          onClick={() => handleSelect("friends")}
          className={cx("wrapper", { selected: selectedItem === "friends" })}
        />
        <ContactItem
          label="Danh sách nhóm và cộng đồng"
          icon={faUsers}
          onClick={() => handleSelect("groups")}
          className={cx("wrapper", { selected: selectedItem === "groups" })}
        />
        <ContactItem
          label="Lời mời kết bạn"
          icon={faUserPlus}
          onClick={() => handleSelect("friendRequests")}
          className={cx("wrapper", {
            selected: selectedItem === "friendRequests",
          })}
        />
        <ContactItem
          label="Lời mời vào nhóm và cộng đồng"
          icon={faUserGear}
          onClick={() => handleSelect("groupInvites")}
          className={cx("wrapper", {
            selected: selectedItem === "groupInvites",
          })}
        />
      </div>
    </div>
  );
};

export default SibarContact;
