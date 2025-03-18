import React, { useState } from "react";
import Switch from "react-switch"; // Import react-switch
import { FaExclamationTriangle, FaTrash, FaDoorOpen } from "react-icons/fa";

const SecuritySettings = () => {
  const [isHidden, setIsHidden] = useState(false); // State điều khiển switch
  const [pin, setPin] = useState(""); // State lưu mã PIN
  const [showPinInput, setShowPinInput] = useState(false); // State hiển thị form nhập PIN

  const handleToggle = (checked) => {
    console.log(`Ẩn trò chuyện: ${checked ? "Bật" : "Tắt"}`);
    if (checked) {
      setShowPinInput(true);
    } else {
      setIsHidden(false);
      setShowPinInput(false);
      setPin("");
    }
  };

  const handleSubmitPin = () => {
    if (pin.length === 4) {
      setIsHidden(true);
      setShowPinInput(false);
      console.log("Mã PIN đã nhập:", pin);
      console.log("Ẩn trò chuyện đã được kích hoạt!");
    } else {
      alert("Mã PIN phải có 4 chữ số!");
      console.log("Mã PIN không hợp lệ!");
    }
  };

  const handleReport = () => {
    console.log("Người dùng đã nhấn vào Báo xấu!");
  };

  const handleDeleteHistory = () => {
    console.log("Người dùng đã nhấn vào Xóa lịch sử trò chuyện!");
  };

  const handleLeaveGroup = () => {
    console.log("Người dùng đã nhấn vào Rời nhóm!");
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thiết lập bảo mật</h3>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">Tin nhắn tự xóa</span>
        <span className="text-xs text-gray-500">Chỉ dành cho trưởng hoặc phó nhóm</span>
      </div>

      {/* Ẩn trò chuyện - sử dụng react-switch */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">Ẩn trò chuyện</span>
        <Switch
          onChange={handleToggle}
          checked={isHidden}
          offColor="#ccc"
          onColor="#3b82f6"
          uncheckedIcon={false}
          checkedIcon={false}
          height={22}
          width={44}
          handleDiameter={18}
        />
      </div>

      {/* Form nhập mã PIN */}
      {showPinInput && (
        <div className="mt-2 p-3 bg-gray-100 rounded-lg">
          <label className="block text-sm font-semibold mb-1">Nhập mã PIN (4 chữ số)</label>
          <input
            type="password"
            maxLength="4"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            placeholder="****"
          />
          <button
            onClick={handleSubmitPin}
            className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
          >
            Xác nhận
          </button>
        </div>
      )}

      {/* Các nút hành động */}
      <button
        className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
        onClick={handleReport}
      >
        <FaExclamationTriangle size={16} />
        Báo xấu
      </button>
      <button
        className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
        onClick={handleDeleteHistory}
      >
        <FaTrash size={16} />
        Xóa lịch sử trò chuyện
      </button>
      <button
        className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
        onClick={handleLeaveGroup}
      >
        <FaDoorOpen size={16} />
        Rời nhóm
      </button>
    </div>
  );
};

export default SecuritySettings;
