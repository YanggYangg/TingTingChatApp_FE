import React, { useState, useEffect, useCallback } from "react";
import Switch from "react-switch";
import { FaTrash, FaDoorOpen, FaSignOutAlt, FaUserShield } from "react-icons/fa";
import { Api_Profile } from "../../../apis/api_profile";
import {
  getChatInfo,
  onChatInfoUpdated, // Thay onChatInfo bằng onChatInfoUpdated
  offChatInfoUpdated,
  hideChat,
  deleteChatHistoryForMe,
  leaveGroup,
  transferGroupAdmin,
  onError,
} from "../../services/sockets/events/chatInfo";
import { onConversationUpdate, offConversationUpdate } from "../../services/sockets/events/conversation";

const SecuritySettings = ({ socket, conversationId, userId, setChatInfo, userRoleInGroup, chatInfo }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // Thêm trạng thái xử lý
  const isAdmin = userRoleInGroup === "admin";

  const fetchChatInfo = useCallback(async () => {
    try {
      setLoadingMembers(true);
      getChatInfo(socket, { conversationId }, (response) => {
        if (response.success) {
          const data = response.data;
          setIsGroup(data.isGroup);
          const participant = data.participants.find((p) => p.userId === userId);
          setIsHidden(participant ? participant.isHidden : false);

          // Lấy thông tin chi tiết của các thành viên khác
          const members = data.participants.filter((p) => p.userId !== userId);
          Promise.all(
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
          ).then((detailedMembers) => {
            setGroupMembers(detailedMembers);
            setLoadingMembers(false);
          });

          setChatInfo(data);
        } else {
          console.error("Lỗi khi lấy thông tin cuộc trò chuyện:", response.message);
          setLoadingMembers(false);
        }
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin cuộc trò chuyện:", error);
      setLoadingMembers(false);
    }
  }, [socket, conversationId, userId, setChatInfo]);

  useEffect(() => {
    fetchChatInfo();

    // Lắng nghe sự kiện chatInfoUpdated
    onChatInfoUpdated(socket, (data) => {
      console.log("Nhận chatInfoUpdated:", data); // Log để gỡ lỗi
      if (data.conversationId === conversationId) {
        setIsGroup(data.isGroup || false);
        const participant = data.participants.find((p) => p.userId === userId);
        setIsHidden(participant ? participant.isHidden : false);
        setChatInfo(data);
      }
    });

    // Lắng nghe lỗi
    onError(socket, (error) => {
      console.error("Lỗi từ server:", error.message);
      setLoadingMembers(false);
      setIsProcessing(false);
    });

    return () => {
      offChatInfoUpdated(socket);
      socket.off("error");
      offConversationUpdate(socket);
    };
  }, [fetchChatInfo, socket, conversationId]);

  const handleToggle = async (checked) => {
    if (checked && !isHidden) {
      setShowPinInput(true);
    } else {
      await handleHideChat(checked, null);
    }
  };

  const handleHideChat = async (hide, pin) => {
    setIsProcessing(true);
    try {
      hideChat(socket, { conversationId, isHidden: hide, pin }, (response) => {
        if (response.success) {
          setIsHidden(hide);
          setShowPinInput(false);
          setPin("");
        } else {
          alert("Lỗi khi ẩn/hiện trò chuyện: " + response.message);
        }
        setIsProcessing(false);
      });
    } catch (error) {
      console.error("Lỗi khi ẩn/hiện trò chuyện:", error);
      alert("Lỗi khi ẩn/hiện trò chuyện. Vui lòng thử lại.");
      setIsProcessing(false);
    }
  };

  const handleSubmitPin = () => {
    if (pin.length === 4 && /^\d{4}$/.test(pin)) {
      handleHideChat(true, pin);
    } else {
      alert("Mã PIN phải là 4 chữ số!");
      setIsProcessing(false);
    }
  };

  const handleDeleteHistory = async () => {
    setIsProcessing(true);
    try {
      deleteChatHistoryForMe(socket, { conversationId }, (response) => {
        if (response.success) {
          alert("Đã xóa lịch sử trò chuyện!");
        } else {
          alert("Lỗi khi xóa lịch sử trò chuyện: " + response.message);
        }
        setIsProcessing(false);
      });
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử trò chuyện:", error);
      alert("Lỗi khi xóa lịch sử. Vui lòng thử lại.");
      setIsProcessing(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!isGroup) return;

    if (!userId) {
      console.error("userId không tồn tại!");
      setIsProcessing(false);
      return;
    }

    const confirmLeave = window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này không?");
    if (confirmLeave) {
      setIsProcessing(true);
      try {
        leaveGroup(socket, { conversationId, userId }, (response) => {
          if (response.success) {
            alert("Bạn đã rời khỏi nhóm!");
            setChatInfo((prevChatInfo) => ({
              ...prevChatInfo,
              participants: prevChatInfo?.participants?.filter((p) => p.userId !== userId) || [],
            }));
          } else {
            alert("Lỗi khi rời nhóm: " + response.message);
          }
          setIsProcessing(false);
        });
      } catch (error) {
        console.error("Lỗi khi rời nhóm:", error);
        alert("Lỗi khi rời nhóm. Vui lòng thử lại.");
        setIsProcessing(false);
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
      setIsProcessing(true);
      try {
        // Giả sử bạn có hàm disbandGroup trong chatInfo
        // Thay thế bằng API hoặc socket phù hợp
        alert("Chức năng giải tán nhóm chưa được triển khai qua socket!");
        setIsProcessing(false);
      } catch (error) {
        console.error("Lỗi khi giải tán nhóm:", error);
        alert("Lỗi khi giải tán nhóm. Vui lòng thử lại.");
        setIsProcessing(false);
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
    setIsProcessing(true);
    try {
      transferGroupAdmin(socket, { conversationId, userId: newAdminUserId }, (response) => {
        if (response.success) {
          fetchChatInfo();
          alert("Quyền trưởng nhóm đã được chuyển!");
          handleCloseTransferAdminModal();
        } else {
          alert("Chuyển quyền trưởng nhóm không thành công: " + response.message);
          fetchChatInfo();
        }
        setIsProcessing(false);
      });
    } catch (err) {
      console.error("Lỗi khi chuyển quyền trưởng nhóm:", err);
      alert("Chuyển quyền trưởng nhóm không thành công. Vui lòng thử lại.");
      fetchChatInfo();
      setIsProcessing(false);
    }
  }, [socket, conversationId, newAdminUserId, handleCloseTransferAdminModal, fetchChatInfo]);

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
          disabled={isProcessing}
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
            disabled={isProcessing}
          />
          <button
            onClick={handleSubmitPin}
            className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition disabled:bg-blue-300"
            disabled={isProcessing}
          >
            {isProcessing ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      )}

      <button
        className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
        onClick={handleDeleteHistory}
        disabled={isProcessing}
      >
        <FaTrash size={16} />
        Xóa lịch sử trò chuyện
      </button>
      {isGroup && (
        <>
          <button
            className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
            onClick={handleLeaveGroup}
            disabled={isProcessing}
          >
            <FaDoorOpen size={16} />
            Rời nhóm
          </button>
          {isAdmin && (
            <>
              <button
                className="w-full text-blue-500 text-left flex items-center gap-2 mt-2"
                onClick={handleOpenTransferAdminModal}
                disabled={isProcessing}
              >
                <FaUserShield size={16} />
                Chuyển quyền trưởng nhóm
              </button>
              <button
                className="w-full text-red-600 text-left flex items-center gap-2 mt-2"
                onClick={handleDisbandGroup}
                disabled={isProcessing}
              >
                <FaSignOutAlt size={16} />
                Giải tán nhóm
              </button>
            </>
          )}
        </>
      )}

      {showTransferAdminModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
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
                  disabled={isProcessing}
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
                    disabled={isProcessing}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleTransferAdmin}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
                    disabled={!newAdminUserId || isProcessing}
                  >
                    {isProcessing ? "Đang xử lý..." : "Chuyển quyền"}
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