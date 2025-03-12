import React from "react";
import classNames from 'classnames';
import styles from "./chatlist.module.scss";
import SearchCompo from "../../../components/searchComponent/SearchCompo";

const cx = classNames.bind(styles);

function ChatList({ activeTab }){
    return(
        console.log("activeTab: ", activeTab),
        // <div className="w-48 h-screen bg-green-500 text-white p-2">
        //      <h1>chat list</h1>
        // </div>
  
        <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
            <div className="p-2 bg-white shadow-md">
            <SearchCompo />
            </div>


            <div className="flex-grow overflow-y-auto p-4 text-gray-700">
            {activeTab === "/chat" && <p>Danh sách chat</p>}
            {activeTab === "/contact" && <p>Danh sách liên hệ</p>}
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            <p>Noidung</p>
            </div>
        </div>

    );
};
export default ChatList;