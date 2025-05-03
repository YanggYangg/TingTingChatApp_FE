import React, { useState, useEffect } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { setChatInfoUpdate } from "../../../redux/slices/chatSlice";
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
  joinConversation,
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
  const dispatch = useDispatch();

  useEffect(() => {
    setHasMounted(true);
    if (!socket || !conversationId) {
      console.warn("ChatInfo: Thiếu socket hoặc conversationId", { socket, conversationId });
      setLoading(false);
      return;
    }

    console.log("ChatInfo: Gửi yêu cầu getChatInfo", { conversationId });
    getChatInfo(socket, { conversationId });

    const handleOnChatInfo = (newChatInfo) => {
      console.log("ChatInfo: Nhận thông tin chat", newChatInfo);
      setChatInfo(newChatInfo);

      const participant = newChatInfo.participants?.find((p) => p.userId === userId);
      if (participant) {
        console.log("ChatInfo: Cập nhật trạng thái participant", {
          isMuted: !!participant.mute,
          isPinned: !!participant.isPinned,
          role: participant.role || null,
        });
        setIsMuted(!!participant.mute);
        setIsPinned(!!participant.isPinned);
        setUserRoleInGroup(participant.role || null);
      }

      if (!newChatInfo.isGroup) {
        const otherParticipant = newChatInfo.participants?.find(
          (p) => p.userId !== userId
        );
        if (otherParticipant?.userId) {
          console.log("ChatInfo: Lấy thông tin người dùng khác", { userId: otherParticipant.userId });
          Api_Profile.getProfile(otherParticipant.userId)
            .then((response) => {
              console.log("ChatInfo: Nhận thông tin người dùng", response?.data?.user);
              setOtherUser(response?.data?.user);
            })
            .catch((error) => {
              console.error("ChatInfo: Lỗi khi lấy thông tin người dùng khác", error);
              setOtherUser({
                firstname: "Không tìm thấy",
                surname: "",
              });
            })
            .finally(() => {
              console.log("ChatInfo: Hoàn tất tải thông tin người dùng");
              setLoading(false);
            });
        } else {
          console.log("ChatInfo: Không tìm thấy otherParticipant");
          setLoading(false);
        }
      } else {
        console.log("ChatInfo: Đây là nhóm, không cần lấy thông tin người dùng");
        setLoading(false);
      }

      dispatch(setChatInfoUpdate(newChatInfo)); // Đồng bộ với Redux
    };

    const handleOnChatInfoUpdated = (updatedInfo) => {
      console.log("ChatInfo: Nhận sự kiện chatInfoUpdated", updatedInfo);
      if (updatedInfo._id !== conversationId) {
        console.log("ChatInfo: Bỏ qua cập nhật vì không khớp conversationId", {
          updatedConversationId: updatedInfo._id,
          currentConversationId: conversationId,
        });
        return;
      }

      setChatInfo((prev) => {
        const newChatInfo = {
          ...prev,
          ...updatedInfo,
          participants: updatedInfo.participants || prev.participants,
          name: updatedInfo.name || prev.name,
        };
        console.log("ChatInfo: Cập nhật chatInfo", newChatInfo);
        return newChatInfo;
      });

      const participant = updatedInfo.participants?.find((p) => p.userId === userId);
      if (participant) {
        console.log("ChatInfo: Cập nhật trạng thái isMuted/isPinned/role", {
          isMuted: !!participant.mute,
          isPinned: !!participant.isPinned,
          role: participant.role || null,
        });
        setIsMuted(!!participant.mute);
        setIsPinned(!!participant.isPinned);
        setUserRoleInGroup(participant.role || null);
      }

      dispatch(setChatInfoUpdate(updatedInfo)); // Đồng bộ với Redux
    };

    const handleError = (error) => {
      console.error("ChatInfo: Lỗi từ server", error);
      toast.error("Đã xảy ra lỗi: " + (error.message || "Không thể cập nhật thông tin."));
      setLoading(false);
    };

    console.log("ChatInfo: Đăng ký socket listeners");
    onChatInfo(socket, handleOnChatInfo);
    onChatInfoUpdated(socket, handleOnChatInfoUpdated);
    onError(socket, handleError);

    return () => {
      console.log("ChatInfo: Gỡ socket listeners");
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, userId, hasMounted, dispatch]);

  useEffect(() => {
    if (!socket || !userId) {
      console.warn("ChatInfo: Thiếu socket hoặc userId cho conversations");
      return;
    }

    console.log("ChatInfo: Đăng ký loadAndListenConversations");
    const cleanupLoadConversations = loadAndListenConversations(socket, (conversationsData) => {
      console.log("ChatInfo: Nhận conversations", conversationsData);
      setConversations(conversationsData || []);
    });

    onConversations(socket, (conversationsData) => {
      console.log("ChatInfo: Nhận sự kiện conversations", conversationsData);
      setConversations(conversationsData || []);
    });

    onConversationUpdate(socket, (updatedConversation) => {
      console.log("ChatInfo: Nhận sự kiện conversationUpdate", updatedConversation);
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv._id === updatedConversation._id ? updatedConversation : conv
        )
      );
    });

    return () => {
      console.log("ChatInfo: Gỡ listeners conversations");
      cleanupLoadConversations();
      offConversations(socket);
      offConversationUpdate(socket);
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!chatInfo || !conversations.length) {
      console.log("ChatInfo: Thiếu chatInfo hoặc conversations để tính commonGroups");
      setCommonGroups([]);
      return;
    }

    const otherParticipant = chatInfo.participants?.find((p) => p.userId !== userId);
    const otherUserId = otherParticipant?.userId;

    if (!otherUserId || chatInfo.isGroup) {
      console.log("ChatInfo: Không có otherUserId hoặc là nhóm, đặt commonGroups rỗng");
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

    console.log("ChatInfo: Tính commonGroups", commonGroups);
    setCommonGroups(commonGroups);
  }, [chatInfo, conversations, userId]);

  const handleMemberAdded = () => {
    console.log("ChatInfo: Gửi yêu cầu getChatInfo sau khi thêm thành viên", { conversationId });
    getChatInfo(socket, { conversationId });
  };

  const handleMemberRemoved = (removedUserId) => {
    console.log("ChatInfo: Xóa thành viên", { removedUserId });
    setChatInfo((prevChatInfo) => {
      const updatedChatInfo = {
        ...prevChatInfo,
        participants: prevChatInfo.participants.filter(
          (p) => p.userId !== removedUserId
        ),
      };
      dispatch(setChatInfoUpdate(updatedChatInfo));
      return updatedChatInfo;
    });
  };

  const handleMuteNotification = () => {
    if (isMuted) {
      console.log("ChatInfo: Bật thông báo", { conversationId });
      updateNotification(socket, { conversationId, mute: null });
      setIsMuted(false);
    } else {
      console.log("ChatInfo: Mở modal tắt thông báo");
      setIsMuteModalOpen(true);
    }
  };

  const handleMuteSuccess = (muted) => {
    console.log("ChatInfo: Cập nhật trạng thái mute", { muted });
    setIsMuted(muted);
  };

  const handlePinChat = () => {
    if (!chatInfo) {
      console.warn("ChatInfo: Không thể pin chat, thiếu chatInfo");
      return;
    }

    const newIsPinned = !isPinned;
    console.log("ChatInfo: Thay đổi trạng thái pin", { conversationId, newIsPinned });
    pinChat(socket, { conversationId, isPinned: newIsPinned });
    joinConversation(socket, conversationId);
    setIsPinned(newIsPinned);
    dispatch(
      setChatInfoUpdate({
        ...chatInfo,
        participants: chatInfo.participants.map((p) =>
          p.userId === userId ? { ...p, isPinned: newIsPinned } : p
        ),
      })
    );
  };

  const copyToClipboard = () => {
    console.log("ChatInfo: Sao chép link nhóm", { link: chatInfo?.linkGroup });
    navigator.clipboard.writeText(chatInfo?.linkGroup || "");
    toast.success("Đã sao chép link nhóm!");
  };

  const handleAddMember = () => {
    console.log("ChatInfo: Mở modal thêm thành viên");
    setIsAddModalOpen(true);
    setIsCreateGroupModalOpen(false);
  };

  const handleCreateGroupChat = () => {
    console.log("ChatInfo: Mở modal tạo nhóm");
    setIsCreateGroupModalOpen(true);
    setIsAddModalOpen(false);
  };

  const handleCloseCreateGroupModal = () => {
    console.log("ChatInfo: Đóng modal tạo nhóm");
    setIsCreateGroupModalOpen(false);
  };

  const handleCreateGroupSuccess = (newGroup) => {
    console.log("ChatInfo: Tạo nhóm thành công", newGroup);
    setConversations((prevConversations) => [...prevConversations, newGroup]);
  };

  const handleOpenEditNameModal = () => {
    if (!chatInfo?.isGroup) {
      toast.error("Chỉ nhóm mới có thể đổi tên!");
      return;
    }
    console.log("ChatInfo: Mở modal chỉnh sửa tên");
    setIsEditNameModalOpen(true);
  };

  const handleCloseEditNameModal = () => {
    console.log("ChatInfo: Đóng modal chỉnh sửa tên");
    setIsEditNameModalOpen(false);
  };

  const handleSaveChatName = (newName) => {
    if (!chatInfo || !newName.trim()) {
      console.warn("ChatInfo: Không thể lưu tên nhóm", {
        chatInfo,
        newName,
      });
      return;
    }

    const originalName = chatInfo.name;
    console.log("ChatInfo: Gửi yêu cầu cập nhật tên nhóm", {
      conversationId,
      newName: newName.trim(),
    });
    setChatInfo((prev) => ({ ...prev, name: newName.trim() }));
    updateChatName(socket, { conversationId, name: newName.trim() });

    dispatch(
      setChatInfoUpdate({
        ...chatInfo,
        _id: conversationId,
        name: newName.trim(),
      })
    );

    const handleUpdateError = (error) => {
      console.error("ChatInfo: Lỗi khi cập nhật tên nhóm", error);
      toast.error("Không thể cập nhật tên nhóm: " + (error.message || "Lỗi server."));
      setChatInfo((prev) => ({ ...prev, name: originalName }));
      dispatch(
        setChatInfoUpdate({
          ...chatInfo,
          _id: conversationId,
          name: originalName,
        })
      );
    };
    socket.once("error", handleUpdateError);
    setTimeout(() => socket.off("error", handleUpdateError), 5000);

    handleCloseEditNameModal();
  };

  if (loading) {
    console.log("ChatInfo: Đang tải thông tin chat...");
    return <p className="text-center text-gray-500">Đang tải thông tin chat...</p>;
  }

  if (!chatInfo) {
    console.warn("ChatInfo: Không thể tải thông tin chat");
    return <p className="text-center text-red-500">Không thể tải thông tin chat.</p>;
  }

  const chatTitle = chatInfo?.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại";
  const chatImage = chatInfo?.isGroup
    ? chatInfo.imageGroup?.trim()
      ? chatInfo.imageGroup
      : "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A0o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA="
    : otherUser?.avatar ||
      "https://encrypted-tbn0.gstatic.com/images?q=tbngcQDPQFLjc7cTCBIW5tyYcZGlMkWfvQptRw-k1lF5XyVoor51KoaIx6gWCy-rh4J1kVlE0k&usqp=CAU";
  const displayName = chatInfo?.isGroup
    ? chatInfo.name
    : `${otherUser?.firstname} ${otherUser?.surname}`.trim() || "Đang tải...";

  console.log("ChatInfo: Render với", { chatTitle, displayName, chatImage });

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
        <GroupLinks
          conversationId={conversationId}
          userId={userId}
          socket={socket}
        />
        <SecuritySettings
          conversationId={conversationId}
          userId={userId}
          setChatInfo={setChatInfo}
          userRoleInGroup={userRoleInGroup}
          setUserRoleInGroup={setUserRoleInGroup} // Truyền prop
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
        currentConversationParticipants={
          chatInfo?.participants?.map((p) => p.userId) || []
        }
        socket={socket}
      />
    </div>
  );
};

export default ChatInfo;