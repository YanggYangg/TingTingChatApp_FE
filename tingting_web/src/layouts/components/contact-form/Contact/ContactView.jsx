import ContactList from "../ContactList";
import GroupList from "../GroupList";
import FriendRequests from "../FriendRequests";
import GroupInvites from "../GroupInvites";

function ContactView({ activeComponent }) {
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
}

export default ContactView;
