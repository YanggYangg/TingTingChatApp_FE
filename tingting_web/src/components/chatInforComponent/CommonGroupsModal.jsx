import { useEffect } from "react";
import Modal from "react-modal";
import {
  getCommonGroups,
  onCommonGroups,
  offCommonGroups,
  onError,
  offError,
} from "../../services/sockets/events/chatInfo";

const CommonGroupsModal = ({ isOpen, onClose, conversationId, socket }) => {
  const [commonGroups, setCommonGroups] = useState([]);

  useEffect(() => {
    if (!socket || !conversationId || !isOpen) return;

    // Lấy danh sách nhóm chung
    getCommonGroups(socket, { conversationId });

    // Lắng nghe danh sách nhóm chung
    onCommonGroups(socket, ({ commonGroups }) => {
      setCommonGroups(commonGroups || []);
    });

    // Lắng nghe lỗi
    onError(socket, (error) => {
      console.error("Lỗi khi lấy nhóm chung:", error);
    });

    return () => {
      offCommonGroups(socket);
      offError(socket);
    };
  }, [socket, conversationId, isOpen]);

  if (!commonGroups?.length) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]"
    >
      <h2 className="text-lg font-bold mb-3">Nhóm chung ({commonGroups.length})</h2>

      <ul className="max-h-60 overflow-y-auto">
        {commonGroups.map((group, index) => (
          <li
            key={group._id || index}
            className="py-2 border-b last:border-none flex items-center"
          >
            <img
              src={group.imageGroup || "https://via.placeholder.com/40"}
              alt={group.name || "Nhóm"}
              className="w-10 h-10 rounded-full mr-3"
            />
            <span className="text-gray-800 font-medium">
              {group.name || "Nhóm không tên"}
            </span>
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