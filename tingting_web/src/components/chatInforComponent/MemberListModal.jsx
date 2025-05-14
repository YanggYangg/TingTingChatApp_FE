import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { Api_Profile } from "../../../apis/api_profile";
import { Api_Conversation } from "../../../apis/Api_Conversation";
import { FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../redux/slices/chatSlice";
import { useNavigate } from "react-router-dom";
import { removeParticipant, onError } from "../../services/sockets/events/chatInfo";

const MemberListModal = ({ socket, isOpen, onClose, chatInfo, currentUserId, onMemberRemoved }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (document.getElementById("root")) {
      Modal.setAppElement("#root");
    }
  }, []);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (chatInfo?.participants && currentUserId) {
        const adminMember = chatInfo.participants.find(
          (member) => member.userId === currentUserId && member.role === "admin"
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
      if (!chatInfo?.participants) {
        setErrorDetails("Không có thông tin thành viên");
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      setErrorDetails(null);
      const details = {};

      try {
        const fetchPromises = chatInfo.participants.map(async (member) => {
          try {
            const response = await Api_Profile.getProfile(member.userId);
            if (response?.data?.user) {
              details[member.userId] = {
                name: `${response.data.user.firstname || ""} ${response.data.user.surname || ""}`.trim() || "Không tên",
                avatar: response.data.user.avatar || "https://via.placeholder.com/150",
                role: member.role,
              };
            } else {
              details[member.userId] = {
                name: "Không tìm thấy",
                avatar: "https://via.placeholder.com/150",
                role: member.role,
              };
            }
          } catch (error) {
            console.error(`Lỗi khi lấy thông tin người dùng ${member.userId}:`, error);
            details[member.userId] = {
              name: "Lỗi tải",
              avatar: "https://via.placeholder.com/150",
              role: member.role,
            };
          }
        });

        await Promise.all(fetchPromises);
        setMemberDetails(details);
      } catch (error) {
        setErrorDetails("Lỗi khi tải thông tin thành viên");
        console.error("Lỗi khi lấy thông tin thành viên:", error);
      } finally {
        setLoadingDetails(false);
      }
    };

    if (isOpen && chatInfo) {
      fetchMemberDetails();
    } else {
      setMemberDetails({});
      setLoadingDetails(false);
    }
  }, [isOpen, chatInfo]);

  const openConfirmModal = (userId) => {
    setMemberToRemove(userId);
    setShowConfirmModal(true);
  };

  const confirmRemove = () => {
    if (memberToRemove) {
      handleRemoveMember(memberToRemove);
      setShowConfirmModal(false);
      setMemberToRemove(null);
    }
  };

  const cancelRemove = () => {
    setShowConfirmModal(false);
    setMemberToRemove(null);
  };

  const handleRemoveMember = async (memberIdToRemove) => {
    if (!socket) {
      console.error("Socket chưa kết nối, không thể xóa thành viên!");
      return;
    }

    if (!isAdmin) {
      console.error("Bạn không có quyền xóa thành viên khỏi nhóm này.");
      return;
    }

    if (currentUserId === memberIdToRemove) {
      console.error("Bạn không thể tự xóa mình khỏi đây. Hãy rời nhóm từ trang thông tin nhóm.");
      return;
    }

    try {
      removeParticipant(socket, { conversationId: chatInfo._id, userId: memberIdToRemove }, (response) => {
        if (response.success) {
          console.log("Đã xóa thành viên khỏi nhóm!");
          if (onMemberRemoved) {
            onMemberRemoved(memberIdToRemove);
          }
        } else {
          console.error("Lỗi khi xóa thành viên:", response.message);
        }
      });

      onError(socket, (error) => {
        console.error("Lỗi từ server khi xóa thành viên:", error);
      });
    } catch (error) {
      console.error("Lỗi khi xóa thành viên:", error);
    }
  };

  const handleMemberClick = async (memberId) => {
    if (memberId === currentUserId) {
      console.log("Bạn không thể trò chuyện với chính mình!");
      return;
    }

    try {
      const res = await Api_Conversation.getOrCreateConversation(currentUserId, memberId);

      if (res?.conversationId) {
        const conversationId = res.conversationId;
        dispatch(
          setSelectedMessage({
            id: conversationId,
            isGroup: false,
            participants: [
              { userId: currentUserId },
              { userId: memberId },
            ],
          })
        );
        navigate("/chat");
        onClose();
      } else {
        console.error("Không thể lấy hoặc tạo hội thoại:", res?.message || "Không có conversationId");
      }
    } catch (error) {
      console.error("Lỗi khi bắt đầu trò chuyện:", error);
    }
  };

  useEffect(() => {
    return () => {
      socket?.off("error");
    };
  }, [socket]);

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
            <li
              key={member.userId}
              className="py-2 border-b last:border-none flex items-center justify-between hover:bg-gray-100 cursor-pointer"
              onClick={() => handleMemberClick(member.userId)}
            >
              <div className="flex items-center">
                <img
                  src={memberDetails[member.userId]?.avatar || "https://via.placeholder.com/150"}
                  alt={memberDetails[member.userId]?.name || "Người dùng"}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <span className="text-gray-800">{memberDetails[member.userId]?.name || "Không tên"}</span>
                {memberDetails[member.userId]?.role === "admin" && (
                  <span className="ml-1 text-xs text-blue-500">(Admin)</span>
                )}
              </div>
              {isAdmin && currentUserId !== member.userId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openConfirmModal(member.userId);
                  }}
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

      {showConfirmModal && (
        <div className="fixed inset-0 bg-opacity-70 z-[9999] flex items-center justify-center" overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]">
          <div className="bg-white w-[300px] h-[200px] rounded-lg shadow-lg p-6 flex flex-col justify-between">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Xác nhận</h3>
            <p className="mb-6 text-gray-700">
              Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelRemove}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Hủy
              </button>
              <button
                onClick={confirmRemove}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MemberListModal;
