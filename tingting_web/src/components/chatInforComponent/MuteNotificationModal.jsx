import { useState, useEffect } from "react";
import Modal from "react-modal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";

Modal.setAppElement("#root");

const MuteNotificationModal = ({ isOpen, onClose, conversationId, userId, onMuteSuccess }) => {
  const [selectedMuteTime, setSelectedMuteTime] = useState("1h");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirmMute = async () => {
    if (!conversationId || !userId) {
      setError("Thiếu thông tin để tắt thông báo.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await Api_chatInfo.updateNotification(conversationId, { mute: selectedMuteTime, userId });
      onClose();
      if (onMuteSuccess) {
        onMuteSuccess(selectedMuteTime);
      }
    } catch (error) {
      console.error("Lỗi khi tắt thông báo:", error);
      setError("Không thể tắt thông báo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedMuteTime("1h");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]"
      className="bg-white p-5 rounded-lg shadow-lg w-96"
    >
      <h2 className="text-lg font-bold mb-4">Tắt thông báo</h2>
      <p className="mb-3">Bạn có muốn tắt thông báo hội thoại này?</p>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
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
              disabled={loading}
            />
            {option.label}
          </label>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md mr-2"
          disabled={loading}
        >
          Hủy
        </button>
        <button
          onClick={handleConfirmMute}
          className={`px-4 py-2 text-white rounded-md ${loading ? "bg-blue-300" : "bg-blue-500"}`}
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "Đồng ý"}
        </button>
      </div>
    </Modal>
  );
};

export default MuteNotificationModal;