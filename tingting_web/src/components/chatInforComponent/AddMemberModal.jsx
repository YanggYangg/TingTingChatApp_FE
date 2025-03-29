import React from "react";
import Modal from "react-modal";

const AddMemberModal = ({ isOpen, onClose }) => {
  // Danh sách thành viên mẫu
  const members = [
    { id: "1", firstName: "Nguyễn", lastName: "Văn A", avatar: "https://cdn.vjshop.vn/tin-tuc/lam-the-nao-de-cai-thien-bo-cuc-duong-dan-trong-nhiep-anh/bo-cuc-duong-dan-1.png" },
    { id: "2", firstName: "Trần", lastName: "Thị B", avatar: "https://kyma.vn/StoreData/images/PageData/dinh-nghia-bo-cuc-duong-dan-va-cach-su-dung-no-de-tao-ra-buc-anh-dep.webp" },
    { id: "3", firstName: "Lê", lastName: "Văn C", avatar: "https://hoangphucphoto.com/wp-content/uploads/2023/12/bc-dd-thumb.webp" },
    { id: "4", firstName: "Phạm", lastName: "Thị D", avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXq8MYeurVYm6Qhjyvzcgx99vXAlT-BGJ1ow&s" },
    { id: "5", firstName: "Nguyễn", lastName: "Văn A", avatar: "https://cdn.vjshop.vn/tin-tuc/lam-the-nao-de-cai-thien-bo-cuc-duong-dan-trong-nhiep-anh/bo-cuc-duong-dan-1.png" },
    { id: "6", firstName: "Trần", lastName: "Thị B", avatar: "https://kyma.vn/StoreData/images/PageData/dinh-nghia-bo-cuc-duong-dan-va-cach-su-dung-no-de-tao-ra-buc-anh-dep.webp" },
    { id: "7", firstName: "Lê", lastName: "Văn C", avatar: "https://hoangphucphoto.com/wp-content/uploads/2023/12/bc-dd-thumb.webp" },
    { id: "8", firstName: "Phạm", lastName: "Thị D", avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXq8MYeurVYm6Qhjyvzcgx99vXAlT-BGJ1ow&s" },
    { id: "9", firstName: "Nguyễn", lastName: "Văn A", avatar: "https://cdn.vjshop.vn/tin-tuc/lam-the-nao-de-cai-thien-bo-cuc-duong-dan-trong-nhiep-anh/bo-cuc-duong-dan-1.png" },
    { id: "10", firstName: "Trần", lastName: "Thị B", avatar: "https://kyma.vn/StoreData/images/PageData/dinh-nghia-bo-cuc-duong-dan-va-cach-su-dung-no-de-tao-ra-buc-anh-dep.webp" },
    { id: "11", firstName: "Lê", lastName: "Văn C", avatar: "https://hoangphucphoto.com/wp-content/uploads/2023/12/bc-dd-thumb.webp" },
    { id: "12", firstName: "Phạm", lastName: "Thị D", avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXq8MYeurVYm6Qhjyvzcgx99vXAlT-BGJ1ow&s" },
    
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
  overlayClassName="fixed inset-0 flex items-center justify-center z-50"
  className="bg-white p-4 rounded-lg shadow-lg w-96 max-h-[70vh] flex flex-col"
>
  {/* Header */}
  <h2 className="text-lg font-semibold mb-3 text-center">Thêm thành viên</h2>

  {/* Ô tìm kiếm */}
  <input
    type="text"
    placeholder="Nhập tên, số điện thoại..."
    className="w-full p-2 border rounded-md mb-3"
  />

  {/* Danh sách thành viên có thanh cuộn */}
  <div className="flex-1 overflow-y-auto">
    <ul className="space-y-2">
      {sortedMembers.map((member) => (
        <li key={member.id} className="flex items-center gap-2 p-2 border rounded-md">
          <img src={member.avatar} alt={`${member.firstName} ${member.lastName}`} className="w-8 h-8 rounded-full" />
          <p className="flex-1 text-sm">{member.lastName} {member.firstName}</p>
          <button className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs" onClick={() =>console.log("Thêm thành viên")}>Thêm</button>
        </li>
      ))}
    </ul>
  </div>

  {/* Footer cố định */}
  <div className="mt-3 flex justify-end gap-2 border-t pt-3">
    <button className="bg-gray-300 px-3 py-1 rounded-md text-sm" onClick={onClose}>
      Hủy
    </button>
  </div>
</Modal>

  
  );
};

export default AddMemberModal;
