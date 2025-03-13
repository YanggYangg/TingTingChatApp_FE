import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearSelectedMessage } from "../../redux/slices/chatSlice";
import ChatHeader from "./ChatWindow/ChatHeader";
import MessageItem from "./ChatWindow/MessageItem";
import ChatFooter from "./ChatWindow/ChatFooter";
import TingTingImage from "../../assets/TingTing_Chat.png";

function ChatPage() {
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
    {
      id: 2,
      name: "Khánh",
      avatar: "https://picsum.photos/200",
      type: "personal",
      messages: [
        {
          type: "chat",
          sender: "Trần Thị B",
          text: "Hôm nay bạn rảnh không?",
          time: "11:45 AM",
        },
        {
          type: "call",
          sender: "Bạn",
          callDuration: "5 phút",
          missed: true,
          time: "11:50 AM",
        },
        {
          type: "image",
          sender: "Trần Thị B",
          imageUrl: "https://picsum.photos/200",
          time: "11:55 AM",
        },
        {
          type: "file",
          sender: "Bạn",
          fileName: "notes.txt",
          fileUrl: "https://example.com/notes.txt",
          time: "12:00 PM",
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
      <div className="mx-auto">
        {selectedChat ? (
          <div className="w-full ">
            <ChatHeader
              type={selectedChat.type}
              name={selectedChat.name}
              lastActive={6}
              avatar={selectedChat.avatar}
            />
            <div className="p-2 w-full h-[calc(100vh-200px)] overflow-y-auto">
              {selectedChat.messages.map((msg, index) => (
                <MessageItem key={index} msg={msg} />
              ))}
            </div>
            <ChatFooter className="fixed bottom-0 left-0 w-full bg-white shadow-md" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-screen bg-white">
            <h1 className=" text-2xl font-bold justify-center">
              Chào mừng đến với TingTing PC!
            </h1>
            <p className="text-gray-600">
              Khám phá các tiện ích hỗ trợ làm việc và trò chuyện cùng người
              thân, bạn bè.
            </p>
            <img
              src={TingTingImage}
              alt="Welcome"
              className="mt-4 w-64 h-auto rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
