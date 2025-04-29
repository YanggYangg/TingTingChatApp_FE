import React, { useState, useEffect } from "react";
import { FaBellSlash, FaThumbtack, FaUserPlus, FaCog, FaTrash, FaSignOutAlt, FaEyeSlash } from "react-icons/fa";
import GroupActionButton from "./GroupActionButton";
import GroupMemberList from "./GroupMemberList";
import GroupLinks from "./GroupLinks";
import GroupFile from "./GroupFile";
import MuteNotificationModal from "./MuteNotificationModal";
import AddMemberModal from "./AddMemberModal";
import EditNameModal from "./EditNameModal";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import { useSocket } from "../../../contexts/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedMessage, clearSelectedMessage } from "../../../redux/slices/chatSlice";

const ChatInfo = ({ userId, conversationId }) => {
  const [chatInfo, setChatInfo] = useState(null);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { socket } = useSocket();
  const dispatch = useDispatch();
  const selectedMessage = useSelector((state) => state.chat.selectedMessage);

  // Fetch chat info
  useEffect(() => {
    const fetchChatInfo = async () => {
      if (!conversationId || !userId) return;

      try {
        const response = await Api_chatInfo.getChatInfo(conversationId);
        setChatInfo(response?.data || {});
        setIsMuted(response?.data?.mutedUsers?.includes(userId) || false);
        setIsPinned(response?.data?.pinnedUsers?.includes(userId) || false);
        setIsHidden(response?.data?.hiddenUsers?.includes(userId) || false);
      } catch (error) {
        console.error("Error fetching chat info:", error);
      }
    };

    fetchChatInfo();
  }, [conversationId, userId]);

  // Listen for updates from Socket.IO
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.on("chatInfoUpdated", (updatedChatInfo) => {
      if (updatedChatInfo.conversationId === conversationId) {
        setChatInfo((prev) => ({ ...prev, ...updatedChatInfo }));
        setIsMuted(updatedChatInfo.mutedUsers?.includes(userId) || false);
        setIsPinned(updatedChatInfo.pinnedUsers?.includes(userId) || false);
        setIsHidden(updatedChatInfo.hiddenUsers?.includes(userId) || false);
      }
    });

    socket.on("groupDisbanded", (data) => {
      if (data.conversationId === conversationId) {
        dispatch(clearSelectedMessage());
      }
    });

    socket.on("userLeftGroup", (data) => {
      if (data.conversationId === conversationId && data.userId === userId) {
        dispatch(clearSelectedMessage());
      }
    });

    socket.on("messageDeleted", ({ messageId, messageType }) => {
      // Cập nhật danh sách file hoặc link nếu có xóa
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

    return () => {
      socket.off("chatInfoUpdated");
      socket.off("groupDisbanded");
      socket.off("userLeftGroup");
      socket.off("messageDeleted");
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
      socket.emit("updateChatInfo", {
        conversationId,
        imageGroup: newImage,
      });
    } catch (error) {
      console.error("Error updating group image:", error);
    }
  };

  // Handle mute notification
  const handleMuteNotification = () => {
    setIsMuteModalOpen(true);
  };

  const handleMuteSuccess = (muteTime) => {
    setIsMuted(true);
    socket.emit("updateChatInfo", {
      conversationId,
      mutedUsers: [...(chatInfo.mutedUsers || []), userId],
      muteTime,
    });
  };

  // Handle pin conversation
  const handlePinConversation = async () => {
    try {
      await Api_chatInfo.pinConversation(conversationId, userId);
      setIsPinned(true);
      socket.emit("updateChatInfo", {
        conversationId,
        pinnedUsers: [...(chatInfo.pinnedUsers || []), userId],
      });
    } catch (error) {
      console.error("Error pinning conversation:", error);
    }
  };

  const handleUnpinConversation = async () => {
    try {
      await Api_chatInfo.unpinConversation(conversationId, userId);
      setIsPinned(false);
      socket.emit("updateChatInfo", {
        conversationId,
        pinnedUsers: (chatInfo.pinnedUsers || []).filter((id) => id !== userId),
      });
    } catch (error) {
      console.error("Error unpinning conversation:", error);
    }
  };

  // Handle hide conversation
  const handleHideConversation = async () => {
    if (!window.confirm("Bạn có chắc muốn ẩn trò chuyện này?")) return;

    try {
      await Api_chatInfo.hideConversation(conversationId, userId);
      setIsHidden(true);
      socket.emit("updateChatInfo", {
        conversationId,
        hiddenUsers: [...(chatInfo.hiddenUsers || []), userId],
      });
      dispatch(clearSelectedMessage());
    } catch (error) {
      console.error("Error hiding conversation:", error);
    }
  };

  // Handle disband group
  const handleDisbandGroup = async () => {
    if (!window.confirm("Bạn có chắc muốn giải tán nhóm này?")) return;

    try {
      await Api_chatInfo.disbandGroup(conversationId);
      socket.emit("disbandGroup", { conversationId });
    } catch (error) {
      console.error("Error disbanding group:", error);
    }
  };

  // Handle leave group
  const handleLeaveGroup = async () => {
    if (!window.confirm("Bạn có chắc muốn rời nhóm này?")) return;

    try {
      await Api_chatInfo.removeParticipant(conversationId, { userId });
      socket.emit("leaveGroup", { conversationId, userId });
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  // Handle member removal
  const handleMemberRemoved = (removedUserId) => {
    setChatInfo((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.userId !== removedUserId),
    }));
  };

  if (!chatInfo) return <div>Đang tải...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center p-4 border-b">
        <div className="relative">
          <img
            src={chatInfo.imageGroup || "https://via.placeholder.com/150"}
            alt="Group Avatar"
            className="w-24 h-24 rounded-full object-cover"
          />
          {chatInfo.isGroup && (
            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
              <label htmlFor="image-upload" className="cursor-pointer">
                <FaCog className="text-white" />
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
        <h2 className="mt-2 text-lg font-semibold">
          {chatInfo.name || "Không có tên"}
        </h2>
        {chatInfo.isGroup && (
          <button
            onClick={() => setIsEditNameModalOpen(true)}
            className="text-blue-500 text-sm mt-1"
          >
            Đổi tên nhóm
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-around">
          <GroupActionButton
            icon="mute"
            text={isMuted ? "Bật thông báo" : "Tắt thông báo"}
            onClick={handleMuteNotification}
            isActive={isMuted}
          />
          <GroupActionButton
            icon={isPinned ? "unpin" : "pin"}
            text={isPinned ? "Bỏ ghim" : "Ghim"}
            onClick={isPinned ? handleUnpinConversation : handlePinConversation}
            isActive={isPinned}
          />
          {chatInfo.isGroup && (
            <GroupActionButton
              icon="add"
              text="Thêm thành viên"
              onClick={() => setIsAddMemberModalOpen(true)}
            />
          )}
          <GroupActionButton
            icon="hide"
            text="Ẩn trò chuyện"
            onClick={handleHideConversation}
          />
        </div>

        <GroupMemberList
          chatInfo={chatInfo}
          userId={userId}
          onMemberRemoved={handleMemberRemoved}
        />
        <GroupLinks
          conversationId={conversationId}
          userId={userId}
        />
        <GroupFile
          conversationId={conversationId}
          userId={userId}
        />

        {chatInfo.isGroup && (
          <div className="space-y-2">
            <button
              onClick={handleDisbandGroup}
              className="flex items-center text-red-500 hover:text-red-700"
            >
              <FaTrash className="mr-2" />
              Giải tán nhóm
            </button>
            <button
              onClick={handleLeaveGroup}
              className="flex items-center text-red-500 hover:text-red-700"
            >
              <FaSignOutAlt className="mr-2" />
              Rời nhóm
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
        onClose={() => setIsAddMemberModalOpen(false)}
        conversationId={conversationId}
        userId={userId}
        currentMembers={chatInfo?.participants?.map((p) => p.userId) || []}
      />
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={() => setIsEditNameModalOpen(false)}
        initialName={chatInfo?.name || ""}
        onSave={(newName) => {
          Api_chatInfo.updateGroupName(conversationId, { name: newName }).then(() => {
            socket.emit("updateChatInfo", {
              conversationId,
              name: newName,
            });
          });
        }}
      />
    </div>
  );
};

export default ChatInfo;