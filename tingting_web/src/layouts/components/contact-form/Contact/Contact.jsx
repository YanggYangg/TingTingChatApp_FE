import classNames from "classnames";

import SibarContact from "../SideBarContact/SideBarContact";
import ContactList from "../ContactList/ContactList";

function Contact() {
  return (
    <div className="w-full h-[100%] bg-green-500 text-white flex">
      {/* Sidebar chiếm cố định 300px */}
      <div>
        <SibarContact />
      </div>

      {/* Contact List chiếm phần còn lại */}
      <div className="flex-1">
        <ContactList />
      </div>
    </div>
  );
}
export default Contact;
