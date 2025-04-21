import React, { useEffect, useState } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import GroupActionButton from "../../../components/chatInforComponent/GroupActionButton";
import GroupMediaGallery from "../../../components/chatInforComponent/GroupMediaGallery";
import GroupFile from "../../../components/chatInforComponent/GroupFile";
import GroupLinks from "../../../components/chatInforComponent/GroupLinks";
import SecuritySettings from "../../../components/chatInforComponent/SecuritySettings";
import MuteNotificationModal from "../../../components/chatInforComponent/MuteNotificationModal";
import AddMemberModal from "../../../components/chatInforComponent/AddMemberModal";
import EditNameModal from "../../../components/chatInforComponent/EditNameModal";
import CreateGroupModal from "../../../components/chatInforComponent/CreateGroupModal";
import MemberListModal from "../../../components/chatInforComponent/MemberListModal";
import { Api_chatInfo } from "../../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../../apis/api_profile";

const ChatInfo = ({ userId, conversationId }) => {
  const [chatInfo, setChatInfo] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMemberListModalOpen, setIsMemberListModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [otherUser, setOtherUser] = useState(null);

  const MAX_MEMBERS = 1000;

  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const response = await Api_chatInfo.getChatInfo(conversationId);
        const validParticipants = response.participants?.filter(
          (p) => p.userId && typeof p.userId === "string"
        ) || [];
        console.log("Initial participants:", validParticipants);
        setChatInfo({ ...response, participants: validParticipants });

        const participant = validParticipants.find((p) => p.userId === userId);
        setIsMuted(!!participant?.mute);
        setChatInfo((prev) => ({ ...prev, isPinned: participant?.isPinned || false }));

        if (!response.isGroup) {
          const otherParticipant = validParticipants.find((p) => p.userId !== userId);
          if (otherParticipant?.userId) {
            try {
              const userResponse = await Api_Profile.getProfile(otherParticipant.userId);
              setOtherUser(userResponse?.data?.user || { firstname: "Không tìm thấy", surname: "" });
            } catch (error) {
              console.error("Lỗi khi lấy thông tin người dùng:", error);
              setOtherUser({ firstname: "Không tìm thấy", surname: "" });
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin chat:", error);
        setNotification({ message: "Không thể tải thông tin chat.", type: "error" });
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchChatInfo();
    }
  }, [conversationId, userId]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleMemberAdded = async () => {
    try {
      const updatedChatInfo = await Api_chatInfo.getChatInfo(conversationId);
      const validParticipants = updatedChatInfo.participants?.filter(
        (p) => p.userId && typeof p.userId === "string"
      ) || [];
      console.log("Danh sách participants sau khi thêm:", validParticipants);
      setChatInfo({ ...updatedChatInfo, participants: validParticipants });
      showNotification("Thêm thành viên thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật danh sách thành viên:", error);
      showNotification("Không thể cập nhật danh sách thành viên.", "error");
    }
  };

  const handleMuteNotification = async () => {
    try {
      if (isMuted) {
        await Api_chatInfo.updateNotification(conversationId, { userId, mute: null });
        setIsMuted(false);
        showNotification("Đã bật thông báo.");
      } else {
        setIsMuteModalOpen(true);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật thông báo:", error);
      showNotification("Lỗi khi cập nhật thông báo.", "error");
    }
  };

  const handleMuteSuccess = (muted) => {
    setIsMuted(muted);
    showNotification(muted ? "Đã tắt thông báo." : "Đã bật thông báo.");
  };

  const handlePinChat = async () => {
    if (!chatInfo) return;
    try {
      const newIsPinned = !chatInfo.isPinned;
      await Api_chatInfo.pinChat(conversationId, { isPinned: newIsPinned, userId });
      setChatInfo({ ...chatInfo, isPinned: newIsPinned });
      showNotification(newIsPinned ? "Đã ghim trò chuyện." : "Đã bỏ ghim trò chuyện.");
    } catch (error) {
      console.error("Lỗi khi ghim/bỏ ghim:", error);
      showNotification("Lỗi khi ghim/bỏ ghim trò chuyện.", "error");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(chatInfo?.linkGroup || "");
    showNotification("Đã sao chép link nhóm!");
  };

  const handleAddMember = () => {
    if (chatInfo?.participants?.length >= MAX_MEMBERS) {
      showNotification("Nhóm đã đủ 1000 thành viên.", "error");
      return;
    }
    setIsAddModalOpen(true);
    setIsCreateGroupModalOpen(false);
  };

  const handleCreateGroupChat = () => {
    setIsCreateGroupModalOpen(true);
    setIsAddModalOpen(false);
  };

  const handleCreateGroupSuccess = () => {
    showNotification("Tạo nhóm thành công!");
  };

  const handleOpenEditNameModal = () => setIsEditNameModalOpen(true);

  const handleSaveChatName = async (newName) => {
    if (!chatInfo || !newName.trim()) return;
    try {
      await Api_chatInfo.updateChatName(conversationId, newName.trim());
      setChatInfo({ ...chatInfo, name: newName.trim() });
      showNotification("Cập nhật tên nhóm thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật tên:", error);
      showNotification("Cập nhật tên thất bại.", "error");
    } finally {
      setIsEditNameModalOpen(false);
    }
  };

  const chatTitle = chatInfo?.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại";
  const chatImage = chatInfo?.isGroup
    ? chatInfo.imageGroup?.trim() || "https://via.placeholder.com/150"
    : otherUser?.avatar || "https://via.placeholder.com/150";
  const displayName = chatInfo?.isGroup
    ? chatInfo.name
    : `${otherUser?.firstname} ${otherUser?.surname}`.trim() || "Đang tải...";

  if (loading) {
    return <p className="text-center text-gray-500">Đang tải thông tin chat...</p>;
  }

  if (!chatInfo) {
    return <p className="text-center text-red-500">Không thể tải thông tin chat.</p>;
  }

  return (
    <div className="w-full bg-white p-2 rounded-lg h-screen flex flex-col">
      {notification && (
        <div
          className={`fixed top-4 right-4 p-3 rounded-md text-white ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {notification.message}
        </div>
      )}

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

        <div className="flex flex-nowrap justify-center gap-4 my-4">
          <GroupActionButton
            icon="mute"
            text={isMuted ? "Bật thông báo" : "Tắt thông báo"}
            onClick={handleMuteNotification}
          />
          <GroupActionButton
            icon="pin"
            text={chatInfo?.isPinned ? "Bỏ ghim trò chuyện" : "Ghim cuộc trò chuyện"}
            onClick={handlePinChat}
          />
          <GroupActionButton
            icon="add"
            text={chatInfo?.isGroup ? "Thêm thành viên" : "Tạo nhóm trò chuyện"}
            onClick={chatInfo?.isGroup ? handleAddMember : handleCreateGroupChat}
          />
        </div>

        <div className="my-4">
          <button
            onClick={() => setIsMemberListModalOpen(true)}
            className="bg-blue-500 text-white px-3 py-1 rounded-md"
          >
            Xem danh sách thành viên ({chatInfo.participants?.length || 0})
          </button>
        </div>

        {chatInfo?.linkGroup && (
          <div className="flex items-center justify-between mt-2 p-2 bg-white rounded-md shadow-sm">
            <p className="text-sm font-semibold">Link tham gia nhóm</p>
            <a href={chatInfo.linkGroup} className="text-blue-500 text-sm truncate">
              {chatInfo.linkGroup}
            </a>
            <button onClick={copyToClipboard} className="text-gray-500 hover:text-blue-500">
              <AiOutlineCopy size={20} />
            </button>
          </div>
        )}

        <GroupMediaGallery conversationId={conversationId} userId={userId} />
        <GroupFile conversationId={conversationId} userId={userId} />
        <GroupLinks conversationId={conversationId} userId={userId} />
        <SecuritySettings conversationId={conversationId} userId={userId} setChatInfo={setChatInfo} />
      </div>

      <MuteNotificationModal
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        conversationId={conversationId}
        userId={userId}
        onMuteSuccess={handleMuteSuccess}
      />
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={() => setIsEditNameModalOpen(false)}
        onSave={handleSaveChatName}
        initialName={chatInfo?.name}
      />
      <AddMemberModal
        isOpen={isAddModalOpen}
        conversationId={conversationId}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={handleMemberAdded}
        userId={userId}
        participants={chatInfo?.participants}
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        userId={userId}
        onGroupCreated={handleCreateGroupSuccess}
      />
      <MemberListModal
        isOpen={isMemberListModalOpen}
        onClose={() => setIsMemberListModalOpen(false)}
        chatInfo={chatInfo}
      />
    </div>
  );
};

export default ChatInfo;