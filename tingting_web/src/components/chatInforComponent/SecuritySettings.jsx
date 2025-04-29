import React, { useState, useEffect, useCallback } from "react";
import Switch from "react-switch";
import { FaTrash, FaDoorOpen, FaSignOutAlt, FaUserShield } from "react-icons/fa";
import axios from "axios";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../apis/api_profile";
import { initSocket } from "../../services/sockets/index";
import {  onConversationUpdate, offConversationUpdate } from "../../services/sockets/events/conversation";

const SecuritySettings = ({ conversationId, userId, setChatInfo, userRoleInGroup, chatInfo }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const isAdmin = userRoleInGroup === "admin";
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const newSocket = initSocket(userId);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.on("participantRemoved", (data) => {
      if (data.userId === userId) {
        alert("Bạn đã bị xóa khỏi nhóm!");
        setChatInfo(null);
      }
    });

    socket.on("groupDisbanded", (data) => {
      alert("Nhóm đã bị giải tán!");
      setChatInfo(null);
    });

    socket.on("groupAdminTransferred", (data) => {
      setChatInfo((prevChatInfo) => ({
        ...prevChatInfo,
        participants: data.participants,
      }));
      const participant = data.participants.find((p) => p.userId === userId);
      if (participant) {
        setUserRoleInGroup(participant.role);
      }
    });

    return () => {
      socket.off("participantRemoved");
      socket.off("groupDisbanded");
      socket.off("groupAdminTransferred");
    };
  }, [socket, conversationId, userId, setChatInfo]);

  const fetchChatInfo = useCallback(async () => {
    try {
      setLoadingMembers(true);
      const response = await axios.get(`http://localhost:5000/conversations/${conversationId}`);
      setIsGroup(response.data.isGroup);
      const participant = response.data.participants.find((p) => p.userId === userId);
      setIsHidden(participant ? participant.isHidden : false);

      const members = response.data.participants.filter((p) => p.userId !== userId);
      const detailedMembers = await Promise.all(
        members.map(async (p) => {
          try {
            const userResponse = await Api_Profile.getProfile(p.userId);
            const userData = userResponse?.data?.user || {};
            return {
              userId: p.userId,
              name: `${userData.firstname || ""} ${userData.surname || ""}`.trim() || p.userId,
            };
          } catch (error) {
            console.error(`Lỗi khi lấy thông tin người dùng ${p.userId}:`, error);
            return {
              userId: p.userId,
              name: p.userId,
            };
          }
        })
      );

      setGroupMembers(detailedMembers);
      setLoadingMembers(false);
      setChatInfo(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin cuộc trò chuyện:", error);
      setLoadingMembers(false);
    }
  }, [conversationId, userId, setChatInfo]);

  useEffect(() => {
    fetchChatInfo();
  }, [fetchChatInfo]);

  const handleToggle = async (checked) => {
    if (checked && !isHidden) {
      setShowPinInput(true);
    } else {
      await handleHideChat(checked, null);
    }
  };

  const handleHideChat = async (hide, pin) => {
    try {
      await Api_chatInfo.hideChat(conversationId, { userId, isHidden: hide, pin });
      setIsHidden(hide);
      setShowPinInput(false);
      setPin("");
    } catch (error) {
      console.error("Lỗi khi ẩn/hiện trò chuyện:", error);
      alert("Lỗi khi ẩn/hiện trò chuyện. Vui lòng thử lại.");
    }
  };

  const handleSubmitPin = () => {
    if (pin.length === 4) {
      handleHideChat(true, pin);
    } else {
      alert("Mã PIN phải có 4 chữ số!");
    }
  };

  const handleDeleteHistory = async () => {
    try {
      await Api_chatInfo.deleteConversationHistory(conversationId);
      alert("Đã xóa lịch sử trò chuyện!");
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử trò chuyện:", error);
      alert("Lỗi khi xóa lịch sử. Vui lòng thử lại.");
    }
  };

  const handleLeaveGroup = async () => {
    if (!isGroup) return;

    if (!userId) {
      console.error("userId không tồn tại!");
      return;
    }

    const confirmLeave = window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này không?");
    if (confirmLeave) {
      try {
        await Api_chatInfo.removeParticipant(conversationId, { userId });
        alert("Bạn đã rời khỏi nhóm!");
        setChatInfo((prevChatInfo) => ({
          ...prevChatInfo,
          participants: prevChatInfo?.participants?.filter((p) => p.userId !== userId) || [],
        }));
      } catch (error) {
        console.error("Lỗi khi rời nhóm:", error);
      }
    }
  };

  const handleDisbandGroup = async () => {
    if (!isGroup || userRoleInGroup !== "admin") {
      return;
    }

    const confirmDisband = window.confirm(
      "Bạn có chắc chắn muốn giải tán nhóm này không? Tất cả thành viên sẽ bị xóa và lịch sử trò chuyện sẽ bị mất."
    );
    if (confirmDisband) {
      try {
        await Api_chatInfo.disbandGroup(conversationId, { userId });
        alert("Nhóm đã được giải tán!");
      } catch (error) {
        console.error("Lỗi khi giải tán nhóm:", error);
        alert("Lỗi khi giải tán nhóm. Vui lòng thử lại.");
      }
    }
  };

  const handleOpenTransferAdminModal = useCallback(() => {
    setShowTransferAdminModal(true);
  }, []);

  const handleCloseTransferAdminModal = useCallback(() => {
    setShowTransferAdminModal(false);
    setNewAdminUserId("");
  }, []);

  const handleTransferAdmin = useCallback(async () => {
    if (!newAdminUserId) {
      alert("Vui lòng chọn một thành viên để chuyển quyền trưởng nhóm.");
      return;
    }
    try {
      await Api_chatInfo.transferGroupAdmin(conversationId, {
        requesterUserId: userId,
        newAdminUserId,
      });
      alert("Quyền trưởng nhóm đã được chuyển!");
      handleCloseTransferAdminModal();
    } catch (err) {
      console.error("Lỗi khi chuyển quyền trưởng nhóm:", err);
      alert("Chuyển quyền trưởng nhóm không thành công. Vui lòng thử lại.");
      await fetchChatInfo();
    }
  }, [conversationId, userId, newAdminUserId, handleCloseTransferAdminModal, fetchChatInfo]);

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thiết lập bảo mật</h3>

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

      {showPinInput && (
        <div className="mt-2 p-3 bg-gray-100 rounded-lg">
          <label className="block text-sm font-semibold mb-1">Nhập mã PIN (4 chữ số)</label>
          <input
            type="password"
            maxLength={4}
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

      <button
        className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
        onClick={handleDeleteHistory}
      >
        <FaTrash size={16} />
        Xóa lịch sử trò chuyện
      </button>
      {isGroup && (
        <>
          <button
            className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
            onClick={handleLeaveGroup}
          >
            <FaDoorOpen size={16} />
            Rời nhóm
          </button>
          {isAdmin && (
            <>
              <button
                className="w-full text-blue-500 text-left flex items-center gap-2 mt-2"
                onClick={handleOpenTransferAdminModal}
              >
                <FaUserShield size={16} />
                Chuyển quyền trưởng nhóm
              </button>
              <button
                className="w-full text-red-600 text-left flex items-center gap-2 mt-2"
                onClick={handleDisbandGroup}
              >
                <FaSignOutAlt size={16} />
                Giải tán nhóm
              </button>
            </>
          )}
        </>
      )}

      {showTransferAdminModal && (
        <div className="fixed inset-0 flex justify-center items-center backdrop-filter backdrop-blur-[1px] z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Chuyển quyền trưởng nhóm</h2>
            {loadingMembers ? (
              <p className="text-center text-gray-500">Đang tải danh sách thành viên...</p>
            ) : groupMembers.length === 0 ? (
              <p className="text-center text-red-500">Không có thành viên để chuyển quyền.</p>
            ) : (
              <>
                <label
                  htmlFor="newAdmin"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Chọn thành viên mới:
                </label>
                <select
                  id="newAdmin"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newAdminUserId}
                  onChange={(e) => setNewAdminUserId(e.target.value)}
                >
                  <option value="">Chọn một thành viên</option>
                  {groupMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleCloseTransferAdminModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleTransferAdmin}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={!newAdminUserId}
                  >
                    Chuyển quyền
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;