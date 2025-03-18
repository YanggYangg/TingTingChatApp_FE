import React from "react";
import classNames from "classnames";
import styles from "./sidebar.module.scss";
import SidebarCompo from "../../../components/sidebarComponent/SidebarCompo";

const cx = classNames.bind(styles);

function Sidebar() {
  return (
    <div className="w-16 h-screen bg-transparent text-white ">
      <SidebarCompo />
    </div>
  );
}

export default Sidebar;
