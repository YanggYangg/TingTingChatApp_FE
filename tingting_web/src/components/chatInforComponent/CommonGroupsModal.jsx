import Modal from "react-modal";

Modal.setAppElement("#root");

const CommonGroupsModal = ({ isOpen, onClose, groups }) => {
  if (!groups || groups.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity"
    >
      <h2 className="text-lg font-bold mb-3">
        Nhóm chung ({groups.length})
      </h2>

      <ul className="max-h-60 overflow-y-auto">
        {groups.map((group) => (
          <li
            key={group._id}
            className="py-2 border-b last:border-none flex items-center"
          >
            <img
              src={group.avatar || "https://via.placeholder.com/40"}
              alt={group.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <span className="text-gray-800 font-medium">{group.name}</span>
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

export default CommonGroupsModal;
