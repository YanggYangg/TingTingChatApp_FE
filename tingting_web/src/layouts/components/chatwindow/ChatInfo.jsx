import React, { useState, useEffect, useCallback } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { setChatInfoUpdate, setSelectedMessage } from "../../../redux/slices/chatSlice";
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
import PinLimitModal from "../../../components/chatInforComponent/PinLimitModal";
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
  getChatMedia,
  getChatFiles,
  getChatLinks,
} from "../../../services/sockets/events/chatInfo";
import {
  onConversations,
  offConversations,
  onConversationUpdate,
  offConversationUpdate,
  loadAndListenConversations,
  joinConversation,
} from "../../../services/sockets/events/conversation";
import { Api_Profile } from "../../../../apis/api_profile";
import { toast } from "react-toastify";

// Default avatar and group image for fallback
const DEFAULT_AVATAR =
  "https://www.google.com/url?sa=i&url=https%3A%2F%2Fvi.pngtree.com%2Ffree-png-vectors%2Fuser-icon&psig=AOvVaw0Tbvu7Vm7uhRn-ECIZj3I2&ust=1747927668573000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCJD2vJbwtI0DFQAAAAAdAAAAABAE";
const DEFAULT_GROUP_IMAGE =
  "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A0o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=";

const ChatInfo = ({ userId, conversationId, socket }) => {
  const [chatInfo, setChatInfo] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [muteValue, setMuteValue] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isPinLimitModalOpen, setIsPinLimitModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [userRoleInGroup, setUserRoleInGroup] = useState(null);
  const [commonGroups, setCommonGroups] = useState([]);
  const dispatch = useDispatch();

  // Select a group and join its conversation
  const handleGroupSelect = useCallback(
    (group) => {
      if (!socket) return toast.error("Socket chưa kết nối!");
      const formattedMessage = {
        id: group._id,
        name: group.name || "Nhóm không tên",
        participants: group.participants || [],
        isGroup: true,
        imageGroup: group.imageGroup || DEFAULT_GROUP_IMAGE,
        isPinned: false,
        mute: null,
        updatedAt: group.updatedAt || new Date().toISOString(),
      };
      joinConversation(socket, formattedMessage.id);
      dispatch(setSelectedMessage(formattedMessage));
    },
    [socket, dispatch]
  );

  // Fetch and listen for chat info updates
useEffect(() => {
  if (!socket || !conversationId || !userId) {
    setLoading(false);
    return;
  }

  socket.emit("joinUserRoom", { userId });
  joinConversation(socket, conversationId);
  getChatInfo(socket, { conversationId });

  const handleUpdateChatInfo = ({ conversationId: updatedId, messageType }) => {
    if (updatedId !== conversationId) return;
    if (messageType === "image" || messageType === "video") {
      getChatMedia(socket, { conversationId });
    } else if (messageType === "file") {
      getChatFiles(socket, { conversationId });
    } else if (messageType === "link") {
      getChatLinks(socket, { conversationId });
    }
  };

  const handleOnChatInfo = (newChatInfo) => {
    const participant = newChatInfo.participants?.find((p) => p.userId === userId);
    if (!participant) {
      dispatch(setSelectedMessage(null));
      setLoading(false);
      return;
    }

    // Lọc các tin nhắn chưa bị xóa bởi userId
    const filteredChatInfo = {
      ...newChatInfo,
      media: newChatInfo.media?.filter((msg) => !msg.deletedBy?.includes(userId)) || [],
      files: newChatInfo.files?.filter((msg) => !msg.deletedBy?.includes(userId)) || [],
      links: newChatInfo.links?.filter((msg) => !msg.deletedBy?.includes(userId)) || [],
    };

    setChatInfo((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(filteredChatInfo)) return prev;
      return filteredChatInfo;
    });
    setIsMuted(!!participant?.mute);
    setMuteValue(participant?.mute || null);
    setIsPinned(!!participant?.isPinned);
    setUserRoleInGroup(participant?.role || null);

    if (!newChatInfo.isGroup) {
      const otherParticipant = newChatInfo.participants?.find((p) => p.userId !== userId);
      if (otherParticipant?.userId) {
        Api_Profile.getProfile(otherParticipant.userId)
          .then((response) => setOtherUser(response?.data?.user || { firstname: "Không tìm thấy", surname: "" }))
          .catch(() => setOtherUser({ firstname: "Không tìm thấy", surname: "" }))
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    dispatch(setChatInfoUpdate(filteredChatInfo));
  };

  const handleOnChatInfoUpdated = (updatedInfo) => {
    if (updatedInfo._id !== conversationId) return;
    const participant = updatedInfo.participants?.find((p) => p.userId === userId);
    if (!participant) {
      dispatch(setSelectedMessage(null));
      socket.emit("leaveConversation", { conversationId });
      return;
    }

    // Lọc các tin nhắn chưa bị xóa bởi userId
    const filteredUpdatedInfo = {
      ...updatedInfo,
      media: updatedInfo.media?.filter((msg) => !msg.deletedBy?.includes(userId)) || [],
      files: updatedInfo.files?.filter((msg) => !msg.deletedBy?.includes(userId)) || [],
      links: updatedInfo.links?.filter((msg) => !msg.deletedBy?.includes(userId)) || [],
    };

    setChatInfo((prev) => {
      if (!prev || JSON.stringify(prev) === JSON.stringify(filteredUpdatedInfo)) return prev;
      const newChatInfo = { ...prev, ...filteredUpdatedInfo };
      dispatch(setChatInfoUpdate(newChatInfo));
      return newChatInfo;
    });
    setIsMuted(!!participant?.mute);
    setMuteValue(participant?.mute || null);
    setIsPinned(!!participant?.isPinned);
    setUserRoleInGroup(participant?.role || null);
  };

  const handleDeleteAllChatHistory = ({ conversationId: deletedConversationId, deletedBy }) => {
    if (deletedConversationId !== conversationId) return;
    console.log("ChatInfo: Nhận deleteAllChatHistory", { conversationId, deletedBy });

    setChatInfo((prev) => {
      if (!prev) return prev;
      const updatedChatInfo = {
        ...prev,
        media: [],
        files: [],
        links: [],
        lastMessage: null,
      };
      dispatch(setChatInfoUpdate(updatedChatInfo));
      return updatedChatInfo;
    });
    toast.success("Đã xóa lịch sử trò chuyện, cập nhật media, files, links!");
  };

  socket.on("updateChatInfo", handleUpdateChatInfo);
  onChatInfo(socket, handleOnChatInfo);
  onChatInfoUpdated(socket, handleOnChatInfoUpdated);
  socket.on("deleteAllChatHistory", handleDeleteAllChatHistory);
  onError(socket, (error) => {
    if (error.message === "Bạn chỉ có thể ghim tối đa 5 cuộc trò chuyện!") {
      setIsPinLimitModalOpen(true);
    } else {
      toast.error("Đã xảy ra lỗi: " + (error.message || "Không thể cập nhật thông tin."));
    }
  });
  getChatMedia(socket, { conversationId });
  getChatFiles(socket, { conversationId });
  getChatLinks(socket, { conversationId });

  return () => {
    socket.off("updateChatInfo", handleUpdateChatInfo);
    socket.off("deleteAllChatHistory", handleDeleteAllChatHistory);
    offChatInfo(socket);
    offChatInfoUpdated(socket);
    offError(socket);
  };
}, [socket, conversationId, userId, dispatch]);

  // Load and listen for conversation updates
  useEffect(() => {
    if (!socket || !userId) return;

    const cleanup = loadAndListenConversations(socket, setConversations);
    onConversations(socket, setConversations);
    onConversationUpdate(socket, (updatedConversation) => {
      setConversations((prev) => {
        const newConversations = prev.map((conv) =>
          conv._id === updatedConversation._id ? updatedConversation : conv
        );
        return newConversations;
      });
    });

    return () => {
      cleanup();
      offConversations(socket);
      offConversationUpdate(socket);
    };
  }, [socket, userId]);

  // Calculate common groups between users
  useEffect(() => {
    if (!chatInfo || !conversations.length) {
      setCommonGroups([]);
      return;
    }

    const otherUserId = chatInfo.participants?.find((p) => p.userId !== userId)?.userId;
    if (!otherUserId || chatInfo.isGroup) {
      setCommonGroups([]);
      return;
    }

    const commonGroups = conversations.filter(
      (conv) =>
        conv.isGroup &&
        conv._id !== chatInfo._id &&
        conv.participants.some((p) => p.userId === userId) &&
        conv.participants.some((p) => p.userId === otherUserId)
    );
    setCommonGroups(commonGroups);
  }, [chatInfo, conversations, userId]);

  // Handle adding a new member to the group
  const handleMemberAdded = useCallback(() => {
    getChatInfo(socket, { conversationId });
  }, [socket, conversationId]);

  // Handle removing a member from the group
  const handleMemberRemoved = useCallback(
    (removedUserId) => {
      setChatInfo((prev) => {
        if (!prev) return prev;
        const updatedChatInfo = {
          ...prev,
          participants: prev.participants.filter((p) => p.userId !== removedUserId),
        };
        dispatch(setChatInfoUpdate(updatedChatInfo));
        return updatedChatInfo;
      });
    },
    [dispatch]
  );

  // Toggle mute notification status
  const handleMuteNotification = useCallback(() => {
    if (isMuted) {
      updateNotification(socket, { conversationId, mute: null }, (response) => {
        if (!response.success) {
          toast.error(response.message || "Không thể bật thông báo!");
        } else {
          setIsMuted(false);
          setMuteValue(null);
        }
      });
    } else {
      setIsMuteModalOpen(true);
    }
  }, [isMuted, socket, conversationId]);

  // Handle successful mute action
  const handleMuteSuccess = useCallback((mute) => {
    setIsMuted(!!mute);
    setMuteValue(mute);
    setIsMuteModalOpen(false);
  }, []);

  // Toggle pin chat status
  const handlePinChat = useCallback(() => {
    if (!chatInfo || !socket) return toast.error("Không thể ghim hội thoại!");
    const newIsPinned = !isPinned;
    setIsPinned(newIsPinned); // Optimistic update
    pinChat(socket, { conversationId, isPinned: newIsPinned }, (response) => {
      if (!response.success) {
        setIsPinned(!newIsPinned); // Revert on failure
        if (response.message === "Bạn chỉ có thể ghim tối đa 5 cuộc trò chuyện!") {
          setIsPinLimitModalOpen(true);
        } else {
          toast.error(response.message || "Không thể ghim/bỏ ghim hội thoại!");
        }
      } else {
        dispatch(
          setChatInfoUpdate({
            ...chatInfo,
            participants: chatInfo.participants.map((p) =>
              p.userId === userId ? { ...p, isPinned: newIsPinned } : p
            ),
            updatedAt: new Date().toISOString(),
          })
        );
      }
    });
    joinConversation(socket, conversationId);
  }, [chatInfo, socket, isPinned, conversationId, userId, dispatch]);

  // Copy group link to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(chatInfo?.linkGroup || "");
    toast.success("Đã sao chép link nhóm!");
  }, [chatInfo?.linkGroup]);

  // Open modal to add a member
  const handleAddMember = useCallback(() => {
    setIsAddModalOpen(true);
    setIsCreateGroupModalOpen(false);
  }, []);

  // Open modal to create a new group
  const handleCreateGroupChat = useCallback(() => {
    setIsCreateGroupModalOpen(true);
    setIsAddModalOpen(false);
  }, []);

  // Close create group modal
  const handleCloseCreateGroupModal = useCallback(() => {
    setIsCreateGroupModalOpen(false);
  }, []);

  // Handle successful group creation
  const handleCreateGroupSuccess = useCallback((newGroup) => {
    setConversations((prev) => [...prev, newGroup]);
  }, []);

  // Open modal to edit group name
  const handleOpenEditNameModal = useCallback(() => {
    if (!chatInfo?.isGroup) return toast.error("Chỉ nhóm mới có thể đổi tên!");
    setIsEditNameModalOpen(true);
  }, [chatInfo?.isGroup]);

  // Close edit name modal
  const handleCloseEditNameModal = useCallback(() => {
    setIsEditNameModalOpen(false);
  }, []);

  // Save new chat name
  const handleSaveChatName = useCallback(
    (newName) => {
      if (!chatInfo || !newName.trim()) return;
      const originalName = chatInfo.name;
      setChatInfo((prev) => ({ ...prev, name: newName.trim() }));
      updateChatName(socket, { conversationId, name: newName.trim() }, (response) => {
        if (!response.success) {
          toast.error(response.message || "Không thể cập nhật tên nhóm!");
          setChatInfo((prev) => ({ ...prev, name: originalName }));
          dispatch(setChatInfoUpdate({ ...chatInfo, _id: conversationId, name: originalName }));
        }
      });
      dispatch(
        setChatInfoUpdate({
          ...chatInfo,
          _id: conversationId,
          name: newName.trim(),
          updatedAt: new Date().toISOString(),
        })
      );
      handleCloseEditNameModal();
    },
    [chatInfo, socket, conversationId, dispatch]
  );

  if (loading) return <p className="text-center text-gray-500">Đang tải thông tin chat...</p>;
  if (!chatInfo) return <p className="text-center text-red-500">Không thể tải thông tin chat.</p>;

  const chatTitle = chatInfo?.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại";
  const chatImage = chatInfo?.isGroup
    ? chatInfo.imageGroup?.trim() || DEFAULT_GROUP_IMAGE
    : otherUser?.avatar || DEFAULT_AVATAR;
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
          <img src={chatImage} className="w-20 h-20 rounded-full mx-auto object-cover" alt={displayName} />
          <div className="flex items-center justify-center mt-2">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            {chatInfo?.isGroup && (
              <button onClick={handleOpenEditNameModal} className="text-gray-500 hover:text-blue-500 ml-2">
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
          onGroupSelect={handleGroupSelect}
        />

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

        <GroupMediaGallery conversationId={conversationId} userId={userId} socket={socket} />
        <GroupFile conversationId={conversationId} userId={userId} socket={socket} />
        <GroupLinks conversationId={conversationId} userId={userId} socket={socket} />
        <SecuritySettings
          conversationId={conversationId}
          userId={userId}
          setChatInfo={setChatInfo}
          userRoleInGroup={userRoleInGroup}
          setUserRoleInGroup={setUserRoleInGroup}
          chatInfo={chatInfo}
          socket={socket}
        />
      </div>

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
        currentConversationParticipants={chatInfo?.participants?.map((p) => p.userId) || []}
        socket={socket}
      />
      <PinLimitModal isOpen={isPinLimitModalOpen} onClose={() => setIsPinLimitModalOpen(false)} />
    </div>
  );
};

export default ChatInfo;