import React from "react";
import classNames from "classnames";
import styles from "./chatlist.module.scss";
import MessageList from "../../../components/MessageList";
import SearchCompo from "../../../components/searchComponent/SearchCompo";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../../redux/slices/chatSlice";

const cx = classNames.bind(styles);

function ChatList({ activeTab }) {
  const dispatch = useDispatch();

  // Xử lý khi click vào tin nhắn
  const handleMessageClick = (message) => {
    dispatch(setSelectedMessage(message.id));
  };

  // Dữ liệu mẫu
  const sampleMessages = [
    {
      id: 1,
      name: "Hờ Mờ Hờ Và Những Ngư...",
      avatar: "https://picsum.photos/200",
      type: "group",
      lastMessage: "Giải tán hết đi mấy con quỉ cái này",
      isCall: false,
      time: "38 phút",
      members: 99,
    },
    {
      id: 2,
      name: "Khánh",
      avatar: "https://picsum.photos/200",
      type: "personal",
      isCall: true,
      missed: false,
      time: "1 giờ",
    },
    {
      id: 3,
      name: "Dũng",
      avatar: "https://picsum.photos/200",
      type: "personal",
      lastMessage: "Hello bạn!",
      isCall: false,
      time: "2 giờ",
    },
    {
      id: 4,
      name: "Lớp ReactJS",
      avatar: "https://picsum.photos/200",
      type: "group",
      isCall: true,
      missed: true,
      time: "5 giờ",
    },
  ];

  return (
    <div className="w-full h-screen bg-white border-r border-gray-300 flex flex-col">
      {/* Thanh tìm kiếm */}
      <div className="p-2 bg-white shadow-md">
        <SearchCompo />
      </div>

      {/* Danh sách chat */}
      <div className="flex-grow overflow-y-auto  text-gray-700">
        {activeTab === "/chat" && (
          <MessageList
            messages={sampleMessages}
            onMessageClick={handleMessageClick}
          />
        )}
        {activeTab === "/contact" && <p>Danh sách liên hệ</p>}
      </div>
    </div>
  );
}

export default ChatList;
