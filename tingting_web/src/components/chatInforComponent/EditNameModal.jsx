// EditNameModal.js

import React, { useState } from 'react';

const EditNameModal = ({ isOpen, onClose, onSave, initialName }) => {
  const [newName, setNewName] = useState(initialName || '');

  const handleSave = () => {
    onSave(newName);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"  overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]" >
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Chỉnh sửa tên</h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border p-2 rounded w-full mb-4"
          placeholder="Nhập tên mới"
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
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditNameModal;