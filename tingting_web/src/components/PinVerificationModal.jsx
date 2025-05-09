import React, { useState } from "react";

const PinVerificationModal = ({ isOpen, onClose, conversationId, userId, socket, onVerified }) => {
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Xử lý xác thực mã PIN
  const handleVerifyPin = () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert("Mã PIN phải là 4 chữ số!");
      return;
    }

    setIsProcessing(true);
    socket.emit("verifyPin", { conversationId, userId, pin }, (response) => {
      console.log("PinVerificationModal: Phản hồi từ verifyPin:", response);
      setIsProcessing(false);
      if (response.success) {
        alert("Xác thực PIN thành công!");
        // Cập nhật trạng thái isHidden thành false
        socket.emit("updateChatInfo", {
          conversationId,
          userId,
          
        });
        onVerified();
      } else {
        alert(response.message || "Mã PIN không đúng!");
        setPin("");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-lg font-semibold mb-4">Nhập mã PIN</h2>
        <p className="text-sm text-gray-600 mb-2">Vui lòng nhập mã PIN</p>
        <input
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
          style={{ color: "black" }} // Chữ màu đen
          placeholder="****"
          disabled={isProcessing}
        />
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
            disabled={isProcessing}
          >
            Hủy
          </button>
          <button
            onClick={handleVerifyPin}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300"
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