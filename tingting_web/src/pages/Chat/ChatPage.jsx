import React, { useState } from "react";
import ChatInfo from "../../layouts/components/chatwindow/ChatInfo";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { useSelector, useDispatch } from "react-redux";
import { clearSelectedMessage } from "../../redux/slices/chatSlice";
import ChatHeader from "./ChatWindow/ChatHeader";
import MessageItem from "./ChatWindow/MessageItem";
import ChatFooter from "./ChatWindow/ChatFooter";
import TingTingImage from "../../assets/TingTing_Chat.png";
import GroupMediaGallery from "../../components/chatInforComponent/GroupMediaGallery";
import StoragePage from "../../components/chatInforComponent/StoragePage";


function ChatPage() {
  const [isChatInfoVisible, setIsChatInfoVisible] = useState(false);
  const [showStorage, setShowStorage] = useState(false);

  const mockMessages = [
    {
      id: 1,
      name: "HMH và những người bạn",
      avatar: "https://picsum.photos/200",
      type: "group",
      members: 99,
      messages: [
        {
          type: "chat",
          sender: "Nguyễn Văn A",
          text: "Xin chào, bạn có khỏe không?",
          time: "10:30 AM",
        },
        {
          type: "image",
          sender: "Bạn",
          imageUrl: "https://via.placeholder.com/200",
          time: "10:32 AM",
        },
        {
          type: "file",
          sender: "Nguyễn Văn A",
          fileName: "document.pdf",
          fileUrl: "https://example.com/document.pdf",
          time: "10:35 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "3 phút",
          missed: false,
          time: "10:40 AM",
        },
      ],
    },
   
  ];

  const dispatch = useDispatch();
  const selectedMessageId = useSelector((state) => state.chat.selectedMessage);
  const selectedChat =
    mockMessages.find((chat) => chat.id === selectedMessageId) || null;

  return (
    <div className="min-h-screen bg-gray-100  ">
       <div className="min-h-screen bg-gray-100 flex">
    {selectedChat ? (
      <div className={`flex w-full transition-all duration-300`}>
        {/* Vùng chat chính */}
        <div className={`flex-1 transition-all duration-300 ${isChatInfoVisible ? "w-[calc(100%-400px)]" : "w-full"}`}>
          <ChatHeader
            type={selectedChat.type}
            name={selectedChat.name}
            lastActive={6}
            avatar={selectedChat.avatar}
            isChatInfoVisible={isChatInfoVisible}
            setIsChatInfoVisible={setIsChatInfoVisible}
          />
          <div className="p-2 w-full h-[calc(100vh-200px)] overflow-y-auto">
            {selectedChat.messages.map((msg, index) => (
              <MessageItem key={index} msg={msg} />
            ))}
          </div>
          <ChatFooter className="fixed bottom-0 left-0 w-full bg-white shadow-md" />
        </div>

        {/* Vùng thông tin chat */}
        {isChatInfoVisible && (
          <div className="w-[400px] bg-white border-l p-2 max-h-screen transition-all duration-300">
            <ChatInfo />
          </div>
        )}
        
      </div>
    ) : (
      <div className="flex flex-1 flex-col items-center justify-center bg-white">
        <h1 className="text-2xl font-bold justify-center">Chào mừng đến với TingTing PC!</h1>
        <p className="text-gray-600">
          Khám phá các tiện ích hỗ trợ làm việc và trò chuyện cùng người thân, bạn bè.
        </p>
        <img src={TingTingImage} alt="Welcome" className="mt-4 w-64 h-auto rounded-lg" />
      </div>
    )}
  </div>
    </div>
  );
}


export default ChatPage;
