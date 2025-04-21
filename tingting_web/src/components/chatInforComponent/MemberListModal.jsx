import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { Api_Profile } from "../../../apis/api_profile";

const MemberListModal = ({ isOpen, onClose, chatInfo }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    if (document.getElementById("root")) {
      Modal.setAppElement("#root");
    }
  }, []);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!chatInfo?.participants) {
        setErrorDetails("Không có thành viên để hiển thị.");
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      setErrorDetails(null);
      const details = {};

      const validParticipants = chatInfo.participants.filter(
        (member) => member.userId && typeof member.userId === "string"
      );

      if (validParticipants.length === 0) {
        setErrorDetails("Không có thành viên hợp lệ để hiển thị.");
        setLoadingDetails(false);
        return;
      }

      const fetchPromises = validParticipants.map(async (member) => {
        try {
          const response = await Api_Profile.getProfile(member.userId);
          details[member.userId] = {
            name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
            avatar: response.data.user.avatar || "https://via.placeholder.com/30/007bff/FFFFFF?Text=User",
          };
        } catch (error) {
          console.error("Lỗi khi lấy thông tin người dùng", member.userId, ":", error);
          details[member.userId] = { name: "Không tìm thấy", avatar: null };
        }
      });

      await Promise.all(fetchPromises);
      setMemberDetails(details);
      setLoadingDetails(false);
    };

    if (isOpen && chatInfo) {
      fetchMemberDetails();
    } else {
      setMemberDetails({});
    }
  }, [isOpen, chatInfo]);

  const validParticipants = chatInfo?.participants?.filter(
    (member) => member.userId && typeof member.userId === "string"
  ) || [];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]"
    >
      <h2 className="text-lg font-bold mb-3">Thành viên ({validParticipants.length || 0})</h2>

      {loadingDetails ? (
        <p className="text-gray-500">Đang tải thông tin thành viên...</p>
      ) : errorDetails ? (
        <p className="text-red-500">{errorDetails}</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {validParticipants.map((member) => (
            <li key={member.userId} className="py-2 border-b last:border-none flex items-center">
              <img
                src={memberDetails[member.userId]?.avatar || "https://via.placeholder.com/30/007bff/FFFFFF?Text=User"}
                alt={memberDetails[member.userId]?.name || "Người dùng"}
                className="w-10 h-10 rounded-full mr-3 object-cover"
              />
              <span className="text-gray-800">{memberDetails[member.userId]?.name || "Không tên"}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onClose}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-all"
      >
        Đóng
      </button>
    </Modal>
  );
};

export default MemberListModal;