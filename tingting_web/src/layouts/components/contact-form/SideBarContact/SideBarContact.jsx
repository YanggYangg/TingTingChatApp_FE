import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import ContactItem from "../ContactItem";

const SibarContact = ({ setActiveComponent }) => {
  return (
    <div className="w-[350px] h-screen bg-white text-black border-r border-gray-200">
      <div>
        <ContactItem
          label="Danh sách bạn bè"
          icon={faUser}
          onClick={() => setActiveComponent("friends")}
          className={"cursor-default active:bg-blue-500"}
        />
        <ContactItem
          label="Danh sách nhóm và cộng đồng"
          icon={faUsers}
          onClick={() => setActiveComponent("groups")}
        />
        <ContactItem
          label="Lời mời kết bạn"
          icon={faUserPlus}
          onClick={() => setActiveComponent("friendRequests")}
        />
        <ContactItem
          label="Lời mời vào nhóm và cộng đồng"
          icon={faUserGear}
          onClick={() => setActiveComponent("groupInvites")}
        />
      </div>
    </div>
  );
};

export default SibarContact;
