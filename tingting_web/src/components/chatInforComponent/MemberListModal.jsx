import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { Api_Profile } from "../../../apis/api_profile";
import { removeParticipant, onError, onChatInfoUpdated, offChatInfoUpdated } from "../../services/sockets/events/chatInfo";
import { onConversationUpdate, offConversationUpdate } from "../../services/sockets/events/conversation";
import { FaTrash } from "react-icons/fa";

const MemberListModal = ({ socket, isOpen, onClose, chatInfo, currentUserId, onMemberRemoved }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [participants, setParticipants] = useState([]); // State để lưu danh sách thành viên
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (document.getElementById("root")) {
      Modal.setAppElement("#root");
    }
  }, []);

  // Khởi tạo participants từ chatInfo và kiểm tra vai trò admin
  useEffect(() => {
    if (chatInfo?.participants) {
      setParticipants(chatInfo.participants); // Khởi tạo danh sách thành viên từ props

      // Kiểm tra vai trò admin
      const adminMember = chatInfo.participants.find(
        (member) => member.userId === currentUserId && member.role === "admin"
      );
      setIsAdmin(!!adminMember);
    } else {
      setParticipants([]);
      setIsAdmin(false);
    }
  }, [chatInfo, currentUserId]);

  // Lắng nghe sự kiện chatInfoUpdated để cập nhật danh sách thành viên
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleChatInfoUpdated = (updatedInfo) => {
      if (updatedInfo.conversationId === chatInfo?._id) {
        setParticipants(updatedInfo.participants || []); // Cập nhật danh sách thành viên
        // Kiểm tra lại vai trò admin sau khi danh sách thay đổi
        const adminMember = updatedInfo.participants?.find(
          (member) => member.userId === currentUserId && member.role === "admin"
        );
        setIsAdmin(!!adminMember);
      }
    };

    onChatInfoUpdated(socket, handleChatInfoUpdated);

    return () => {
      offChatInfoUpdated(socket);
    };
  }, [socket, isOpen, chatInfo?._id, currentUserId]);

  // Lấy thông tin chi tiết của thành viên
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (participants.length > 0) {
        setLoadingDetails(true);
        setErrorDetails(null);
        const details = {};
        const fetchPromises = participants.map(async (member) => {
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

    if (isOpen && participants.length > 0) {
      fetchMemberDetails();
    } else {
      setMemberDetails({});
    }
  }, [isOpen, participants]);

  const handleRemoveMember = async (memberIdToRemove) => {
    if (isAdmin && currentUserId !== memberIdToRemove) {
      const confirmRemove = window.confirm(`Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?`);
      if (confirmRemove) {
        try {
          removeParticipant(socket, { conversationId: chatInfo._id, userId: memberIdToRemove }, (response) => {
            if (response.success) {
              if (onMemberRemoved) {
                onMemberRemoved(memberIdToRemove);
              }
            } else {
              alert("Lỗi khi xóa thành viên: " + response.message);
            }
          });

          // Lắng nghe cập nhật cuộc trò chuyện
          onConversationUpdate(socket, (data) => {
            if (data.conversationId === chatInfo._id) {
              if (onMemberRemoved) {
                onMemberRemoved(memberIdToRemove);
              }
            }
          });

          // Lắng nghe lỗi
          onError(socket, (error) => {
            alert("Lỗi khi xóa thành viên: " + error.message);
          });
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

  useEffect(() => {
    return () => {
      offConversationUpdate(socket);
      socket.off("error");
    };
  }, [socket]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]"
    >
      <h2 className="text-lg font-bold mb-3">
        Thành viên ({participants.length || 0})
      </h2>

      {loadingDetails ? (
        <p className="text-gray-500">Đang tải thông tin thành viên...</p>
      ) : errorDetails ? (
        <p className="text-red-500">{errorDetails}</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {participants.map((member) => (
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