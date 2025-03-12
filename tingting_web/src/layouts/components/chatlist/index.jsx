import React from "react";
import classNames from "classnames";
import styles from "./chatlist.module.scss";
import MessageList from "../../../components/MessageList";

const cx = classNames.bind(styles);

function ChatList({ activeTab }) {
  // Khai báo hàm đúng cách
  const handleMessageClick = (message) => {
    console.log("Chi tiết tin nhắn:", message);
  };

  // Dữ liệu mẫu
  const sampleMessages = [
    {
      name: "Hờ Mờ Hờ Và Những Ngư...",
      avatar: "https://picsum.photos/200",
      type: "group",
      lastMessage: "Giải tán hết đi mấy con quỉ cái này",
      isCall: false,
      time: "38 phút",
      members: 99,
    },
    {
      name: "Khánh",
      avatar: "https://picsum.photos/200",
      type: "personal",
      isCall: true,
      missed: false,
      time: "1 giờ",
    },
    {
      name: "Dũng",
      avatar: "https://picsum.photos/200",
      type: "personal",
      lastMessage: "Hello bạn!",
      isCall: false,
      time: "2 giờ",
    },
    {
      name: "Lớp ReactJS",
      avatar: "https://picsum.photos/200",
      type: "group",
      isCall: true,
      missed: true,
      time: "5 giờ",
    },
  ];

  return (
    <div>
      {console.log("activeTab:", activeTab)}
      {activeTab === "/chat" && (
        <MessageList
          messages={sampleMessages}
          onMessageClick={handleMessageClick}
        />
      )}
      {activeTab === "/contact" && <p>Danh sách liên hệ</p>}
    </div>
  );
}

export default ChatList;
