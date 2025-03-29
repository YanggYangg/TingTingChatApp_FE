import { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const MuteNotificationModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedMuteTime, setSelectedMuteTime] = useState("1h");

  const handleConfirmMute = () => {
    console.log(`Đã tắt thông báo trong ${selectedMuteTime}`);
    if (onConfirm) {
      onConfirm(selectedMuteTime);
    } else {
      console.error("onConfirm is not defined!");
    }
  };

  useEffect(() => {
    console.log("Trạng thái modal:", isOpen);
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]" 
      className="bg-white p-5 rounded-lg shadow-lg w-96"
    >
      <h2 className="text-lg font-bold mb-4">Xác nhận</h2>
      <p className="mb-3">Bạn có chắc muốn tắt thông báo hội thoại này?</p>
      <div className="flex flex-col space-y-2">
        {[
          { value: "1h", label: "Trong 1 giờ" },
          { value: "4h", label: "Trong 4 giờ" },
          { value: "8am", label: "Cho đến 8:00 AM" },
          { value: "forever", label: "Cho đến khi được mở lại" },
        ].map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="radio"
              name="muteTime"
              value={option.value}
              checked={selectedMuteTime === option.value}
              onChange={() => setSelectedMuteTime(option.value)}
              className="mr-2"
            />
            {option.label}
          </label>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md mr-2">
          Hủy
        </button>
        <button onClick={handleConfirmMute} className="px-4 py-2 text-white bg-blue-500 rounded-md">
          Đồng ý
        </button>
      </div>
    </Modal>
  );
};

export default MuteNotificationModal;
