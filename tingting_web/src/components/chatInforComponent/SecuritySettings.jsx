import React, { useState, useEffect, useCallback } from "react";
import Switch from "react-switch";
import { FaTrash, FaDoorOpen, FaSignOutAlt, FaUserShield } from "react-icons/fa";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setSelectedMessage, setChatInfoUpdate, setMessages, setLastMessageUpdate } from "../../redux/slices/chatSlice";
import { Api_Profile } from "../../../apis/api_profile";
import {
  getChatInfo,
  onChatInfo,
  offChatInfo,
  hideChat,
  deleteAllChatHistory,
  transferGroupAdmin,
  disbandGroup,
  leaveGroup,
  onError,
  offError,
  onChatInfoUpdated,
  offChatInfoUpdated,
} from "../../services/sockets/events/chatInfo";

const SecuritySettings = ({ socket, conversationId, userId, setChatInfo, userRoleInGroup, setUserRoleInGroup, chatInfo }) => {
  const [isHidden, setIsHidden] = useState(chatInfo?.participants?.find((p) => p.userId === userId)?.isHidden || false);
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [isGroup, setIsGroup] = useState(chatInfo?.isGroup || false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isAdmin = userRoleInGroup === "admin";
  const dispatch = useDispatch();

  const fetchChatInfo = useCallback(async () => {
    try {
      setLoadingMembers(true);
      getChatInfo(socket, { conversationId }, async (response) => {
        if (!response.success) {
          toast.error("Không thể lấy thông tin cuộc trò chuyện.");
          setLoadingMembers(false);
          return;
        }
        const data = response.data;
        setIsGroup(data.isGroup);
        setUserRoleInGroup(data.participants.find((p) => p.userId === userId)?.role || null);
        setChatInfo(data);
        dispatch(setChatInfoUpdate(data));

        const members = data.participants.filter((p) => p.userId !== userId);
        const detailedMembers = await Promise.all(
          members.map(async (p) => {
            try {
              const userResponse = await Api_Profile.getProfile(p.userId);
              const userData = userResponse?.data?.user || {};
              return {
                userId: p.userId,
                name: `${userData.firstname || ""} ${userData.surname || ""}`.trim() || p.userId,
              };
            } catch {
              return { userId: p.userId, name: p.userId };
            }
          })
        );
        setGroupMembers(detailedMembers);
        setLoadingMembers(false);
      });
    } catch {
      toast.error("Lỗi hệ thống. Vui lòng thử lại.");
      setLoadingMembers(false);
    }
  }, [socket, conversationId, userId, setChatInfo, setUserRoleInGroup, dispatch]);

  useEffect(() => {
    if (!socket || !conversationId || !userId) return;
    fetchChatInfo();

    onChatInfo(socket, (data) => {
      setIsGroup(data.isGroup);
      setUserRoleInGroup(data.participants.find((p) => p.userId === userId)?.role || null);
      setChatInfo(data);
      dispatch(setChatInfoUpdate(data));
    });

    onChatInfoUpdated(socket, async (updatedInfo) => {
      if (updatedInfo._id !== conversationId) return;
      setIsHidden(updatedInfo.participants.find((p) => p.userId === userId)?.isHidden || false);
      setChatInfo(updatedInfo);
      setUserRoleInGroup(updatedInfo.participants.find((p) => p.userId === userId)?.role || null);
      setIsGroup(updatedInfo.isGroup);
      dispatch(setChatInfoUpdate(updatedInfo));

      const members = updatedInfo.participants.filter((p) => p.userId !== userId);
      const detailedMembers = await Promise.all(
        members.map(async (p) => {
          try {
            const userResponse = await Api_Profile.getProfile(p.userId);
            const userData = userResponse?.data?.user || {};
            return {
              userId: p.userId,
              name: `${userData.firstname || ""} ${userData.surname || ""}`.trim() || p.userId,
            };
          } catch {
            return { userId: p.userId, name: p.userId };
          }
        })
      );
      setGroupMembers(detailedMembers);
      setLoadingMembers(false);
    });

    onError(socket, (error) => toast.error(error.message || "Lỗi hệ thống."));

    return () => {
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, userId, fetchChatInfo, setChatInfo, setUserRoleInGroup, dispatch]);

const handleHideChat = useCallback(
  async (hide, pin) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      hideChat(socket, { conversationId, isHidden: hide, pin }, (response) => {
        if (response.success) {
          setIsHidden(hide);
          setShowPinInput(false);
          setPin("");
          toast.success(hide ? "Đã ẩn trò chuyện!" : "Đã hiện trò chuyện!");
          setChatInfo((prev) => ({
            ...prev,
            participants: prev.participants.map((p) =>
              p.userId === userId ? { ...p, isHidden: hide, pin: hide ? pin : null } : p
            ),
          }));
          dispatch(setChatInfoUpdate({
            ...chatInfo,
            participants: chatInfo.participants.map((p) =>
              p.userId === userId ? { ...p, isHidden: hide, pin: hide ? pin : null } : p
            ),
          }));
          // Cập nhật selectedMessage để phản ánh trạng thái isHidden
          dispatch(setSelectedMessage({
            ...chatInfo,
            isHidden: hide,
          }));
        } else {
          toast.error(`Lỗi khi ${hide ? "ẩn" : "hiện"} trò chuyện: ${response.message}`);
        }
        setIsProcessing(false);
      });
    } catch {
      toast.error("Lỗi khi ẩn/hiện trò chuyện.");
      setIsProcessing(false);
    }
  },
  [socket, conversationId, userId, chatInfo, dispatch, isProcessing]
);

  const handleToggle = useCallback((checked) => {
    if (checked && !isHidden) {
      setShowPinInput(true);
    } else {
      handleHideChat(checked, null);
    }
  }, [isHidden, handleHideChat]);

  const handleSubmitPin = useCallback(() => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error("Mã PIN phải là 4 chữ số!");
      return;
    }
    handleHideChat(true, pin);
  }, [pin, handleHideChat]);

  const confirmDeleteHistory = useCallback(async () => {
    // *** SỬA Ở ĐÂY ***
    // Thêm dispatch setLastMessageUpdate để cập nhật lastMessage trong Redux ngay lập tức
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      dispatch(setMessages([]));
      dispatch(setSelectedMessage(null));
      dispatch(setChatInfoUpdate({ ...chatInfo, media: [], files: [], links: [], lastMessage: null }));
      dispatch(setLastMessageUpdate({ conversationId, lastMessage: null })); // Thêm dòng này
      toast.success("Đã xóa lịch sử trò chuyện!");
      setShowDeleteConfirm(false);
      deleteAllChatHistory(socket, { conversationId }, (response) => {
        if (!response.success) {
          toast.error("Lỗi khi xóa lịch sử ở server: " + response.message);
        }
        setIsProcessing(false);
      });
    } catch {
      toast.error("Lỗi khi xóa lịch sử.");
      setIsProcessing(false);
    }
  }, [socket, conversationId, chatInfo, dispatch, isProcessing]);

  const handleLeaveGroup = useCallback(() => {
    if (!isGroup || !userId) {
      toast.error("Dữ liệu không hợp lệ.");
      return;
    }
    if (isAdmin && groupMembers.length === 0) {
      toast.error("Bạn là thành viên duy nhất. Vui lòng giải tán nhóm.");
      return;
    }
    if (isAdmin) {
      setShowTransferAdminModal(true);
    } else {
      setShowLeaveConfirm(true);
    }
  }, [isGroup, userId, isAdmin, groupMembers]);

  const confirmLeaveGroup = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      leaveGroup(socket, { conversationId, userId }, (response) => {
        if (response.success) {
          toast.success("Bạn đã rời khỏi nhóm!");
          setChatInfo((prev) => ({
            ...prev,
            participants: prev.participants.filter((p) => p.userId !== userId),
          }));
          dispatch(setChatInfoUpdate({
            ...chatInfo,
            participants: chatInfo.participants.filter((p) => p.userId !== userId),
          }));
          dispatch(setSelectedMessage(null));
        } else {
          toast.error("Lỗi khi rời nhóm: " + response.message);
        }
        setShowLeaveConfirm(false);
        setIsProcessing(false);
      });
    } catch {
      toast.error("Lỗi khi rời nhóm.");
      setShowLeaveConfirm(false);
      setIsProcessing(false);
    }
  }, [socket, conversationId, userId, chatInfo, dispatch, isProcessing]);

  const handleTransferAdminAndLeave = useCallback(async () => {
    if (!newAdminUserId) {
      toast.error("Vui lòng chọn thành viên để chuyển quyền.");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await new Promise((resolve, reject) => {
        transferGroupAdmin(socket, { conversationId, userId: newAdminUserId }, (response) => {
          if (response.success) {
            resolve();
          } else {
            toast.error("Lỗi khi chuyển quyền: " + response.message);
            reject(new Error(response.message));
          }
        });
      });
      leaveGroup(socket, { conversationId, userId }, (response) => {
        if (response.success) {
          toast.success("Bạn đã rời khỏi nhóm!");
          setChatInfo((prev) => ({
            ...prev,
            participants: prev.participants.filter((p) => p.userId !== userId),
          }));
          dispatch(setChatInfoUpdate({
            ...chatInfo,
            participants: chatInfo.participants.filter((p) => p.userId !== userId),
          }));
          dispatch(setSelectedMessage(null));
        } else {
          toast.error("Lỗi khi rời nhóm: " + response.message);
        }
        setShowTransferAdminModal(false);
        setNewAdminUserId("");
        setIsProcessing(false);
      });
    } catch {
      toast.error("Lỗi khi chuyển quyền hoặc rời nhóm.");
      setShowTransferAdminModal(false);
      setIsProcessing(false);
    }
  }, [socket, conversationId, userId, newAdminUserId, chatInfo, dispatch, isProcessing]);

  const handleTransferAdmin = useCallback(async () => {
    if (!newAdminUserId) {
      toast.error("Vui lòng chọn thành viên để chuyển quyền.");
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      transferGroupAdmin(socket, { conversationId, userId: newAdminUserId }, (response) => {
        if (response.success) {
          setShowTransferAdminModal(false);
          setNewAdminUserId("");
          dispatch(setChatInfoUpdate(response.data));
        } else {
          toast.error("Lỗi khi chuyển quyền: " + response.message);
        }
        setIsProcessing(false);
      });
    } catch {
      toast.error("Lỗi khi chuyển quyền.");
      setIsProcessing(false);
    }
  }, [socket, conversationId, newAdminUserId, dispatch, isProcessing]);

  const confirmDisbandGroup = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      disbandGroup(socket, { conversationId }, (response) => {
        if (response.success) {
          dispatch(setSelectedMessage(null));
        } else {
          toast.error("Lỗi khi giải tán nhóm: " + response.message);
        }
        setShowDisbandConfirm(false);
        setIsProcessing(false);
      });
    } catch {
      toast.error("Lỗi khi giải tán nhóm.");
      setShowDisbandConfirm(false);
      setIsProcessing(false);
    }
  }, [socket, conversationId, dispatch, isProcessing]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <FaUserShield className="mr-2" /> Cài đặt bảo mật
      </h2>

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Ẩn trò chuyện</span>
          <Switch
            onChange={handleToggle}
            checked={isHidden}
            disabled={isProcessing}
            onColor="#3b82f6"
            offColor="#d1d5db"
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
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              placeholder="****"
              disabled={isProcessing}
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={() => { setShowPinInput(false); setPin(""); }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-3 rounded"
                disabled={isProcessing}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitPin}
                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded disabled:bg-blue-300"
                disabled={isProcessing}
              >
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isProcessing}
      >
        <FaTrash size={16} /> Xóa lịch sử trò chuyện
      </button>

      {isGroup && (
        <>
          <button
            className="w-full text-red-500 text-left flex items-center gap-2 mt-2"
            onClick={handleLeaveGroup}
            disabled={isProcessing}
          >
            <FaDoorOpen size={16} /> Rời nhóm
          </button>

          {isAdmin && (
            <>
              <button
                className="w-full text-blue-500 text-left flex items-center gap-2 mt-2"
                onClick={() => setShowTransferAdminModal(true)}
                disabled={isProcessing}
              >
                <FaUserShield size={16} /> Chuyển quyền trưởng nhóm
              </button>
              <button
                className="w-full text-red-600 text-left flex items-center gap-2 mt-2"
                onClick={() => setShowDisbandConfirm(true)}
                disabled={isProcessing}
              >
                <FaSignOutAlt size={16} /> Giải tán nhóm
              </button>
            </>
          )}
        </>
      )}

      {showTransferAdminModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Chuyển quyền trưởng nhóm</h2>
            {loadingMembers ? (
              <p className="text-center text-gray-500">Đang tải...</p>
            ) : groupMembers.length === 0 ? (
              <p className="text-center text-red-500">Không có thành viên để chuyển quyền.</p>
            ) : (
              <>
                <select
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={newAdminUserId}
                  onChange={(e) => setNewAdminUserId(e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="">Chọn thành viên</option>
                  {groupMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => { setShowTransferAdminModal(false); setNewAdminUserId(""); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded mr-2"
                    disabled={isProcessing}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleTransferAdmin}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300"
                    disabled={!newAdminUserId || isProcessing}
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Xác nhận giải tán nhóm</h2>
            <p className="mb-4">Bạn có chắc chắn muốn giải tán nhóm này không?</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDisbandConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded mr-2"
                disabled={isProcessing}
              >
                Hủy
              </button>
              <button
                onClick={confirmDisbandGroup}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded disabled:bg-red-300"
                disabled={isProcessing}
              >
                Giải tán
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Xác nhận rời nhóm</h2>
            <p className="mb-4">Bạn có chắc chắn muốn rời khỏi nhóm này không?</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded mr-2"
                disabled={isProcessing}
              >
                Hủy
              </button>
              <button
                onClick={confirmLeaveGroup}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded disabled:bg-red-300"
                disabled={isProcessing}
              >
                Rời nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Xác nhận</h2>
            <p className="mb-4">Bạn có chắc chắn muốn xóa lịch sử trò chuyện?</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded mr-2"
                disabled={isProcessing}
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteHistory}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded disabled:bg-red-300"
                disabled={isProcessing}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;