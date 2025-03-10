import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";

import ContactItem from "../ContactItem";
import Search from "../Search";

const ContactList = () => {
  return (
    <div className="w-full h-full bg-white text-black flex flex-col ">
      <ContactItem
        href="/chat"
        label="Danh sách bạn bè"
        icon={faUser}
        className="hover:bg-white cursor-default "
      />

      <div className="bg-gray-200 w-full flex-1 p-4 overflow-y-auto">
        <h2 className="pb-4 text-black font-medium">Bạn bè (100) </h2>
        <div className="w-full h-full bg-white rounded-xs">
          <div className="w-full h-full rounded-xs p-4">{/* <Search /> */}</div>
        </div>
      </div>
    </div>
  );
};

export default ContactList;
