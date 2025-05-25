import React from 'react';

const MessageItemChatGPT = ({ msg, currentUserId }) => {
  const isCurrentUser = msg.userId === currentUserId;

  return (
    <div
      className={`flex ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      } mb-4`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isCurrentUser
            ? 'bg-blue-500 text-white'
            : 'bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 border border-purple-200'
        }`}
      >
        {!isCurrentUser && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="font-semibold text-sm">ChatGPT</span>
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
        <div
          className={`text-xs mt-1 ${
            isCurrentUser ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {msg.time}
        </div>
      </div>
    </div>
  );
};

export default MessageItemChatGPT;
