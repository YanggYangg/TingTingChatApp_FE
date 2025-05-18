import React from "react";

function PinLimitModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Giới hạn ghim cuộc trò chuyện
        </h2>
        <p className="text-gray-600 mb-6">
          Bạn chỉ có thể ghim tối đa 5 cuộc trò chuyện!
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinLimitModal;