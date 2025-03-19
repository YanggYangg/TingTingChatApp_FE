import React,  {useState } from "react";
import classNames from "classnames";
import styles from "./chatlist.module.scss";
import MessageList from "../../../components/MessageList";
import SearchCompo from "../../../components/searchComponent/SearchCompo";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../../redux/slices/chatSlice";
import Contact from "../contact-form/Contact";
import SibarContact from "../contact-form/SideBarContact/SideBarContact";

const cx = classNames.bind(styles);

function ChatList({ activeTab }) {
  const [selectedTab, setSelectedTab] = useState("priority");

  // Hàm xử lý khi click vào tin nhắn
  const dispatch = useDispatch();

  // Xử lý khi click vào tin nhắn
  const handleMessageClick = (message) => {
    dispatch(setSelectedMessage(message.id));
  };

  const handleTabClick = (tab) => {
    setSelectedTab(tab);
  }

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
    {
      id: 4,
      name: "Lớp ReactJS",
      avatar: "https://picsum.photos/200",
      type: "group",
      isCall: true,
      missed: true,
      time: "5 giờ",
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
    {
      id: 4,
      name: "Lớp ReactJS",
      avatar: "https://picsum.photos/200",
      type: "group",
      isCall: true,
      missed: true,
      time: "5 giờ",
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
    {
      id: 4,
      name: "Lớp ReactJS",
      avatar: "https://picsum.photos/200",
      type: "group",
      isCall: true,
      missed: true,
      time: "5 giờ",
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
    {
      id: 4,
      name: "Lớp ReactJS",
      avatar: "https://picsum.photos/200",
      type: "group",
      isCall: true,
      missed: true,
      time: "5 giờ",
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

      {activeTab === "/chat" && (
      <div className="flex justify-start space-x-4 px-4 py-2 border-b">
     <button
            className={`font-semibold px-2 ${
              selectedTab === "priority"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
            onClick={() => handleTabClick("priority")}
          >
            Ưu tiên
          </button>
          <button
            className={`font-semibold px-2 ${
              selectedTab === "others"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
            onClick={() => handleTabClick("others")}
          >
            Khác
          </button>
        </div>
      )}

  

      {/* Danh sách chat */}
      <div className="flex-grow overflow-y-auto  text-gray-700">
        {activeTab === "/chat" && (
          <MessageList
            messages={sampleMessages}
            onMessageClick={handleMessageClick}
          />
        )}


        {activeTab === "/contact" &&
          <SibarContact />
        }
      </div>
    </div>
  );
}

export default ChatList;
