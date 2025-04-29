import React, { useState, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { removeMember, onMemberRemoved } from "../../services/sockets/events/chatInfo";

const MemberListModal = ({ isOpen, onClose, conversationId, members, onMemberRemovedCallback }) => {
  const { socket } = useSocket();
  const [memberList, setMemberList] = useState(members);

  // Lắng nghe sự kiện xóa thành viên
  useEffect(() => {
    if (!socket || !isOpen) return;

    const cleanup = onMemberRemoved(socket, (data) => {
      if (data.conversationId === conversationId) {
        setMemberList((prev) => prev.filter((member) => member.userId !== data.userId));
        onMemberRemovedCallback(data.userId);
      }
    });

    return () => {
      cleanup();
    };
  }, [socket, conversationId, isOpen, onMemberRemovedCallback]);

  const handleRemoveMember = (userId) => {
    if (window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?")) {
      removeMember(socket, { conversationId, userId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-96">
        <h2 className="text-lg font-semibold mb-4">Danh sách thành viên</h2>
        <ul className="space-y-2">
          {memberList.map((member) => (
            <li key={member.userId} className="flex justify-between items-center">
              <span>{member.name}</span>
              <button
                onClick={() => handleRemoveMember(member.userId)}
                className="text-red-500 hover:text-red-700"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default MemberListModal;