import React, { useState, useEffect, useCallback } from "react";
import Switch from "react-switch";
import { FaTrash, FaDoorOpen, FaSignOutAlt, FaUserShield } from "react-icons/fa";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setSelectedMessage, setChatInfoUpdate, setMessages } from "../../redux/slices/chatSlice"; // Thêm setMessages
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

const SecuritySettings = ({
  socket,
  conversationId,
  userId,
  setChatInfo,
  userRoleInGroup,
  setUserRoleInGroup,
  chatInfo,
}) => {
  const [isHidden, setIsHidden] = useState(
    chatInfo?.participants?.find((p) => p.userId === userId)?.isHidden || false
  );
  const [pin, setPin] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDisbanding, setIsDisbanding] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isAdmin = userRoleInGroup === "admin";
  const dispatch = useDispatch();

  // Lấy thông tin chat
  const fetchChatInfo = useCallback(async () => {
    try {
      setLoadingMembers(true);
      getChatInfo(socket, { conversationId }, (response) => {
        console.log("SecuritySettings: Phản hồi từ getChatInfo", response);
        if (response.success) {
          const data = response.data;
          setIsGroup(data.isGroup);
          const participant = data.participants.find((p) => p.userId === userId);
          setUserRoleInGroup(participant?.role || null);

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
                console.error(`SecuritySettings: Lỗi khi lấy thông tin user ${p.userId}:`, error);
                return { userId: p.userId, name: p.userId };
              }
            })
          ).then((detailedMembers) => {
            setGroupMembers(detailedMembers);
            setLoadingMembers(false);
            console.log("SecuritySettings: Cập nhật groupMembers", detailedMembers);
          });

          setChatInfo(data);
          dispatch(setChatInfoUpdate(data));
        } else {
          console.error("SecuritySettings: Lỗi khi lấy thông tin chat:", response.message);
          toast.error("Không thể lấy thông tin cuộc trò chuyện.");
          setLoadingMembers(false);
        }
      });
    } catch (error) {
      console.error("SecuritySettings: Lỗi khi lấy thông tin chat:", error);
      toast.error("Lỗi hệ thống. Vui lòng thử lại.");
      setLoadingMembers(false);
    }
  }, [socket, conversationId, userId, setChatInfo, setUserRoleInGroup, dispatch]);

  // Đăng ký socket events
  useEffect(() => {
    if (!socket || !conversationId || !userId) {
      console.warn("SecuritySettings: Thiếu socket, conversationId hoặc userId", {
        socket,
        conversationId,
        userId,
      });
      return;
    }

    fetchChatInfo();

    onChatInfo(socket, (data) => {
      console.log("SecuritySettings: Nhận onChatInfo", data);
      setIsGroup(data.isGroup);
      const participant = data.participants.find((p) => p.userId === userId);
      setUserRoleInGroup(participant?.role || null);
      setChatInfo(data);
      dispatch(setChatInfoUpdate(data));
    });

    onChatInfoUpdated(socket, (updatedInfo) => {
      console.log("SecuritySettings: Nhận onChatInfoUpdated", updatedInfo);
      if (updatedInfo._id !== conversationId) return;

      const participant = updatedInfo.participants.find((p) => p.userId === userId);
      if (participant && participant.isHidden !== isHidden) {
        setIsHidden(participant.isHidden);
        console.log("SecuritySettings: Cập nhật isHidden từ sự kiện", {
          isHidden: participant.isHidden,
        });
      }

      setChatInfo((prev) => ({
        ...prev,
        ...updatedInfo,
        participants: updatedInfo.participants || prev.participants,
      }));
      setUserRoleInGroup(participant?.role || null);
      setIsGroup(updatedInfo.isGroup);

      const members = updatedInfo.participants.filter((p) => p.userId !== userId);
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
            console.error(`SecuritySettings: Lỗi khi lấy thông tin user ${p.userId}:`, error);
            return { userId: p.userId, name: p.userId };
          }
        })
      ).then((detailedMembers) => {
        setGroupMembers(detailedMembers);
        setLoadingMembers(false);
      });

      dispatch(setChatInfoUpdate(updatedInfo));
    });

    onError(socket, (error) => {
      console.error("SecuritySettings: Lỗi từ server:", error.message);
      toast.error(error.message || "Lỗi hệ thống.");
    });

    return () => {
      console.log("SecuritySettings: Gỡ sự kiện socket");
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, userId, fetchChatInfo, setChatInfo, setUserRoleInGroup, dispatch, isHidden]);

  // Xử lý ẩn/hiện trò chuyện
  const handleToggle = useCallback(
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
      if (isProcessing) {
        console.log("SecuritySettings: Đang xử lý, bỏ qua hideChat");
        return;
      }
      setIsProcessing(true);
      try {
        console.log("SecuritySettings: Gửi yêu cầu hideChat", { conversationId, isHidden: hide, pin });
        hideChat(socket, { conversationId, isHidden: hide, pin }, (response) => {
          console.log("SecuritySettings: Phản hồi từ hideChat", response);
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
            dispatch(
              setChatInfoUpdate({
                ...chatInfo,
                participants: chatInfo.participants.map((p) =>
                  p.userId === userId ? { ...p, isHidden: hide, pin: hide ? pin : null } : p
                ),
              })
            );
          } else {
            toast.error(`Lỗi khi ${hide ? "ẩn" : "hiện"} trò chuyện: ${response.message}`);
          }
          setIsProcessing(false);
        });
      } catch (error) {
        console.error("SecuritySettings: Lỗi khi ẩn/hiện trò chuyện:", error);
        toast.error("Lỗi khi ẩn/hiện trò chuyện. Vui lòng thử lại.");
        setIsProcessing(false);
      }
    },
    [socket, conversationId, isProcessing, chatInfo, dispatch, userId]
  );

  const handleSubmitPin = useCallback(() => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error("Mã PIN phải là 4 chữ số!");
      return;
    }
    handleHideChat(true, pin);
  }, [pin, handleHideChat]);

  // Xử lý xóa lịch sử trò chuyện và thoát về trang chính
  const handleDeleteHistory = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeleteHistory = useCallback(async () => {
    if (isProcessing) {
      console.log("SecuritySettings: Đang xử lý, bỏ qua deleteAllChatHistory");
      return;
    }
    setIsProcessing(true);
    try {
      console.log("SecuritySettings: Gửi yêu cầu deleteAllChatHistory", { conversationId });
      // Xóa tin nhắn cục bộ ngay lập tức
      dispatch(setMessages([])); // Thêm: Xóa tin nhắn ngay lập tức
      dispatch(setSelectedMessage(null)); // Thêm: Chuyển về trang chính ngay lập tức
      toast.success("Đã xóa toàn bộ lịch sử trò chuyện!");

      // Gửi yêu cầu xóa đến backend
      deleteAllChatHistory(socket, { conversationId }, (response) => {
        console.log("SecuritySettings: Phản hồi từ deleteAllChatHistory", response);
        if (!response.success) {
          toast.error("Lỗi khi xóa lịch sử ở server: " + response.message);
        }
        setShowDeleteConfirm(false);
        setIsProcessing(false);
      });
    } catch (error) {
      console.error("SecuritySettings: Lỗi khi xóa lịch sử:", error);
      toast.error("Lỗi khi xóa lịch sử. Vui lòng thử lại.");
      setShowDeleteConfirm(false);
      setIsProcessing(false);
    }
  }, [socket, conversationId, isProcessing, dispatch]);

  // Rời nhóm
  const handleLeaveGroup = useCallback(() => {
    if (!isGroup || !userId) {
      console.error("SecuritySettings: Dữ liệu không hợp lệ để rời nhóm", { isGroup, userId });
      toast.error("Không thể rời nhóm: Dữ liệu không hợp lệ.");
      return;
    }

    if (isAdmin && groupMembers.length === 0) {
      toast.error("Không thể rời nhóm: Bạn là thành viên duy nhất. Vui lòng giải tán nhóm.");
      return;
    }

    if (isAdmin) {
      setShowTransferAdminModal(true);
      setIsLeaving(true);
    } else {
      setShowLeaveConfirm(true);
    }
  }, [isGroup, userId, isAdmin, groupMembers]);

  const confirmLeaveGroup = useCallback(async () => {
    if (isProcessing) {
      console.log("SecuritySettings: Đang xử lý, bỏ qua confirmLeaveGroup");
      return;
    }
    setIsLeaving(true);
    setIsProcessing(true);
    try {
      console.log("SecuritySettings: Gửi yêu cầu leaveGroup", { conversationId, userId });
      leaveGroup(socket, { conversationId, userId }, (response) => {
        console.log("SecuritySettings: Phản hồi từ leaveGroup", response);
        if (response.success) {
          toast.success("Bạn đã rời khỏi nhóm!");
          setChatInfo((prev) => ({
            ...prev,
            participants: prev.participants.filter((p) => p.userId !== userId),
          }));
          dispatch(
            setChatInfoUpdate({
              ...chatInfo,
              participants: chatInfo.participants.filter((p) => p.userId !== userId),
            })
          );
          dispatch(setSelectedMessage(null));
        } else {
          toast.error("Lỗi khi rời nhóm: " + response.message);
        }
        setIsLeaving(false);
        setShowLeaveConfirm(false);
        setIsProcessing(false);
      });
    } catch (error) {
      console.error("SecuritySettings: Lỗi khi rời nhóm:", error);
      toast.error("Lỗi khi rời nhóm. Vui lòng thử lại.");
      setIsLeaving(false);
      setShowLeaveConfirm(false);
      setIsProcessing(false);
    }
  }, [socket, conversationId, userId, setChatInfo, chatInfo, dispatch, isProcessing]);

  const handleTransferAdminAndLeave = useCallback(async () => {
    if (!newAdminUserId) {
      toast.error("Vui lòng chọn một thành viên để chuyển quyền.");
      return;
    }
    if (isProcessing) {
      console.log("SecuritySettings: Đang xử lý, bỏ qua handleTransferAdminAndLeave");
      return;
    }
    setIsProcessing(true);
    try {
      console.log("SecuritySettings: Gửi yêu cầu transferGroupAdmin", {
        conversationId,
        userId: newAdminUserId,
      });
      await new Promise((resolve, reject) => {
        transferGroupAdmin(socket, { conversationId, userId: newAdminUserId }, (response) => {
          console.log("SecuritySettings: Phản hồi từ transferGroupAdmin", response);
          if (response.success) {
            toast.success("Quyền trưởng nhóm đã được chuyển!");
            resolve();
          } else {
            toast.error("Lỗi khi chuyển quyền: " + response.message);
            reject(new Error(response.message));
          }
        });
      });

      console.log("SecuritySettings: Gửi yêu cầu leaveGroup", { conversationId, userId });
      leaveGroup(socket, { conversationId, userId }, (response) => {
        console.log("SecuritySettings: Phản hồi từ leaveGroup", response);
        if (response.success) {
          toast.success("Bạn đã rời khỏi nhóm!");
          setChatInfo((prev) => ({
            ...prev,
            participants: prev.participants.filter((p) => p.userId !== userId),
          }));
          dispatch(
            setChatInfoUpdate({
              ...chatInfo,
              participants: chatInfo.participants.filter((p) => p.userId !== userId),
            })
          );
          dispatch(setSelectedMessage(null));
        } else {
          toast.error("Lỗi khi rời nhóm: " + response.message);
        }
        setIsLeaving(false);
        setShowTransferAdminModal(false);
        setNewAdminUserId("");
        setIsProcessing(false);
      });
    } catch (error) {
      console.error("SecuritySettings: Lỗi khi chuyển quyền và rời nhóm:", error);
      toast.error("Lỗi khi chuyển quyền hoặc rời nhóm. Vui lòng thử lại.");
      setIsLeaving(false);
      setShowTransferAdminModal(false);
      setIsProcessing(false);
    }
  }, [socket, conversationId, userId, newAdminUserId, setChatInfo, chatInfo, dispatch, isProcessing]);

  const handleTransferAdmin = useCallback(async () => {
    if (!newAdminUserId) {
      toast.error("Vui lòng chọn một thành viên để chuyển quyền.");
      return;
    }
    if (isProcessing) {
      console.log("SecuritySettings: Đang xử lý, bỏ qua handleTransferAdmin");
      return;
    }
    setIsProcessing(true);
    try {
      console.log("SecuritySettings: Gửi yêu cầu transferGroupAdmin", {
        conversationId,
        userId: newAdminUserId,
      });
      transferGroupAdmin(socket, { conversationId, userId: newAdminUserId }, (response) => {
        console.log("SecuritySettings: Phản hồi từ transferGroupAdmin", response);
        if (response.success) {
          toast.success("Quyền trưởng nhóm đã được chuyển!");
          setShowTransferAdminModal(false);
          setNewAdminUserId("");
          dispatch(setChatInfoUpdate(response.data));
        } else {
          toast.error("Lỗi khi chuyển quyền: " + response.message);
        }
        setIsProcessing(false);
      });
    } catch (error) {
      console.error("SecuritySettings: Lỗi khi chuyển quyền:", error);
      toast.error("Lỗi khi chuyển quyền. Vui lòng thử lại.");
      setIsProcessing(false);
    }
  }, [socket, conversationId, newAdminUserId, isProcessing, dispatch]);

  const handleDisbandGroup = useCallback(() => {
    if (!isGroup || !isAdmin) return;
    setShowDisbandConfirm(true);
  }, [isGroup, isAdmin]);

  const confirmDisbandGroup = useCallback(async () => {
    if (isProcessing) {
      console.log("SecuritySettings: Đang xử lý, bỏ qua confirmDisbandGroup");
      return;
    }
    setIsDisbanding(true);
    setIsProcessing(true);
    try {
      console.log("SecuritySettings: Gửi yêu cầu disbandGroup", { conversationId });
      disbandGroup(socket, { conversationId }, (response) => {
        console.log("SecuritySettings: Phản hồi từ disbandGroup", response);
        if (response.success) {
          toast.success("Nhóm đã được giải tán thành công!");
          dispatch(setSelectedMessage(null));
        } else {
          toast.error("Lỗi khi giải tán nhóm: " + response.message);
        }
        setIsDisbanding(false);
        setShowDisbandConfirm(false);
        setIsProcessing(false);
      });
    } catch (error) {
      console.error("SecuritySettings: Lỗi khi giải tán nhóm:", error);
      toast.error("Lỗi khi giải tán nhóm. Vui lòng thử lại.");
      setIsDisbanding(false);
      setShowDisbandConfirm(false);
      setIsProcessing(false);
    }
  }, [socket, conversationId, isProcessing, dispatch]);

  const handleCloseTransferAdminModal = useCallback(() => {
    setShowTransferAdminModal(false);
    setNewAdminUserId("");
    setIsLeaving(false);
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <FaUserShield className="mr-2" /> Cài đặt bảo mật
      </h2>
      {/* Ẩn trò chuyện */}
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
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              placeholder="****"
              disabled={isProcessing}
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={() => {
                  setShowPinInput(false);
                  setPin("");
                }}
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
            disabled={isLeaving || isProcessing}
          >
            <FaDoorOpen size={16} />
            {isLeaving ? "Đang rời nhóm..." : "Rời nhóm"}
          </button>

          {isAdmin && (
            <>
              <button
                className="w-full text-blue-500 text-left flex items-center gap-2 mt-2"
                onClick={() => setShowTransferAdminModal(true)}
                disabled={isProcessing}
              >
                <FaUserShield size={16} />
                Chuyển quyền trưởng nhóm
              </button>

              <button
                className="w-full text-red-600 text-left flex items-center gap-2 mt-2"
                onClick={handleDisbandGroup}
                disabled={isDisbanding || isProcessing}
              >
                <FaSignOutAlt size={16} />
                {isDisbanding ? "Đang giải tán..." : "Giải tán nhóm"}
              </button>
            </>
          )}
        </>
      )}

      {showTransferAdminModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">
              {isLeaving ? "Chuyển quyền trước khi rời nhóm" : "Chuyển quyền trưởng nhóm"}
            </h2>
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
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded mr-2"
                    disabled={isProcessing}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={isLeaving ? handleTransferAdminAndLeave : handleTransferAdmin}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300"
                    disabled={!newAdminUserId || isProcessing}
                  >
                    {isLeaving ? "Chuyển quyền và rời nhóm" : "Chuyển quyền"}
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
            <p className="mb-4">
              Bạn có chắc chắn muốn giải tán nhóm này không? Tất cả thành viên sẽ bị xóa và lịch sử trò chuyện sẽ bị mất.
            </p>
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
                disabled={isDisbanding || isProcessing}
              >
                {isDisbanding ? "Đang giải tán..." : "Giải tán"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Xác nhận rời nhóm</h2>
            <p className="mb-4">
              Bạn có chắc chắn muốn rời khỏi nhóm này không? Bạn sẽ không thể truy cập nhóm sau khi rời.
            </p>
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
                disabled={isLeaving || isProcessing}
              >
                {isLeaving ? "Đang rời..." : "Rời nhóm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-lg font-semibold mb-4">Xác nhận</h2>
            <p className="mb-4">
              Toàn bộ nội dung trò chuyện sẽ bị xóa và bạn sẽ thoát ra trang chính. Bạn có chắc chắn muốn xóa?
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded mr-2"
                disabled={isProcessing}
              >
                Không
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