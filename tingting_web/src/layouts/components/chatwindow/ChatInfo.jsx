import React, { useEffect, useState } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { FaEdit } from 'react-icons/fa';
import GroupActionButton from "../../../components/chatInforComponent/GroupActionButton";
import GroupMemberList from "../../../components/chatInforComponent/GroupMemberList";
import GroupMediaGallery from "../../../components/chatInforComponent/GroupMediaGallery";
import GroupFile from "../../../components/chatInforComponent/GroupFile";
import GroupLinks from "../../../components/chatInforComponent/GroupLinks";
import SecuritySettings from "../../../components/chatInforComponent/SecuritySettings";
import MuteNotificationModal from "../../../components/chatInforComponent/MuteNotificationModal";
import { Api_chatInfo } from "../../../../apis/Api_chatInfo";
import AddMemberModal from "../../../components/chatInforComponent/AddMemberModal";
import EditNameModal from "../../../components/chatInforComponent/EditNameModal";

const ChatInfo = () => {
  const [chatInfo, setChatInfo] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);

  const conversationId = "67e2d6bef1ea6ac96f10bf91";
  const userId = "5";

  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const response = await Api_chatInfo.getChatInfo(conversationId);
        console.log("Thông tin chat nhận được từ API:", response);
        setChatInfo(response);

        // Kiểm tra trạng thái mute và isPinned của user 
        const participant = response.participants.find(p => p.userId === userId);
        if (participant) {
          setIsMuted(!!participant.mute); // true nếu mute không phải null
          setChatInfo(prev => ({ ...prev, isPinned: participant.isPinned })); // Cập nhật trạng thái ghim
        } else {
          setIsMuted(false);
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

  if (loading) {
    return <p className="text-center text-gray-500"> Đang tải thông tin chat...</p>;
  }

  if (!chatInfo) {
    return <p className="text-center text-red-500"> Không thể tải thông tin chat.</p>;
  }

  const handleMuteNotification = () => {
    if (isMuted) {
      Api_chatInfo.updateNotification(conversationId, { userId, mute: null })
        .then(() => setIsMuted(false))
        .catch(error => console.error("Lỗi khi bật thông báo:", error));
    } else {
      setIsMuteModalOpen(true);
    }
  };

  const handleMuteSuccess = (muted) => {
    setIsMuted(muted);
  };

  const handlePinChat = async () => {
    if (!chatInfo) return;

    try {
      const newIsPinned = !chatInfo.isPinned; // Đảo ngược trạng thái
      await Api_chatInfo.pinChat(conversationId, { isPinned: newIsPinned, userId });
      setChatInfo({ ...chatInfo, isPinned: newIsPinned }); // Cập nhật state
    } catch (error) {
      console.error("Lỗi khi ghim/bỏ ghim cuộc trò chuyện:", error);
      if (error.response) {
        alert(`Lỗi: ${error.response.data.message || "Lỗi khi ghim/bỏ ghim cuộc trò chuyện. Vui lòng thử lại."}`);
      } else if (error.request) {
        console.error("Request error:", error.request);
        alert("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
      } else {
        console.error("Error message:", error.message);
        alert("Lỗi không xác định. Vui lòng thử lại.");
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(chatInfo?.linkGroup || "https://zalo.me/g/bamwwg826");
    alert("Đã sao chép link nhóm!");
  };

  const handleAddMember = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenEditNameModal = () => setIsEditNameModalOpen(true);
  const handleCloseEditNameModal = () => setIsEditNameModalOpen(false);

  const handleSaveChatName = async (newName) => {
    if (!chatInfo || !newName.trim()) return;

    try {
      await Api_chatInfo.updateChatName(conversationId, newName.trim());
      setChatInfo({ ...chatInfo, name: newName.trim() });
    } catch (error) {
      console.error('Lỗi khi cập nhật tên:', error);
      alert('Cập nhật tên thất bại, vui lòng thử lại.');
    } finally {
      handleCloseEditNameModal();
    }
  };

  return (
    <div className="w-full bg-white p-2 rounded-lg h-screen flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-center mb-4">
          {chatInfo?.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="text-center my-4">
          <img
            src={chatInfo?.imageGroup?.trim() ? chatInfo.imageGroup : "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/12/anh-dai-dien-zalo-thumbnail.jpg"}
            className="w-20 h-20 rounded-full mx-auto"
          />
          <div className="flex items-center justify-center mt-2">
            <h2 className="text-lg font-semibold">{chatInfo?.name || 'Không có tên'}</h2>
            <button
              onClick={handleOpenEditNameModal}
              className="text-gray-500 hover:text-blue-500 ml-2"
            >
              <FaEdit size={16} />
            </button>
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
            onClick={handleAddMember}
          />
          <AddMemberModal isOpen={isAddModalOpen} conversationId={conversationId} onClose={() => setIsAddModalOpen(false)} />
        </div>

        <GroupMemberList chatInfo={chatInfo} conversationId={conversationId} />

        {chatInfo?.linkGroup && (
          <div className="flex items-center justify-between mt-2 p-2 bg-white rounded-md shadow-sm">
            <p className="text-sm font-semibold">Link tham gia nhóm</p>
            <a href={chatInfo.linkGroup} className="text-blue-500 text-sm">{chatInfo.linkGroup}</a>
            <button onClick={copyToClipboard} className="text-gray-500 hover:text-blue-500">
              <AiOutlineCopy size={20} />
            </button>
          </div>
        )}

        <GroupMediaGallery conversationId={conversationId} />
        <GroupFile conversationId={conversationId} />
        <GroupLinks conversationId={conversationId} />
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
        onClose={handleCloseEditNameModal}
        onSave={handleSaveChatName}
        initialName={chatInfo?.name}
      />
    </div>
  );
};

export default ChatInfo;