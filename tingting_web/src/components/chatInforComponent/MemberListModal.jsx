// Path: src/components/chatInforComponent/MemberListModal.js
import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { Api_Profile } from "../../../apis/api_profile";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { FaTrash } from "react-icons/fa";

const MemberListModal = ({ isOpen, onClose, chatInfo, currentUserId, onMemberRemoved }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (document.getElementById("root")) {
      Modal.setAppElement("#root");
    }
  }, []);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (chatInfo?.participants && currentUserId) {
        const adminMember = chatInfo.participants.find(
          (member) => member.userId === currentUserId && member.role === 'admin'
        );
        setIsAdmin(!!adminMember);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [chatInfo, currentUserId]);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (chatInfo?.participants) {
        setLoadingDetails(true);
        setErrorDetails(null);
        const details = {};
        const fetchPromises = chatInfo.participants.map(async (member) => {
          try {
            const response = await Api_Profile.getProfile(member.userId);
            if (response?.data?.user) {
              details[member.userId] = {
                name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
                avatar: response.data.user.avatar,
                role: member.role,
              };
            } else {
              details[member.userId] = { name: "Không tìm thấy", avatar: null, role: member.role };
            }
          } catch (error) {
            console.error("Lỗi khi lấy thông tin người dùng:", error);
            details[member.userId] = { name: "Lỗi tải", avatar: null, role: member.role };
          }
        });

        await Promise.all(fetchPromises);
        setMemberDetails(details);
        setLoadingDetails(false);
      }
    };

    if (isOpen && chatInfo) {
      fetchMemberDetails();
    } else {
      setMemberDetails({});
    }
  }, [isOpen, chatInfo]);

  const handleRemoveMember = async (memberIdToRemove) => {
    if (isAdmin && currentUserId !== memberIdToRemove) {
      const confirmRemove = window.confirm(`Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?`);
      if (confirmRemove) {
        try {
          await Api_chatInfo.removeParticipant(chatInfo._id, { userId: memberIdToRemove });
          if (onMemberRemoved) {
            onMemberRemoved(memberIdToRemove);
          }
        } catch (error) {
          console.error("Lỗi khi xóa thành viên:", error);
          alert("Lỗi khi xóa thành viên. Vui lòng thử lại.");
        }
      }
    } else if (currentUserId === memberIdToRemove) {
      alert("Bạn không thể tự xóa mình khỏi đây. Hãy rời nhóm từ trang thông tin nhóm.");
    } else {
      alert("Bạn không có quyền xóa thành viên khỏi nhóm này.");
    }
  };

  if (!chatInfo?.participants) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]"
    >
      <h2 className="text-lg font-bold mb-3">
        Thành viên ({chatInfo.participants.length || 0})
      </h2>

      {loadingDetails ? (
        <p className="text-gray-500">Đang tải thông tin thành viên...</p>
      ) : errorDetails ? (
        <p className="text-red-500">{errorDetails}</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {chatInfo.participants.map((member) => (
            <li key={member.userId} className="py-2 border-b last:border-none flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={memberDetails[member.userId]?.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXq8MYeurVYm6Qhjyvzcgx99vXAlT-BGJ1ow&s"}
                  alt={memberDetails[member.userId]?.name || "Người dùng"}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <span className="text-gray-800">{memberDetails[member.userId]?.name || "Không tên"}</span>
                {memberDetails[member.userId]?.role === 'admin' && (
                  <span className="ml-1 text-xs text-blue-500">(Admin)</span>
                )}
              </div>
              {isAdmin && currentUserId !== member.userId && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label={`Xóa ${memberDetails[member.userId]?.name}`}
                >
                  <FaTrash size={16} />
                </button>
              )}
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