import React from "react";
import classNames from 'classnames';
import styles from "./chatlist.module.scss";

const cx = classNames.bind(styles);

function ChatList({ activeTab }){
    return(
        console.log("activeTab: ", activeTab),
        // <div className="w-48 h-screen bg-green-500 text-white p-2">
        //      <h1>chat list</h1>
        // </div>
        <div>
            {activeTab === "/chat" && <p>Danh sách chat</p>}
            {activeTab === "/contact" && <p>Danh sách liên hệ</p>}
        </div>

    );
};
export default ChatList;