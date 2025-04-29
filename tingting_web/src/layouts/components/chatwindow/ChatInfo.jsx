import React, { useEffect, useState } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import GroupActionButton from "../../../components/chatInforComponent/GroupActionButton";
import GroupMemberList from "../../../components/chatInforComponent/GroupMemberList";
import GroupMediaGallery from "../../../components/chatInforComponent/GroupMediaGallery";
import GroupFile from "../../../components/chatInforComponent/GroupFile";
import GroupLinks from "../../../components/chatInforComponent/GroupLinks";
import SecuritySettings from "../../../components/chatInforComponent/SecuritySettings";
import MuteNotificationModal from "../../../components/chatInforComponent/MuteNotificationModal";
import AddMemberModal from "../../../components/chatInforComponent/AddMemberModal";
import EditNameModal from "../../../components/chatInforComponent/EditNameModal";
import CreateGroupModal from "../../../components/chatInforComponent/CreateGroupModal";
import { Api_chatInfo } from "../../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../../apis/api_profile";
import { useSocket } from "../../../contexts/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedMessage, clearSelectedMessage } from "../../../redux/slices/chatSlice";
import {
  updateChatInfo,
  onChatInfoUpdated,
  offChatInfoUpdated,
  deleteMessage,
  onMessageDeleted,
  offMessageDeleted,
  removeMember,
  onMemberRemoved,
  offMemberRemoved,
  disbandGroup,
  onGroupDisbanded,
  offGroupDisbanded,
  leaveGroup,
  onUserLeftGroup,
  offUserLeftGroup,
} from "../../../services/sockets/events/chatInfo";

