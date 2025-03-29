import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

const AddMemberModal = ({ isOpen, onClose }) => {
  const chatId = "67e2d6bef1ea6ac96f10bf91";
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [existingMembers, setExistingMembers] = useState([]); // Danh sách thành viên đã có trong nhóm

  // Danh sách thành viên có thể thêm vào nhóm
  const members = [
    { id: "5", firstName: "Nguyễn", lastName: "Văn A", avatar: "https://cdn.vjshop.vn/tin-tuc/lam-the-nao-de-cai-thien-bo-cuc-duong-dan-trong-nhiep-anh/bo-cuc-duong-dan-1.png" },
    { id: "6", firstName: "Trần", lastName: "Thị B", avatar: "https://kyma.vn/StoreData/images/PageData/dinh-nghia-bo-cuc-duong-dan-va-cach-su-dung-no-de-tao-ra-buc-anh-dep.webp" },
    { id: "7", firstName: "Lê", lastName: "Văn C", avatar: "https://hoangphucphoto.com/wp-content/uploads/2023/12/bc-dd-thumb.webp" },
    { id: "8", firstName: "Phạm", lastName: "Thị D", avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXq8MYeurVYm6Qhjyvzcgx99vXAlT-BGJ1ow&s" },
  ];

  // Lấy danh sách thành viên hiện tại trong nhóm
  useEffect(() => {
    const fetchExistingMembers = async () => {
      try {
        const response = await Api_chatInfo.getParticipants(chatId);
        setExistingMembers(response.data || []); // Đảm bảo luôn là mảng
      } catch (error) {
        console.error("Lỗi khi lấy danh sách thành viên:", error);
        setExistingMembers([]); // Đặt giá trị mặc định để tránh lỗi
      }
    };
  
    if (isOpen) fetchExistingMembers();
  }, [isOpen]);
  
  // Sắp xếp danh sách theo họ tên (A-Z)
  const sortedMembers = [...members].sort((a, b) => {
    return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
  });

  // Lọc danh sách theo từ khóa tìm kiếm
  const filteredMembers = sortedMembers.filter((member) =>
    `${member.lastName} ${member.firstName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lọc những thành viên chưa có trong nhóm
  const availableMembers = filteredMembers.filter(
    (member) => existingMembers?.some && !existingMembers.some((m) => m.id === member.id)
  );
  
  // Thêm thành viên vào nhóm chat
  const addMember = async (memberId) => {
    if (!chatId) {
      setError("Lỗi: Không tìm thấy ID cuộc trò chuyện!");
      return;
    }

    if (!memberId) {
      setError("Lỗi: Thành viên không hợp lệ!");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      const participantData = { userId: memberId, role: "member" };
      await Api_chatInfo.addParticipant(chatId, participantData);

      // Cập nhật danh sách thành viên đã có trong nhóm
      setExistingMembers([...existingMembers, { id: memberId }]);
      setSuccessMessage("Thêm thành viên thành công!");
    } catch (error) {
      console.error("Lỗi khi thêm thành viên:", error.response?.data || error.message);
      setError("Lỗi khi thêm thành viên. Vui lòng thử lại!");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Thêm thành viên"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 "
      className="bg-white p-4 rounded-lg shadow-lg w-96 max-h-[70vh] flex flex-col"
    >
      <h2 className="text-lg font-semibold mb-3 text-center">Thêm thành viên</h2>

      {/* Ô tìm kiếm */}
      <input
        type="text"
        placeholder="Nhập tên, số điện thoại..."
        className="w-full p-2 border rounded-md mb-3"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Hiển thị thông báo lỗi */}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}

      {/* Danh sách thành viên chưa có trong nhóm */}
      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {availableMembers.map((member) => (
            <li key={member.id} className="flex items-center gap-2 p-2 border rounded-md">
              <img src={member.avatar} alt={`${member.firstName} ${member.lastName}`} className="w-8 h-8 rounded-full" />
              <p className="flex-1 text-sm">{member.lastName} {member.firstName}</p>
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs"
                onClick={() => addMember(member.id)}
              >
                Thêm
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex justify-end gap-2 border-t pt-3">
        <button className="bg-gray-300 px-3 py-1 rounded-md text-sm" onClick={onClose}>
          Hủy
        </button>
      </div>
    </Modal>
  );
};

export default AddMemberModal;
