import {
  faUser,
  faUsers,
  faUserPlus,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";

import ContactItem from "../ContactItem";

const SibarContact = () => {
  return (
    <div className="w-[350px] h-screen bg-white text-black border-r border-gray-200">
      <div>
        <ContactItem href="/chat" label="Danh sách bạn bè" icon={faUser} />
        <ContactItem
          href="/contact"
          label="Danh sách nhóm và cộng đồng"
          icon={faUsers}
        />
        <ContactItem href="/group" label="Lời mời kết bạn" icon={faUserPlus} />
        <ContactItem
          href="/setting"
          label="Lời mời vào nhóm và cộng đồng"
          icon={faUserGear}
        />

        {/* <ContactItem
          href="/setting"
          label="Setting"
          image="https://www.bigfootdigital.co.uk/wp-content/uploads/2020/07/image-optimisation-scaled.jpg"
        /> */}
      </div>
    </div>
  );
};

export default SibarContact;
