import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

import ContactItem from "../ContactItem";
import Search from "../Search";

const FriendRequests = () => {
  return (
    <div className="w-full h-full bg-white text-black flex flex-col ">
      <ContactItem
        label="Lời mời kết bạn"
        icon={faUserPlus}
        className="hover:bg-white cursor-default "
      />

      <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto"></div>
    </div>
  );
};

export default FriendRequests;
