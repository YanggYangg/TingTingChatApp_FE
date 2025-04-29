import React, { useEffect, useState, useMemo } from "react";
import Modal from "react-modal";
import { Api_Profile } from "../../../apis/api_profile";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { FaTrash } from "react-icons/fa";
import { initSocket, onMemberRemoved } from "../../../../socket";

Modal.setAppElement("#root");

const MemberListModal = ({ isOpen, onClose, chatInfo, currentUserId, onMemberRemoved }) => {
  const [memberDetails, setMemberDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!currentUserId) return;
    const newSocket = initSocket(currentUserId);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!socket || !chatInfo?._id) return;

    socket.on("memberRemoved", (data) => {
      if (data.conversationId === chatInfo._id) {
        setMemberDetails((prev) => {
          const newDetails = { ...prev };
          delete newDetails[data.userId];
          return newDetails;
        });
        if (onMemberRemoved) {
          onMemberRemoved(data.userId);
        }
      }
    });

    return () => {
      socket.off("memberRemoved");
    };
  }, [socket, chatInfo, onMemberRemoved]);

  useEffect(() => {
    const checkAdminStatus = () => {
      const adminMember = chatInfo?.participants?.find(
        (member) => member.userId === currentUserId && member.role === "admin"
      );
      setIsAdmin(!!adminMember);
    };
    checkAdminStatus();
  }, [chatInfo, currentUserId]);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!chatInfo?.participants) return;

      setLoadingDetails(true);
      setErrorDetails(null);
      const details = {};
      const abortController = new AbortController();

      try {
        const fetchPromises = chatInfo.participants.map(async (member) => {
          const response = await Api_Profile.getProfile(member.userId, {
            signal: abortController.signal,
          });
          details[member.userId] = {
            name: response?.data?.user
              ? `${response.data.user.firstname} ${response.data.user.surname}`.trim()
              : "Không tìm thấy",
            avatar: response?.data?.user?.avatar || null,
            role: member.role,
          };
        });

        await Promise.all(fetchPromises);
        setMemberDetails(details);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorDetails("Không thể tải thông tin thành viên. Vui lòng thử lại.");
        }
      } finally {
        setLoadingDetails(false);
      }

      return () => abortController.abort();
    };

    if (isOpen && chatInfo) {
      fetchMemberDetails();
    }
  }, [isOpen, chatInfo]);

  const handleRemoveMember = async (memberIdToRemove) => {
    if (!isAdmin || currentUserId === memberIdToRemove) return;

    const confirmRemove = window.confirm("Bạn có chắc chắn muốn xóa thành viên này?");
    if (!confirmRemove) return;

    try {
      await Api_chatInfo.removeParticipant(chatInfo._id, { userId: memberIdToRemove });
      socket.emit("removeMember", { conversationId: chatInfo._id, userId: memberIdToRemove });
    } catch (error) {
      console.error("Lỗi khi xóa thành viên:", error);
      alert("Không thể xóa thành viên. Vui lòng thử lại.");
    }
  };

  const sortedMembers = useMemo(
    () =>
      chatInfo?.participants
        ?.map((member) => ({
          userId: member.userId,
          role: member.role,
          name: memberDetails[member.userId]?.name || "Không tên",
          avatar: memberDetails[member.userId]?.avatar,
        }))
        .sort((a, b) => (a.role === "admin" ? -1 : b.role === "admin" ? 1 : 0)),
    [chatInfo, memberDetails]
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="bg-white w-96 p-5 rounded-lg shadow-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]"
    >
      <h2 className="text-lg font-bold mb-3">Thành viên ({chatInfo?.participants?.length || 0})</h2>
      {loadingDetails ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : errorDetails ? (
        <p className="text-red-500">{errorDetails}</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {sortedMembers?.map((member) => (
            <li
              key={member.userId}
              className="py-2 border-b last:border-none flex items-center justify-between"
            >
              <div className="flex items-center">
                <img
                  src={member.avatar || "https://via.placeholder.com/40"}
                  alt={member.name}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <span className="text-gray-800">{member.name}</span>
                {member.role === "admin" && <span className="ml-1 text-xs text-blue-500">(Admin)</span>}
              </div>
              {isAdmin && currentUserId !== member.userId && (
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="text-red-500 hover:text-red-700"
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
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
      >
        Đóng
      </button>
    </Modal>
  );
};

export default MemberListModal;