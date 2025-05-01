import React, { useState, useEffect, useCallback } from "react";
import Switch from "react-switch";
import { FaTrash, FaDoorOpen, FaSignOutAlt, FaUserShield } from "react-icons/fa";
import { toast } from "react-toastify";
import { Api_Profile } from "../../../apis/api_profile";
import {
  getChatInfo,
  onChatInfo,
  offChatInfo,
  hideChat,
  deleteChatHistoryForMe,
  removeParticipant,
  transferGroupAdmin,
  disbandGroup,
  onError,
  offError,
} from "../../services/sockets/events/chatInfo";
import { onConversationUpdate, offConversationUpdate } from "../../services/sockets/events/conversation";

const SecuritySettings = ({
  socket,
  conversationId,
  userId,
  setChatInfo,
  userRoleInGroup,
  chatInfo,
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [isDisbanding, setIsDisbanding] = useState(false);
  const isAdmin = userRoleInGroup === "admin";

  // Lấy thông tin chat
  const fetchChatInfo = useCallback(async () => {
    try {
      setLoadingMembers(true);
      getChatInfo(socket, { conversationId }, (response) => {
        if (response.success) {
          const data = response.data;
          setIsGroup(data.isGroup);
          const participant = data.participants.find((p) => p.userId === userId);
          setIsHidden(participant?.isHidden || false);

          // Lấy thông tin thành viên
          const members = data.participants.filter((p) => p.userId !== userId);
          Promise.all(
            members.map(async (p) => {
              try {
                const userResponse = await Api_Profile.getProfile(p.userId);
                const userData = userResponse?.data?.user || {};
                return {
                  userId: p.userId,
                  name: `${userData.firstname || ""} ${
                    userData.surname || ""
                  }`.trim() || p.userId,
                };
              } catch (error) {
                console.error(`Lỗi khi lấy thông tin user ${p.userId}:`, error);
                return { userId: p.userId, name: p.userId };
              }
            })
          ).then((detailedMembers) => {
            setGroupMembers(detailedMembers);
            setLoadingMembers(false);
          });

          setChatInfo(data);
        } else {
          console.error("Lỗi khi lấy thông tin chat:", response.message);
          toast.error("Không thể lấy thông tin cuộc trò chuyện.");
          setLoadingMembers(false);
        }
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin chat:", error);
      toast.error("Lỗi hệ thống. Vui lòng thử lại.");
      setLoadingMembers(false);
    }
  }, [socket, conversationId, userId, setChatInfo]);

  // Đăng ký socket events
  useEffect(() => {
    if (!socket || !conversationId || !userId) {
      console.warn("Thiếu socket, conversationId hoặc userId");
      return;
    }

    fetchChatInfo();

    onChatInfo(socket, (data) => {
      setIsGroup(data.isGroup);
      const participant = data.participants.find((p) => p.userId === userId);
      setIsHidden(participant?.isHidden || false);
      setChatInfo(data);
    });

    onError(socket, (error) => {
      console.error("Lỗi từ server:", error.message);
      toast.error(error.message || "Lỗi hệ thống.");
    });

    return () => {
      offChatInfo(socket);
      offError(socket);
    };
  }, [socket, conversationId, userId, fetchChatInfo, setChatInfo]);

  // Xử lý ẩn/hiện trò chuyện
  const handleToggleHideChat = useCallback(
    async (checked) => {
      if (checked && !isHidden) {
        setShowPinInput(true);
      } else {
        await handleHideChat(checked, null);
      }
    },
    [isHidden]
  );

  const handleHideChat = useCallback(
    async (hide, pin) => {
      try {
        hideChat(socket, { conversationId, isHidden: hide, pin }, (response) => {
          if (response.success) {
            setIsHidden(hide);
            setShowPinInput(false);
            setPin("");
            toast.success(hide ? "Đã ẩn trò chuyện!" : "Đã hiện trò chuyện!");
          } else {
            toast.error("Lỗi khi ẩn/hiện trò chuyện: " + response.message);
          }
        });
      } catch (error) {
        console.error("Lỗi khi ẩn/hiện trò chuyện:", error);
        toast.error("Lỗi khi ẩn/hiện trò chuyện. Vui lòng thử lại.");
      }
    },
    [socket, conversationId]
  );

  const handleSubmitPin = useCallback(() => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error("Mã PIN phải là 4 chữ số!");
      return;
    }
    handleHideChat(true, pin);
  }, [pin, handleHideChat]);

  // Xóa lịch sử trò chuyện
  const handleDeleteHistory = useCallback(async () => {
    try {
      deleteChatHistoryForMe(socket, { conversationId }, (response) => {
        if (response.success) {
          alert("Xóa thành công!");
          toast.success("Đã xóa lịch sử trò chuyện!");
        } else {
          toast.error("Lỗi khi xóa lịch sử: " + response.message);
        }
      });
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử:", error);
      toast.error("Lỗi khi xóa lịch sử. Vui lòng thử lại.");
    }
  }, [socket, conversationId]);

  // Rời nhóm
  const handleLeaveGroup = useCallback(async () => {
    if (!isGroup || !userId) {
      toast.error("Không thể rời nhóm: Dữ liệu không hợp lệ.");
      return;
    }

    setShowDisbandConfirm(false);
    const confirm = window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm này không?");
    if (!confirm) return;

    try {
      removeParticipant(socket, { conversationId, userId }, (response) => {
        if (response.success) {
          toast.success("Bạn đã rời khỏi nhóm!");
          setChatInfo((prev) => ({
            ...prev,
            participants: prev.participants.filter((p) => p.userId !== userId),
          }));
        } else {
          toast.error("Lỗi khi rời nhóm: " + response.message);
        }
      });
    } catch (error) {
      console.error("Lỗi khi rời nhóm:", error);
      toast.error("Lỗi khi rời nhóm. Vui lòng thử lại.");
    }
  }, [socket, conversationId, userId, isGroup, setChatInfo]);

  // Giải tán nhóm
  const handleDisbandGroup = useCallback(() => {
    if (!isGroup || !isAdmin) return;
    setShowDisbandConfirm(true);
  }, [isGroup, isAdmin]);

  const confirmDisbandGroup = useCallback(async () => {
    setIsDisbanding(true);
    try {
      disbandGroup(socket, { conversationId }, (response) => {
        if (response.success) {
          toast.success("Nhóm đã được giải tán thành công!");
        } else {
          toast.error("Lỗi khi giải tán nhóm: " + response.message);
        }
        setIsDisbanding(false);
        setShowDisbandConfirm(false);
      });
    } catch (error) {
      console.error("Lỗi khi giải tán nhóm:", error);
      toast.error("Lỗi khi giải tán nhóm. Vui lòng thử lại.");
      setIsDisbanding(false);
      setShowDisbandConfirm(false);
    }
  }, [socket, conversationId]);

  // Chuyển quyền trưởng nhóm
  const handleOpenTransferAdminModal = useCallback(() => {
    setShowTransferAdminModal(true);
  }, []);

  const handleCloseTransferAdminModal = useCallback(() => {
    setShowTransferAdminModal(false);
    setNewAdminUserId("");
  }, []);

  const handleTransferAdmin = useCallback(async () => {
    if (!newAdminUserId) {
      toast.error("Vui lòng chọn một thành viên để chuyển quyền.");
      return;
    }
    try {
      transferGroupAdmin(socket, { conversationId, userId: newAdminUserId }, (response) => {
        if (response.success) {
          toast.success("Quyền trưởng nhóm đã được chuyển!");
          fetchChatInfo();
          handleCloseTransferAdminModal();
        } else {
          toast.error("Lỗi khi chuyển quyền: " + response.message);
          fetchChatInfo();
        }
      });
    } catch (error) {
      console.error("Lỗi khi chuyển quyền:", error);
      toast.error("Lỗi khi chuyển quyền. Vui lòng thử lại.");
      fetchChatInfo();
    }
  }, [socket, conversationId, newAdminUserId, fetchChatInfo, handleCloseTransferAdminModal]);

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Thiết lập bảo mật</h3>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">Ẩn trò chuyện</span>
        <Switch
          onChange={handleToggleHideChat}
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
                disabled={isDisbanding}
              >
                <FaSignOutAlt size={16} />
                {isDisbanding ? "Đang giải tán..." : "Giải tán nhóm"}
              </button>
            </>
          )}
        </>
      )}

      {showTransferAdminModal && (
        <div className="fixed inset-0 flex items-center justify-center">
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
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded mr-2"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleTransferAdmin}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
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

      {showDisbandConfirm && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Xác nhận giải tán nhóm</h2>
            <p className="mb-4">
              Bạn có chắc chắn muốn giải tán nhóm này không? Tất cả thành viên sẽ bị xóa và lịch sử trò chuyện sẽ bị mất.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDisbandConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded mr-2"
              >
                Hủy
              </button>
              <button
                onClick={confirmDisbandGroup}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                disabled={isDisbanding}
              >
                {isDisbanding ? "Đang giải tán..." : "Giải tán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;