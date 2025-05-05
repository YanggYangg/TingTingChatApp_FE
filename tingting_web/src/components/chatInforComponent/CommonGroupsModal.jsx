import { useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const CommonGroupsModal = ({ isOpen, onClose, commonGroups, onGroupSelect }) => {
  if (!commonGroups?.length) return null;

  const handleGroupSelect = (group) => {
    onGroupSelect(group); // Gọi hàm xử lý chọn nhóm từ component cha
    onClose(); // Gọi hàm đóng modal
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]"
    >
      <h2 className="text-lg font-bold mb-3">Nhóm chung ({commonGroups.length})</h2>
      <ul className="max-h-60 overflow-y-auto">
        {commonGroups.map((group) => (
          <li
            key={group._id}
            className="py-2 border-b last:border-none flex items-center cursor-pointer hover:bg-gray-100"
            onClick={() => handleGroupSelect(group)}
          >
            <img
              src={group.imageGroup || "https://via.placeholder.com/40"}
              alt={group.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <span className="text-gray-800 font-medium">{group.name || "Nhóm không tên"}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClose}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
      >
        Đóng
      </button>
    </Modal>
  );
};

export default CommonGroupsModal;