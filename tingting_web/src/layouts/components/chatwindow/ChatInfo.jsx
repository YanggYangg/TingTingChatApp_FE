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
} from "../../../services/sockets/events/chatInfo";
import {
  onConversations,
  offConversations,
  onConversationUpdate,
  offConversationUpdate,
  loadAndListenConversations,
} from "../../../services/sockets/events/conversation";
import { Api_Profile } from "../../../../apis/api_profile";

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
  const [hasMounted, setHasMounted] = useState(false);
  const [commonGroups, setCommonGroups] = useState([]);

  useEffect(() => {
    setHasMounted(true);
    if (!socket || !conversationId) {
      setLoading(false);
      return;
    }

    getChatInfo(socket, { conversationId });

    const handleOnChatInfo = (newChatInfo) => {
      setChatInfo(newChatInfo);
      if (hasMounted) {
        console.log("Thông tin chat nhận được:", newChatInfo);
      }

      const participant = newChatInfo.participants?.find((p) => p.userId === userId);
      if (participant) {
        setIsMuted(!!participant.mute);
        setIsPinned(!!participant.isPinned);
        setUserRoleInGroup(participant.role || null);
      }

      if (!newChatInfo.isGroup) {
        const otherParticipant = newChatInfo.participants?.find(
          (p) => p.userId !== userId
        );
        if (otherParticipant?.userId) {
          Api_Profile.getProfile(otherParticipant.userId)
            .then((response) => {
              setOtherUser(response?.data?.user);
            })
            .catch((error) => {
              console.error("Lỗi khi lấy thông tin người dùng khác:", error);
              setOtherUser({
                firstname: "Không tìm thấy",
                surname: "",
              });
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    onChatInfo(socket, handleOnChatInfo);

    const handleOnChatInfoUpdated = (updatedInfo) => {
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
    };
    onChatInfoUpdated(socket, handleOnChatInfoUpdated);

    const handleError = (error) => {
      console.error("Lỗi từ server:", error);
      setLoading(false);
    };
    onError(socket, handleError);

    return () => {
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, userId, hasMounted]);

  useEffect(() => {
    if (!socket || !userId) return;

    const cleanupLoadConversations = loadAndListenConversations(socket, (conversationsData) => {
      setConversations(conversationsData || []);
    });

    onConversations(socket, (conversationsData) => {
      setConversations(conversationsData || []);
    });

    onConversationUpdate(socket, (updatedConversation) => {
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv._id === updatedConversation._id ? updatedConversation : conv
        )
      );
    });

    return () => {
      cleanupLoadConversations();
      offConversations(socket);
      offConversationUpdate(socket);
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!chatInfo || !conversations.length) {
      setCommonGroups([]);
      return;
    }

    const otherParticipant = chatInfo.participants?.find((p) => p.userId !== userId);
    const otherUserId = otherParticipant?.userId;

    if (!otherUserId || chatInfo.isGroup) {
      setCommonGroups([]);
      return;
    }

    const commonGroups = conversations.filter((conversation) => {
      return (
        conversation.isGroup &&
        conversation._id !== chatInfo._id &&
        conversation.participants.some((p) => p.userId === userId) &&
        conversation.participants.some((p) => p.userId === otherUserId)
      );
    });

    setCommonGroups(commonGroups);
  }, [chatInfo, conversations, userId]);

  const handleMemberAdded = () => {
    getChatInfo(socket, { conversationId });
  };

  const handleMemberRemoved = (removedUserId) => {
    setChatInfo((prevChatInfo) => ({
      ...prevChatInfo,
      participants: prevChatInfo.participants.filter(
        (p) => p.userId !== removedUserId
      ),
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
      : "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A1o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA="
    : otherUser?.avatar ||
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDPQFLjc7cTCBIW5tyYcZGlMkWfvQptRw-k1lF5XyVoor51KoaIx6gWCy-rh4J1kVlE0k&usqp=CAU";
  const displayName = chatInfo?.isGroup
    ? chatInfo.name
    : `${otherUser?.firstname} ${otherUser?.surname}`.trim() || "Đang tải...";

  return (
    <div className="w-full bg-white p-2 rounded-lg h-screen flex flex-col">
    <div className="flex-shrink-0">
      <h2 className="text-xl font-bold text-center mb-4">{chatTitle}</h2>
    </div>

      {/* Phần cuộn: Nội dung còn lại */}
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
          socket={socket}
          commonGroups={commonGroups}
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

        <GroupMediaGallery
          conversationId={conversationId}
          userId={userId}
          socket={socket}
        />
        <GroupFile
          conversationId={conversationId}
          userId={userId}
          socket={socket}
        />
        <GroupLinks conversationId={conversationId} userId={userId} socket={socket} />
        <SecuritySettings
          conversationId={conversationId}
          userId={userId}
          setChatInfo={setChatInfo}
          userRoleInGroup={userRoleInGroup}
          chatInfo={chatInfo}
          socket={socket}
        />
      </div>

      {/* Các modal giữ nguyên */}
      <MuteNotificationModal
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        conversationId={conversationId}
        userId={userId}
        onMuteSuccess={handleMuteSuccess}
        socket={socket}
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
        socket={socket}
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={handleCloseCreateGroupModal}
        userId={userId}
        onGroupCreated={handleCreateGroupSuccess}
        currentConversationParticipants={
          chatInfo?.participants?.map((p) => p.userId) || []
        }
        socket={socket}
      />
    </div>
  );
};

export default ChatInfo;