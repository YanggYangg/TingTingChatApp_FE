import React, { useEffect, useState } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import GroupActionButton from "../../../components/chatInforComponent/GroupActionButton";
import GroupMemberList from "../../../components/chatInforComponent/GroupMemberList";
import GroupMediaGallery from "../../../components/chatInforComponent/GroupMediaGallery";
import GroupFile from "../../../components/chatInforComponent/GroupFile";
import GroupLinks from "../../../components/chatInforComponent/GroupLinks";
import SecuritySettings from "../../../components/chatInforComponent/SecuritySettings";
import MuteNotificationModal from "../../../components/chatInforComponent/MuteNotificationModal";
import AddMemberModal from "../../../components/chatInforComponent/AddMemberModal";
import EditNameModal from "../../../components/chatInforComponent/EditNameModal";
import { Api_chatInfo } from "../../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../../apis/api_profile";
import { useSocket } from "../../../contexts/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedMessage, clearSelectedMessage } from "../../../redux/slices/chatSlice";

// Import các phương thức Socket.IO từ chatInfoSocket.js
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
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [userRoleInGroup, setUserRoleInGroup] = useState(null);

  const { socket } = useSocket();
  const dispatch = useDispatch();
  const selectedMessage = useSelector((state) => state.chat.selectedMessage);

  console.log("userId được truyền vào ChatInfo:", userId);
  console.log("conversationId được truyền vào ChatInfo:", conversationId);

  // Fetch chat info
  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const response = await Api_chatInfo.getChatInfo(conversationId);
        setChatInfo(response);

        const participant = response.participants.find((p) => p.userId === userId);
        if (participant) {
          setIsMuted(!!participant.mute);
          setUserRoleInGroup(participant.role);
        } else {
          setIsMuted(false);
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

    // Lắng nghe cập nhật thông tin cuộc trò chuyện
    onChatInfoUpdated(socket, (updatedChatInfo) => {
      if (updatedChatInfo.conversationId === conversationId) {
        setChatInfo((prev) => ({ ...prev, ...updatedChatInfo }));
        setIsMuted(updatedChatInfo.mutedUsers?.includes(userId) || false);
        setIsPinned(updatedChatInfo.pinnedUsers?.includes(userId) || false);

        // Cập nhật vai trò người dùng trong nhóm
        const participant = updatedChatInfo.participants?.find((p) => p.userId === userId);
        if (participant) {
          setUserRoleInGroup(participant.role || null);
        }
      }
    });

    // Lắng nghe sự kiện giải tán nhóm
    onGroupDisbanded(socket, (data) => {
      if (data.conversationId === conversationId) {
        dispatch(clearSelectedMessage());
      }
    });

    // Lắng nghe sự kiện người dùng rời nhóm
    onUserLeftGroup(socket, (data) => {
      if (data.conversationId === conversationId && data.userId === userId) {
        dispatch(clearSelectedMessage());
      }
    });

    // Lắng nghe sự kiện xóa tin nhắn để cập nhật danh sách file/link
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

    // Lắng nghe sự kiện xóa thành viên
    onMemberRemoved(socket, (data) => {
      if (data.conversationId === conversationId) {
        setChatInfo((prev) => ({
          ...prev,
          participants: prev.participants?.filter((p) => p.userId !== data.userId) || [],
        }));
        handleMemberRemoved(data.userId);
      }
    });

    // Dọn dẹp các listener khi component unmount
    return () => {
      offChatInfoUpdated(socket);
      offGroupDisbanded(socket);
      offUserLeftGroup(socket);
      offMessageDeleted(socket);
      offMemberRemoved(socket);
    };
  }, [socket, conversationId, userId, dispatch]);

  // Handle image change
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

  // Handle mute notification
  const handleMuteNotification = () => {
    if (isMuted) {
      Api_chatInfo
        .updateNotification(conversationId, { userId, mute: null })
        .then(() => setIsMuted(false))
        .catch((error) => console.error("Lỗi khi bật thông báo:", error));
    } else {
      setIsMuteModalOpen(true);
    }
  };

  const handleMuteSuccess = (muted) => {
    setIsMuted(muted);
    updateChatInfo(socket, {
      conversationId,
      mutedUsers: muted ? [...(chatInfo?.mutedUsers || []), userId] : (chatInfo?.mutedUsers || []).filter((id) => id !== userId),
    });
  };

  // Handle pin conversation
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
      updateChatInfo(socket, {
        conversationId,
        pinnedUsers: newIsPinned
          ? [...(chatInfo?.pinnedUsers || []), userId]
          : (chatInfo?.pinnedUsers || []).filter((id) => id !== userId),
      });
    } catch (error) {
      console.error("Lỗi khi ghim/bỏ ghim cuộc trò chuyện:", error);
      alert(
        `Lỗi: ${
          error.response?.data?.message || "Lỗi khi ghim/bỏ ghim cuộc trò chuyện."
        }`
      );
    }
  };

  // Handle copy group link to clipboard
  const copyToClipboard = () => {
    if (chatInfo?.linkGroup) {
      navigator.clipboard.writeText(chatInfo.linkGroup);
      alert("Đã sao chép link nhóm!");
    }
  };

  // Handle add member
  const handleAddMember = () => {
    setIsAddMemberModalOpen(true);
  };

  // Handle member added
  const handleMemberAdded = async () => {
    try {
      const updatedChatInfo = await Api_chatInfo.getChatInfo(conversationId);
      setChatInfo(updatedChatInfo?.data || {});
      const participant = updatedChatInfo?.data?.participants?.find((p) => p.userId === userId);
      if (participant) {
        setUserRoleInGroup(participant.role || null);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật chatInfo sau khi thêm thành viên:", error);
    }
  };

  // Handle member removal
  const handleMemberRemoved = (removedUserId) => {
    setChatInfo((prev) => ({
      ...prev,
      participants: prev.participants?.filter((p) => p.userId !== removedUserId) || [],
    }));
  };

  // Handle disband group
  const handleDisbandGroup = async () => {
    if (!window.confirm("Bạn có chắc muốn giải tán nhóm này?")) return;

    try {
      await Api_chatInfo.disbandGroup(conversationId);
      disbandGroup(socket, { conversationId });
    } catch (error) {
      console.error("Error disbanding group:", error);
    }
  };

  // Handle leave group
  const handleLeaveGroup = async () => {
    if (!window.confirm("Bạn có chắc muốn rời nhóm này?")) return;

    try {
      await Api_chatInfo.removeParticipant(conversationId, { userId });
      leaveGroup(socket, { conversationId, userId });
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  // Handle edit name
  const handleOpenEditNameModal = () => setIsEditNameModalOpen(true);
  const handleCloseEditNameModal = () => setIsEditNameModalOpen(false);

  const handleSaveChatName = async (newName) => {
    if (!chatInfo || !newName.trim()) return;

    try {
      await Api_chatInfo.updateGroupName(conversationId, { name: newName.trim() });
      setChatInfo({ ...chatInfo, name: newName.trim() });
      updateChatInfo(socket, {
        conversationId,
        name: newName.trim(),
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật tên:", error);
      alert("Cập nhật tên thất bại, vui lòng thử lại.");
    } finally {
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
          {chatInfo?.isGroup && (
            <GroupActionButton
              icon="add"
              text="Thêm thành viên"
              onClick={handleAddMember}
            />
          )}
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
      />
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        conversationId={conversationId}
        onClose={() => setIsAddMemberModalOpen(false)}
        onMemberAdded={handleMemberAdded}
        userId={userId}
        currentMembers={chatInfo?.participants?.map((p) => p.userId) || []}
      />
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={handleCloseEditNameModal}
        onSave={handleSaveChatName}
        initialName={chatInfo?.name}
      />
    </div>
  );
};

export default ChatInfo;