import React from "react";
import SidebarItem from "./SidebarItem";
import { FaUserCircle, FaComments, FaAddressBook, FaCog, FaCloud } from 'react-icons/fa';
import routes from "../../config/routes";

function SidebarCompo({ setActiveTab }) {
    return(
        <div className="w-16 h-screen bg-blue-600 flex flex-col items-center py-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-white mb-4">
            <SidebarItem icon={FaUserCircle} />
        </div>

        {/* Top*/}
        <SidebarItem icon={FaComments} to={routes.chat} onClick={() => setActiveTab(routes.chat)}/>
        <SidebarItem icon={FaAddressBook} badge="3" to={routes.contacts} onClick={() => setActiveTab(routes.contacts)}/> 

        <div className="flex-grow"></div>

        {/*Bottom */}
        <SidebarItem icon={FaCloud} />
        <SidebarItem icon={FaCog} /> 
    </div>

    );
}

export default SidebarCompo;