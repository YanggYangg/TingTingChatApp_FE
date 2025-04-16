import React, { useState } from 'react';
import { FaTimes, FaSearch, FaChevronDown, FaCloud, FaUsers, FaUser } from 'react-icons/fa';

const sampleConversations = [
  {
    _id: '1',
    name: 'Cloud của tôi',
    isGroup: false,
    imageGroup: null,
    participants: [{ userId: 'user1' }],
    lastMessage: { content: 'Chào bạn!', userId: 'user1' },
    createAt: new Date(),
    updateAt: new Date(),
  },
  {
    _id: '2',
    name: 'Nhóm 01_CNM_App Zalo',
    isGroup: true,
    imageGroup: null,
    participants: [
      { userId: 'user2', role: 'admin' },
      { userId: 'user3', role: 'member' },
      { userId: 'user4', role: 'member' },
      { userId: 'user5', role: 'member' },
      { userId: 'user6', role: 'member' },
    ],
    lastMessage: { content: 'Mọi người có thông tin gì mới không?', userId: 'user2' },
    createAt: new Date(),
    updateAt: new Date(),
  },
  {
    _id: '3',
    name: 'BÉO 1.2024',
    isGroup: false,
    imageGroup: null,
    participants: [{ userId: 'user7' }],
    lastMessage: { content: 'Hình ảnh mới nhất đây!', userId: 'user7' },
    createAt: new Date(),
    updateAt: new Date(),
  },
  {
    _id: '4',
    name: 'GROUP ỨNG VIÊN IT VIỆT NAM',
    isGroup: true,
    imageGroup: null,
    participants: [{ userId: 'user8', role: 'admin' }, { userId: 'user9', role: 'member' }],
    lastMessage: { content: 'Chào mừng các thành viên mới!', userId: 'user8' },
    createAt: new Date(),
    updateAt: new Date(),
  },
  {
    _id: '5',
    name: 'Giới Trẻ Giáo Xứ Bến Cát',
    isGroup: true,
    imageGroup: null,
    participants: [{ userId: 'user10', role: 'admin' }, { userId: 'user11', role: 'member' }],
    lastMessage: { content: 'Lịch sinh hoạt tuần này...', userId: 'user10' },
    createAt: new Date(),
    updateAt: new Date(),
  },
  {
    _id: '6',
    name: '2462 Giải đề + share sách ETS 2024',
    isGroup: true,
    imageGroup: null,
    participants: [{ userId: 'user12', role: 'admin' }, { userId: 'user13', role: 'member' }],
    lastMessage: { content: '[File đính kèm]', userId: 'user12', messageType: 'file' },
    createAt: new Date(),
    updateAt: new Date(),
  },
  {
    _id: '7',
    name: 'Ha Duong Mai Chi',
    isGroup: false,
    imageGroup: null,
    participants: [{ userId: 'user14' }],
    lastMessage: { content: 'Bạn khỏe không?', userId: 'user14' },
    createAt: new Date(),
    updateAt: new Date(),
  },
  {
    _id: '8',
    name: 'BÉO PRINTING',
    isGroup: true,
    imageGroup: null,
    participants: [{ userId: 'user15', role: 'admin' }],
    lastMessage: { content: 'Bảng giá in mới nhất.', userId: 'user15' },
    createAt: new Date(),
    updateAt: new Date(),
  },
  {
    _id: '9',
    name: 'phòng trọ 206',
    isGroup: true,
    imageGroup: null,
    participants: [{ userId: 'user16', role: 'member' }, { userId: 'user17', role: 'member' }],
    lastMessage: { content: 'Thông báo tiền phòng tháng tới.', userId: 'user16' },
    createAt: new Date(),
    updateAt: new Date(),
  },
];

const ShareModal = ({ isOpen, onClose, onShare, messageToForward }) => {
    if (!isOpen) {
      return null;
    }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center      bg-opacity-50"   overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chia sẻ</h2>
          <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
            <FaTimes className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b">
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tìm kiếm..."
            />
          </div>
        </div>


        {/* Contact List */}
        <ul className="overflow-y-auto max-h-[300px] p-2">
          {sampleConversations.map((conversation) => (
            <li key={conversation._id} className="flex items-center py-2">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <div className="ml-3 flex items-center">
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                  {conversation.imageGroup ? (
                    <img
                      src={conversation.imageGroup}
                      alt={conversation.name}
                      className="w-full h-full object-cover"
                    />
                  ) : conversation.isGroup ? (
                    <FaUsers className="w-6 h-6 text-gray-500" />
                  ) : (
                    <FaUser className="w-6 h-6 text-gray-500" />
                  )}
                  {conversation.participants.length > 2 && conversation.isGroup && (
                    <span className="absolute bottom-0 left-0 bg-green-500 text-white text-[10px] rounded-full px-1">
                      {conversation.participants.length}
                    </span>
                  )}
                  {conversation.participants.length <= 2 && !conversation.isGroup && (
                    <span className="absolute bottom-0 left-0 bg-red-500 text-white text-[10px] rounded-full px-1">99+</span>
                  )}
                  {conversation.name === 'GROUP ỨNG VIÊN IT VIỆT NAM' && !conversation.imageGroup && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px]">VN</span>
                  )}
                  {conversation.name === 'BÉO 1.2024' && !conversation.imageGroup && (
                    <span className="absolute bottom-0 left-0 bg-red-500 text-white text-[10px] rounded-full px-1">99+</span>
                  )}
                  {conversation.name === '2462 Giải đề + share sách ETS 2024' && !conversation.imageGroup && (
                    <span className="absolute bottom-0 left-0 bg-red-500 text-white text-[10px] rounded-full px-1">99+</span>
                  )}
                  {conversation.name === 'BÉO PRINTING' && !conversation.imageGroup && (
                    <span className="absolute bottom-0 left-0 bg-red-500 text-white text-[10px] rounded-full px-1">99+</span>
                  )}
                  {conversation.name === 'Cloud của tôi' && !conversation.imageGroup && (
                    <FaCloud className="w-6 h-6 text-gray-500" />
                  )}
                  {conversation.name === 'Ha Duong Mai Chi' && !conversation.imageGroup && (
                    <FaUser className="w-6 h-6 text-gray-500" />
                  )}
                  {conversation.name === 'phòng trọ 206' && !conversation.imageGroup && (
                    <FaUsers className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <span className="ml-2 text-sm text-gray-700">{conversation.name}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Message Input */}
        <div className="p-2 border-t">
          <div className="text-sm text-gray-500">Chia sẻ tin nhắn</div>
          <div className="mt-1 rounded-md shadow-sm">
            <textarea
              rows={2}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Nhập tin nhắn..."
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end p-4">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => { /* Handle share logic */ }}
          >
            Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;