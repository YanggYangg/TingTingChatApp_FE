import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import SibarContact from "../SideBarContact";
import ContactList from "../ContactList";
import GroupList from "../GroupList";
import FriendRequests from "../FriendRequests";
import GroupInvites from "../GroupInvites";

function Contact() {
  const [activeComponent, setActiveComponent] = useState("friends");

  const renderComponent = () => {
    switch (activeComponent) {
      case "groups":
        return <GroupList />;
      case "friendRequests":
        return <FriendRequests />;
      case "groupInvites":
        return <GroupInvites />;
      default:
        return <ContactList />;
    }
  };

  return (
    <div className="w-full h-screen bg-green-500 text-white flex">
      <SibarContact setActiveComponent={setActiveComponent} />
      <div className="flex-1">{renderComponent()}</div>
    </div>
  );
}

export default Contact;