const ChatInfo = ({ userId, conversationId }) => {
  const [chatInfo, setChatInfo] = useState(null);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteDuration, setMuteDuration] = useState(null); // Lưu giá trị mute ("1h", "4h", "8am", "forever", hoặc null)
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [userRoleInGroup, setUserRoleInGroup] = useState(null);
  const [conversations, setConversations] = useState([]);

  const { socket } = useSocket();
  const dispatch = useDispatch();
  const selectedMessage = useSelector((state) => state.chat.selectedMessage);

  // Fetch chat info
  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const response = await Api_chatInfo.getChatInfo(conversationId);
        setChatInfo(response);

        const participant = response.participants.find((p) => p.userId === userId);
        if (participant) {
          setIsMuted(!!participant.mute);
          setMuteDuration(participant.mute || null);
          setIsPinned(!!participant.isPinned);
          setUserRoleInGroup(participant.role);
        } else {
          setIsMuted(false);
          setMuteDuration(null);
          setIsPinned(false);
          setUserRoleInGroup(null);
        }

        if (!response.isGroup) {
          const otherParticipant = response.participants.find((p) => p.userId !== userId);
          if (otherParticipant?.userId) {
            try {
              const userResponse = await Api_Profile.getProfile(otherParticipant.userId);
              setOtherUser(userResponse?.data?.user);
            } catch (error) {
              console.error("Lỗi khi lấy thông tin người dùng khác:", error);
              setOtherUser({ firstname: "Không tìm thấy", surname: "" });
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin chat:", error);
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchChatInfo();
    }
  }, [conversationId, userId]);

  // Listen for updates from Socket.IO
  useEffect(() => {
    if (!socket || !conversationId) return;

    onChatInfoUpdated(socket, (updatedChatInfo) => {
      if (updatedChatInfo.conversationId === conversationId) {
        setChatInfo((prev) => ({ ...prev, ...updatedChatInfo }));

        const participant = updatedChatInfo.participants?.find((p) => p.userId === userId);
        if (participant) {
          setIsMuted(!!participant.mute);
          setMuteDuration(participant.mute || null);
          setIsPinned(!!participant.isPinned);
          setUserRoleInGroup(participant.role || null);
        }

        // Cập nhật selectedMessage trong Redux để MessageList nhận được thay đổi
        if (selectedMessage?.id === updatedChatInfo.conversationId) {
          dispatch(
            setSelectedMessage({
              ...selectedMessage,
              name: updatedChatInfo.name || selectedMessage.name,
              imageGroup: updatedChatInfo.imageGroup || selectedMessage.imageGroup,
              participants: updatedChatInfo.participants || selectedMessage.participants,
            })
          );
        }
      }
    });

    onGroupDisbanded(socket, (data) => {
      if (data.conversationId === conversationId) {
        dispatch(clearSelectedMessage());
      }
    });

    onUserLeftGroup(socket, (data) => {
      if (data.conversationId === conversationId && data.userId === userId) {
        dispatch(clearSelectedMessage());
      }
    });

    onMessageDeleted(socket, ({ messageId, messageType }) => {
      if (messageType === "file" || messageType === "image") {
        setChatInfo((prev) => ({
          ...prev,
          files: prev.files?.filter((file) => file.messageId !== messageId) || [],
        }));
      } else if (messageType === "link") {
        setChatInfo((prev) => ({
          ...prev,
          links: prev.links?.filter((link) => link.messageId !== messageId) || [],
        }));
      }
    });

    onMemberRemoved(socket, (data) => {
      if (data.conversationId === conversationId) {
        setChatInfo((prev) => ({
          ...prev,
          participants: prev.participants?.filter((p) => p.userId !== data.userId) || [],
        }));
        handleMemberRemoved(data.userId);
      }
    });

    return () => {
      offChatInfoUpdated(socket);
      offGroupDisbanded(socket);
      offUserLeftGroup(socket);
      offMessageDeleted(socket);
      offMemberRemoved(socket);
    };
  }, [socket, conversationId, userId, dispatch, selectedMessage]);

  // Gửi sự kiện updateChatInfo khi trạng thái mute thay đổi
  useEffect(() => {
    if (!socket || !conversationId || !chatInfo) return;

    const participant = chatInfo.participants?.find((p) => p.userId === userId);
    if (participant && participant.mute !== muteDuration) {
      updateChatInfo(socket, {
        conversationId,
        participants: chatInfo.participants.map((p) =>
          p.userId === userId ? { ...p, mute: muteDuration } : p
        ),
      });
    }
  }, [muteDuration, socket, conversationId, chatInfo, userId]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await Api_chatInfo.updateGroupImage(conversationId, formData);
      const newImage = response?.data?.imageGroup;
      updateChatInfo(socket, {
        conversationId,
        imageGroup: newImage,
      });
    } catch (error) {
      console.error("Error updating group image:", error);
    }
  };

  const handleMuteNotification = async () => {
    if (isMuted) {
      try {
        await Api_chatInfo.updateNotification(conversationId, { userId, mute: null });
        setIsMuted(false);
        setMuteDuration(null);
      } catch (error) {
        console.error("Lỗi khi bật thông báo:", error);
        toast.error("Không thể bật thông báo. Vui lòng thử lại.");
      }
    } else {
      setIsMuteModalOpen(true);
    }
  };

  const handleMuteSuccess = async (muted) => {
    try {
      setIsMuted(!!muted);
      setMuteDuration(muted);
      setIsMuteModalOpen(false);

      // Cập nhật trạng thái mute qua API
      await Api_chatInfo.updateNotification(conversationId, { userId, mute: muted });
    } catch (error) {
      console.error("Lỗi khi tắt thông báo:", error);
      toast.error("Không thể tắt thông báo. Vui lòng thử lại.");
    }
  };

  const handlePinChat = async () => {
    if (!chatInfo) return;

    try {
      const newIsPinned = !isPinned;
      if (newIsPinned) {
        await Api_chatInfo.pinConversation(conversationId, userId);
      } else {
        await Api_chatInfo.unpinConversation(conversationId, userId);
      }
      setIsPinned(newIsPinned);

      const updatedChatInfo = await Api_chatInfo.getChatInfo(conversationId);
      updateChatInfo(socket, {
        conversationId,
        participants: updatedChatInfo.participants,
      });
    } catch (error) {
      console.error("Lỗi khi ghim/bỏ ghim cuộc trò chuyện:", error);
      toast.error(
        `Lỗi: ${
          error.response?.data?.message || "Lỗi khi ghim/bỏ ghim cuộc trò chuyện."
        }`
      );
    }
  };

  const copyToClipboard = () => {
    if (chatInfo?.linkGroup) {
      navigator.clipboard.writeText(chatInfo.linkGroup);
      toast.success("Đã sao chép link nhóm!");
    }
  };

  const handleAddMember = () => {
    setIsAddMemberModalOpen(true);
    setIsCreateGroupModalOpen(false);
  };

  const handleCreateGroupChat = () => {
    setIsCreateGroupModalOpen(true);
    setIsAddMemberModalOpen(false);
  };

  const handleCloseCreateGroupModal = () => {
    setIsCreateGroupModalOpen(false);
  };

  const handleCreateGroupSuccess = (newGroup) => {
    setConversations((prevConversations) => [...prevConversations, newGroup]);
    dispatch(setSelectedMessage(newGroup));
  };

  const handleMemberAdded = async () => {
    try {
      const updatedChatInfo = await Api_chatInfo.getChatInfo(conversationId);
      setChatInfo(updatedChatInfo);
      const participant = updatedChatInfo.participants.find((p) => p.userId === userId);
      if (participant) {
        setUserRoleInGroup(participant.role || null);
      }
      updateChatInfo(socket, {
        conversationId,
        participants: updatedChatInfo.participants,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật chatInfo sau khi thêm thành viên:", error);
    }
  };

  const handleMemberRemoved = (removedUserId) => {
    setChatInfo((prev) => ({
      ...prev,
      participants: prev.participants?.filter((p) => p.userId !== removedUserId) || [],
    }));
    updateChatInfo(socket, {
      conversationId,
      participants: chatInfo.participants?.filter((p) => p.userId !== removedUserId) || [],
    });
  };

  const handleDisbandGroup = async () => {
    if (!window.confirm("Bạn có chắc muốn giải tán nhóm này?")) return;

    try {
      await Api_chatInfo.disbandGroup(conversationId);
      disbandGroup(socket, { conversationId });
      toast.success("Nhóm đã được giải tán.");
    } catch (error) {
      console.error("Error disbanding group:", error);
      toast.error("Lỗi khi giải tán nhóm, vui lòng thử lại.");
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Bạn có chắc muốn rời nhóm này?")) return;

    try {
      await Api_chatInfo.removeParticipant(conversationId, { userId });
      leaveGroup(socket, { conversationId, userId });
      toast.success("Bạn đã rời nhóm.");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Lỗi khi rời nhóm, vui lòng thử lại.");
    }
  };

  const handleOpenEditNameModal = () => setIsEditNameModalOpen(true);
  const handleCloseEditNameModal = () => setIsEditNameModalOpen(false);

  const handleSaveChatName = async (newName) => {
    if (!chatInfo || !newName.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      setChatInfo({ ...chatInfo, name: newName.trim() });
      await Api_chatInfo.updateGroupName(conversationId, { name: newName.trim() });
      updateChatInfo(socket, {
        conversationId,
        name: newName.trim(),
      });
      toast.success("Cập nhật tên nhóm thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật tên:", error);
      toast.error("Cập nhật tên thất bại, vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
      handleCloseEditNameModal();
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">Đang tải thông tin chat...</p>;
  }

  if (!chatInfo) {
    return <p className="text-center text-red-500">Không thể tải thông tin chat.</p>;
  }

  const chatTitle = chatInfo?.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại";
  const chatImage = chatInfo?.isGroup
    ? chatInfo.imageGroup?.trim()
      ? chatInfo.imageGroup
      : "https://via.placeholder.com/150"
    : otherUser?.avatar || "https://via.placeholder.com/150";
  const displayName = chatInfo?.isGroup
    ? chatInfo.name
    : `${otherUser?.firstname || ""} ${otherUser?.surname || ""}`.trim() || "Đang tải...";

  const currentConversationParticipants = chatInfo?.participants?.map((p) => p.userId) || [];

  return (
    <div className="w-full bg-white p-2 rounded-lg h-screen flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-center mb-4">{chatTitle}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-center my-4">
          <div className="relative inline-block">
            <img
              src={chatImage}
              className="w-20 h-20 rounded-full mx-auto object-cover"
              alt={displayName}
            />
            {chatInfo?.isGroup && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <FaEdit className="text-white" />
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-center mt-2">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            {chatInfo?.isGroup && (
              <button
                onClick={handleOpenEditNameModal}
                className="text-gray-500 hover:text-blue-500 ml-2"
                disabled={isUpdating}
              >
                <FaEdit size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-nowrap justify-center gap-4 my-4">
          <GroupActionButton
            icon="mute"
            text={isMuted ? "Bật thông báo" : "Tắt thông báo"}
            onClick={handleMuteNotification}
          />
          <GroupActionButton
            icon="pin"
            text={isPinned ? "Bỏ ghim trò chuyện" : "Ghim cuộc trò chuyện"}
            onClick={handlePinChat}
          />
          <GroupActionButton
            icon="add"
            text={chatInfo?.isGroup ? "Thêm thành viên" : "Tạo nhóm trò chuyện"}
            onClick={chatInfo?.isGroup ? handleAddMember : handleCreateGroupChat}
          />
        </div>

        <GroupMemberList
          chatInfo={chatInfo}
          userId={userId}
          onMemberRemoved={handleMemberRemoved}
        />

        {chatInfo?.linkGroup && (
          <div className="flex items-center justify-between mt-2 p-2 bg-white rounded-md shadow-sm">
            <p className="text-sm font-semibold">Link tham gia nhóm</p>
            <a href={chatInfo.linkGroup} className="text-blue-500 text-sm truncate max-w-xs">
              {chatInfo.linkGroup}
            </a>
            <button
              onClick={copyToClipboard}
              className="text-gray-500 hover:text-blue-500"
            >
              <AiOutlineCopy size={20} />
            </button>
          </div>
        )}

        <GroupMediaGallery conversationId={conversationId} userId={userId} />
        <GroupFile conversationId={conversationId} userId={userId} />
        <GroupLinks conversationId={conversationId} userId={userId} />
        <SecuritySettings
          conversationId={conversationId}
          userId={userId}
          setChatInfo={setChatInfo}
          userRoleInGroup={userRoleInGroup}
          chatInfo={chatInfo}
        />

        {chatInfo?.isGroup && (
          <div className="space-y-2 mt-4">
            <button
              onClick={handleDisbandGroup}
              className="flex items-center text-red-500 hover:text-red-700"
            >
              <span className="mr-2">Giải tán nhóm</span>
            </button>
            <button
              onClick={handleLeaveGroup}
              className="flex items-center text-red-500 hover:text-red-700"
            >
              <span className="mr-2">Rời nhóm</span>
            </button>
          </div>
        )}
      </div>

      <MuteNotificationModal
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        conversationId={conversationId}
        userId={userId}
        onMuteSuccess={handleMuteSuccess}
        socket={socket}
      />
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        conversationId={conversationId}
        onClose={() => setIsAddMemberModalOpen(false)}
        onMemberAdded={handleMemberAdded}
        userId={userId}
        currentMembers={currentConversationParticipants}
      />
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={handleCloseEditNameModal}
        onSave={handleSaveChatName}
        initialName={chatInfo?.name}
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={handleCloseCreateGroupModal}
        userId={userId}
        onGroupCreated={handleCreateGroupSuccess}
        currentConversationParticipants={currentConversationParticipants}
      />
    </div>
  );
};

export default ChatInfo;