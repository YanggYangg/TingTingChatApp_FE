import React, { useState, useEffect } from "react";

const EditNameModal = ({ isOpen, onClose, initialName = "", onSave }) => {
  const [newName, setNewName] = useState(initialName);

  useEffect(() => {
    setNewName(initialName);
  }, [initialName, isOpen]);

  const handleSave = () => {
    if (!newName.trim()) {
      alert("Tên không được để trống!");
      return;
    }
    // Thêm xác nhận trước khi lưu
    if (window.confirm("Bạn có chắc muốn thay đổi tên nhóm thành: " + newName.trim() + "?")) {
      onSave(newName.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Chỉnh sửa tên</h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border p-2 rounded w-full mb-4"
          placeholder="Nhập tên mới"
          autoFocus
        />
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded ${
              newName.trim()
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!newName.trim()}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditNameModal;