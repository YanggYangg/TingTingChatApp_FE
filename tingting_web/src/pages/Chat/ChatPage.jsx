import React, { useState } from "react";
import ChatInfo from "../../layouts/components/chatwindow/ChatInfo";
import { IoIosInformationCircleOutline } from "react-icons/io";

function ChatPage() {
    const [isChatInfoVisible, setIsChatInfoVisible] = useState(false);

    return (
        <div className="flex w-full h-screen overflow-hidden relative">
            {/* Nội dung chính của trang chat */}
            <div className={`flex-grow overflow-auto p-4 transition-all duration-300 relative ${isChatInfoVisible ? 'mr-[400px]' : ''}`}>
                <h1 className="text-xl">Test chuyển trang chat</h1>
                {/* Nút toggle ChatInfo - Nằm trong phần chat */}
                <button 
                    className="absolute top-4 right-4 text-2xl p-2 bg-gray-200 rounded-full shadow-lg"
                    onClick={() => setIsChatInfoVisible(!isChatInfoVisible)}
                >
                    <IoIosInformationCircleOutline />
                </button>
                {/* Nội dung tin nhắn sẽ được hiển thị ở đây */}
            </div>
            
            {/* Thông tin chat (ChatInfo) - Ghim bên phải, có thể ẩn/hiện với hiệu ứng */}
            <div 
                className={`absolute right-0 top-0 bottom-0 w-[400px] bg-white border-l p-4 overflow-y-auto transition-all duration-300 ${isChatInfoVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
            >
                <ChatInfo />
            </div>
        </div>
    );
}

export default ChatPage;