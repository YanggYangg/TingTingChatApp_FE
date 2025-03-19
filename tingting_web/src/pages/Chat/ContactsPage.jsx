import { useState } from "react";
import SibarContact from "../../layouts/components/contact-form/SideBarContact"
import { useParams } from "react-router-dom";
import GroupList from "../../layouts/components/contact-form/GroupList";
import FriendRequests from "../../layouts/components/contact-form/FriendRequests";
import ContactList from "../../layouts/components/contact-form/ContactList";
import GroupInvites from "../../layouts/components/contact-form/GroupInvites";

const ContactsPage = () => {
  const { tab } = useParams(); 


  return (
    <div className="flex h-screen">
        {tab === "friends" && <ContactList />}
        {tab === "groups" && <GroupList />}
        {tab === "friend-requests" && <FriendRequests />}
        {tab === "group-invites" && <GroupInvites />}
      </div>

  );
};

export default ContactsPage;
