import React from 'react';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { clearMessages } from '../../../redux/slices/chatGPTSlice';

const ChatHeaderChatGPT = ({ onBack, isChatInfoVisible, setIsChatInfoVisible }) => {
  const dispatch = useDispatch();

  const handleNewChat = () => {
    dispatch(clearMessages());
  };

  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaArrowLeft className="text-gray-600" />
        </button> */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">ChatGPT</h2>
            <p className="text-sm text-gray-500">Always online</p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleNewChat}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Bắt đầu cuộc trò chuyện mới"
        >
          <FaPlus className="text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeaderChatGPT;
