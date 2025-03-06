import React from "react";
import classNames from 'classnames';
import styles from "./sidebar.module.scss";

const cx = classNames.bind(styles);

function Sidebar() {
    return(
        <div className="w-16 h-screen bg-transparent text-white p-2">  
        <ul className="space-y-4">
            <li className="p-2 rounded-lg hover:bg-blue-700 cursor-pointer">Trang chủ</li>
            <li className="p-2 rounded-lg hover:bg-blue-700 cursor-pointer">Tin nhắn</li>
            <li className="p-2 rounded-lg hover:bg-blue-700 cursor-pointer">Cài đặt</li>
        </ul>
    </div>
    )
};

export default Sidebar;