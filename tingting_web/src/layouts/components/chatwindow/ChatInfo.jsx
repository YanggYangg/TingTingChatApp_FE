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
import CreateGroupModal from "../../../components/chatInforComponent/CreateGroupModal";
import {
  getChatInfo,
  onChatInfo,
  offChatInfo,
  onChatInfoUpdated,
  offChatInfoUpdated,
  updateChatName,
  pinChat,
  updateNotification,
  onError,
  offError,
} from "../../../services/sockets/events/chatInfo"; // Import các hàm Socket.IO

const ChatInfo = ({ userId, conversationId, socket }) => {
  const [chatInfo, setChatInfo] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [userRoleInGroup, setUserRoleInGroup] = useState(null);

  console.log("userId được truyền vào ChatInfo:", userId);
  console.log("conversationId được truyền vào ChatInfo:", conversationId);
  console.log("socket trong ChatInfo:", socket);

  useEffect(() => {
    if (!socket || !conversationId) {
      setLoading(false);
      return;
    }

    // Lấy thông tin chat ban đầu
    getChatInfo(socket, { conversationId });

    // Lắng nghe thông tin chat
    onChatInfo(socket, (chatInfo) => {
      setChatInfo(chatInfo);
      const participant = chatInfo.participants?.find((p) => p.userId === userId);
      console.log("Thông tin người dùng:", participant);
      if (participant) {
        setIsMuted(!!participant.mute);
        setIsPinned(!!participant.isPinned);
        setUserRoleInGroup(participant.role || null);
      }
      setLoading(false);
    });

    // Lắng nghe cập nhật chat info (thời gian thực)
    onChatInfoUpdated(socket, (updatedInfo) => {
      setChatInfo((prev) => ({
        ...prev,
        ...updatedInfo,
        participants: updatedInfo.participants || prev.participants,
        name: updatedInfo.name || prev.name,
      }));
      const participant = updatedInfo.participants?.find((p) => p.userId === userId);
      if (participant) {
        setIsMuted(!!participant.mute);
        setIsPinned(!!participant.isPinned);
        setUserRoleInGroup(participant.role || null);
      }
    });

    // Lắng nghe lỗi
    onError(socket, (error) => {
      console.error("Lỗi từ server:", error);
      setLoading(false);
    });

    // Cleanup khi component unmount
    return () => {
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, userId]);

  const handleMemberAdded = () => {
    // Cập nhật lại thông tin chat sau khi thêm thành viên
    getChatInfo(socket, { conversationId });
  };

  const handleMemberRemoved = (removedUserId) => {
    setChatInfo((prevChatInfo) => ({
      ...prevChatInfo,
      participants: prevChatInfo.participants.filter((p) => p.userId !== removedUserId),
    }));
  };

  const handleMuteNotification = () => {
    if (isMuted) {
      updateNotification(socket, { conversationId, mute: null });
      setIsMuted(false);
    } else {
      setIsMuteModalOpen(true);
    }
  };

  const handleMuteSuccess = (muted) => {
    setIsMuted(muted);
  };

  const handlePinChat = () => {
    if (!chatInfo) return;

    const newIsPinned = !isPinned;
    pinChat(socket, { conversationId, isPinned: newIsPinned });
    setIsPinned(newIsPinned);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(chatInfo?.linkGroup || "");
    alert("Đã sao chép link nhóm!");
  };

  const handleAddMember = () => {
    setIsAddModalOpen(true);
    setIsCreateGroupModalOpen(false);
  };

  const handleCreateGroupChat = () => {
    setIsCreateGroupModalOpen(true);
    setIsAddModalOpen(false);
  };

  const handleCloseCreateGroupModal = () => {
    setIsCreateGroupModalOpen(false);
  };

  const handleCreateGroupSuccess = (newGroup) => {
    setConversations((prevConversations) => [...prevConversations, newGroup]);
  };

  const handleOpenEditNameModal = () => setIsEditNameModalOpen(true);
  const handleCloseEditNameModal = () => setIsEditNameModalOpen(false);

  const handleSaveChatName = (newName) => {
    if (!chatInfo || !newName.trim()) return;

    updateChatName(socket, { conversationId, name: newName.trim() });
    setChatInfo((prev) => ({ ...prev, name: newName.trim() }));
    handleCloseEditNameModal();
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
    : `${otherUser?.firstname} ${otherUser?.surname}`.trim() || "Đang tải...";

  return (
    <div className="w-full bg-white p-2 rounded-lg h-screen flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-center mb-4">{chatTitle}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-center my-4">
          <img
            src={chatImage}
            className="w-20 h-20 rounded-full mx-auto object-cover"
            alt={displayName}
          />
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
      {/*
        <GroupMemberList
          chatInfo={chatInfo}
          userId={userId}
          onMemberRemoved={handleMemberRemoved}
          socket={socket} // Truyền socket xuống để xử lý xóa thành viên
        />

        {chatInfo?.linkGroup && (
          <div className="flex items-center justify-between mt-2 p-2 bg-white rounded-md shadow-sm">
            <p className="text-sm font-semibold">Link tham gia nhóm</p>
            <a href={chatInfo.linkGroup} className="text-blue-500 text-sm">
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

        <GroupMediaGallery conversationId={conversationId} userId={userId} socket={socket} />
        <GroupFile conversationId={conversationId} userId={userId} socket={socket} />
        <GroupLinks conversationId={conversationId} userId={userId} socket={socket} />
        <SecuritySettings
          conversationId={conversationId}
          userId={userId}
          setChatInfo={setChatInfo}
          userRoleInGroup={userRoleInGroup}
          chatInfo={chatInfo}
          socket={socket} // Truyền socket xuống để xử lý các hành động
        />
      </div>
*/}
      <MuteNotificationModal
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        conversationId={conversationId}
        userId={userId}
        onMuteSuccess={handleMuteSuccess}
        socket={socket} // Truyền socket xuống để xử lý tắt thông báo
      />
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={handleCloseEditNameModal}
        onSave={handleSaveChatName}
        initialName={chatInfo?.name}
      />
      <AddMemberModal
        isOpen={isAddModalOpen}
        conversationId={conversationId}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={handleMemberAdded}
        userId={userId}
        currentMembers={chatInfo?.participants?.map((p) => p.userId) || []}
        socket={socket} // Truyền socket xuống để xử lý thêm thành viên
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={handleCloseCreateGroupModal}
        userId={userId}
        onGroupCreated={handleCreateGroupSuccess}
        currentConversationParticipants={chatInfo?.participants?.map((p) => p.userId) || []}
        socket={socket} // Truyền socket xuống để xử lý tạo nhóm
      />
    </div>
  );
};

export default ChatInfo;