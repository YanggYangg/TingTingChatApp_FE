import React from "react";
import Modal from "react-modal";

const AddMemberModal = ({ isOpen, onClose }) => {
  // Danh sách thành viên mẫu
  const members = [
    { id: "1", firstName: "Nguyễn", lastName: "Văn A", avatar: "https://cdn.vjshop.vn/tin-tuc/lam-the-nao-de-cai-thien-bo-cuc-duong-dan-trong-nhiep-anh/bo-cuc-duong-dan-1.png" },
    { id: "2", firstName: "Trần", lastName: "Thị B", avatar: "https://kyma.vn/StoreData/images/PageData/dinh-nghia-bo-cuc-duong-dan-va-cach-su-dung-no-de-tao-ra-buc-anh-dep.webp" },
    { id: "3", firstName: "Lê", lastName: "Văn C", avatar: "https://hoangphucphoto.com/wp-content/uploads/2023/12/bc-dd-thumb.webp" },
    { id: "4", firstName: "Phạm", lastName: "Thị D", avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXq8MYeurVYm6Qhjyvzcgx99vXAlT-BGJ1ow&s" },
  ];

  // Sắp xếp danh sách theo tên (A → Z) theo lastName trước, nếu trùng thì theo firstName
  const sortedMembers = [...members].sort((a, b) => {
    const fullNameA = `${a.lastName} ${a.firstName}`;
    const fullNameB = `${b.lastName} ${b.firstName}`;
    return fullNameA.localeCompare(fullNameB);
  });

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Thêm thành viên"
      className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50"
    >
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Thêm thành viên</h2>

        {/* Ô tìm kiếm */}
        <input
          type="text"
          placeholder="Nhập tên, số điện thoại..."
          className="w-full p-2 border rounded-md mb-4"
        />

        {/* Danh sách thành viên */}
        <ul className="space-y-3">
          {sortedMembers.map((member) => (
            <li key={member.id} className="flex items-center gap-3 p-2 border rounded-md">
              <img src={member.avatar} alt={`${member.firstName} ${member.lastName}`} className="w-10 h-10 rounded-full" />
              <p className="flex-1">{member.lastName} {member.firstName}</p>
              <button className="bg-blue-500 text-white px-3 py-1 rounded-md">Thêm</button>
            </li>
          ))}
        </ul>

        {/* Nút đóng */}
        <div className="flex justify-end gap-2 mt-4">
          <button className="bg-gray-300 px-4 py-2 rounded-md" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddMemberModal;
