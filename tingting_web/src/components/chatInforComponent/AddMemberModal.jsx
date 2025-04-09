import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const AddMemberModal = ({ isOpen, onClose, conversationId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [availableMembers, setAvailableMembers] = useState([]);

  // Lấy danh sách thành viên khả dụng từ API khi mở modal
  useEffect(() => {
    const fetchAvailableMembers = async () => {
      if (!conversationId || !isOpen) return;

      try {
        setError("");
        const response = await Api_chatInfo.getAvailableMembers(conversationId);
        const members = response || [];
        setAvailableMembers(members);
      } catch (error) {
        console.error("Lỗi khi lấy thành viên khả dụng:", error);
        setError("Không thể tải danh sách thành viên.");
      }
    };

    fetchAvailableMembers();
  }, [isOpen, conversationId]);

  // Lọc danh sách theo từ khóa tìm kiếm (họ + tên)
  const filteredMembers = availableMembers.filter((member) => {
    const fullName = `${member.lastName} ${member.firstName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Sắp xếp theo tên A-Z
  const sortedMembers = filteredMembers.sort((a, b) => {
    return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
  });

  // Hàm thêm thành viên
  const addMember = async (memberId) => {
    if (!conversationId || !memberId) {
      setError("Thiếu thông tin để thêm thành viên.");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      const participantData = { userId: memberId, role: "member" };
      await Api_chatInfo.addParticipant(conversationId, participantData);

      // Cập nhật danh sách sau khi thêm
      setAvailableMembers((prev) => prev.filter((m) => m.id !== memberId));
      setSuccessMessage("Thêm thành viên thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm thành viên:", error);
      setError("Không thể thêm thành viên. Vui lòng thử lại!");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Thêm thành viên"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
      className="bg-white p-4 rounded-lg shadow-lg w-96 max-h-[70vh] flex flex-col"
    >
      <h2 className="text-lg font-semibold mb-3 text-center">Thêm thành viên</h2>

      <input
        type="text"
        placeholder="Nhập tên, số điện thoại..."
        className="w-full p-2 border rounded-md mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}

      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {sortedMembers.length === 0 ? (
            <p className="text-center text-sm text-gray-500">Không tìm thấy thành viên nào</p>
          ) : (
            sortedMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-2 p-2 border rounded-md"
              >
                <img
                  src={member.avatar}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-8 h-8 rounded-full"
                />
                <p className="flex-1 text-sm">
                  {member.lastName} {member.firstName}
                </p>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs"
                  onClick={() => addMember(member.id)}
                >
                  Thêm
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-3 flex justify-end gap-2 border-t pt-3">
        <button
          className="bg-gray-300 px-3 py-1 rounded-md text-sm"
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </Modal>
  );
};

export default AddMemberModal;
