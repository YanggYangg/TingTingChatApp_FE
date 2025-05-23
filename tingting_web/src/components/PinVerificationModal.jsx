import React, { useState } from "react";
import { XMarkIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // Import thêm icon mắt

const PinVerificationModal = ({ isOpen, onClose, conversationId, userId, socket, onVerified }) => {
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPin, setShowPin] = useState(false); // State để theo dõi trạng thái hiển thị PIN

const handleVerifyPin = () => {
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    setErrorMessage("Mã PIN phải là 4 chữ số!");
    return;
  }
  setErrorMessage("");

  setIsProcessing(true);
  socket.emit("verifyPin", { conversationId, userId, pin }, (response) => {
    setIsProcessing(false);
    if (response.success) {
      // Cập nhật trạng thái chatInfo để bỏ isHidden
      socket.emit("updateChatInfo", {
        conversationId,
        userId,
        isHidden: false, // Tạm thời bỏ ẩn sau khi xác thực
      });
      onVerified();
    } else {
      setErrorMessage(response.message || "Mã PIN không đúng!");
      setPin("");
    }
  });
};
  const toggleShowPin = () => {
    setShowPin(!showPin);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <LockClosedIcon className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Xác thực PIN</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Thông báo */}
        <p className="text-gray-700 mb-4">Để xem cuộc trò chuyện này, vui lòng nhập mã PIN.</p>

        {/* Input PIN với nút hiển thị/ẩn */}
        <div className="relative mb-4">
          <label htmlFor="pin" className="block text-sm font-medium text-gray-700 sr-only">
            Mã PIN
          </label>
          <input
            type={showPin ? "text" : "password"} // Thay đổi kiểu input dựa trên state showPin
            id="pin"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className={`w-full px-4 py-3 rounded-md border ${
              errorMessage ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono text-black`} // Thêm text-black
            placeholder="••••"
            disabled={isProcessing}
          />
          <button
            type="button"
            onClick={toggleShowPin}
            className="absolute inset-y-0 right-3 flex items-center px-2 text-gray-500 focus:outline-none"
          >
            {showPin ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
          </button>
          {errorMessage && <p className="mt-1 text-sm text-red-500">{errorMessage}</p>}
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            disabled={isProcessing}
          >
            Hủy
          </button>
          <button
            onClick={handleVerifyPin}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-blue-300"
            disabled={isProcessing}
          >
            {isProcessing ? "Đang xác thực..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinVerificationModal;