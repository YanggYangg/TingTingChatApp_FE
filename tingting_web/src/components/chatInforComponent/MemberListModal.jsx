import { useEffect } from "react";
import Modal from "react-modal";

const MemberListModal = ({ isOpen, onClose, chatInfo }) => {
  useEffect(() => {
    if (document.getElementById("root")) {
      Modal.setAppElement("#root");
    }
  }, []);

  if (!chatInfo?.participants) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity"
    >
      <h2 className="text-lg font-bold mb-3">
        Thành viên ({chatInfo.participants.length || 0})
      </h2>

      <ul className="max-h-60 overflow-y-auto">
        {chatInfo.participants.map((member, index) => (
          <li key={index} className="py-2 border-b last:border-none flex items-center">
            <img
              src={member.avatar || "https://via.placeholder.com/40"}
              alt={member.name || "Người dùng"}
              className="w-10 h-10 rounded-full mr-3"
            />
            <span className="text-gray-800">{member.name || "Không tên"}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onClose}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-all"
      >
        Đóng
      </button>
    </Modal>
  );
};

export default MemberListModal;
