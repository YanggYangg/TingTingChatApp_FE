import React, { useState, useEffect } from "react";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message, confirmText = "Xác nhận", cancelText = "Hủy" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded mr-2"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditNameModal = ({ isOpen, onClose, initialName = "", onSave }) => {
  const [newName, setNewName] = useState(initialName);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setNewName(initialName);
  }, [initialName, isOpen]);

  const handleSave = () => {
    if (!newName.trim()) {
      alert("Tên không được để trống!");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    onSave(newName.trim());
    setIsConfirmOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
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
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        message={`Bạn có chắc muốn thay đổi tên nhóm thành: ${newName.trim()}?`}
      />
    </>
  );
};

export default EditNameModal;