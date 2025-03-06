import React from "react";
import classNames from 'classnames';
import styles from "./chatlist.module.scss";

const cx = classNames.bind(styles);

function ChatList() {
    return(
        <div className="w-48 h-screen bg-green-500 text-white p-2">
             <h1>chat list</h1>
        </div>

    );
};
export default ChatList;