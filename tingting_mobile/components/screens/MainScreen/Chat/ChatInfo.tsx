import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Clipboard,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import GroupMemberList from "./chatInfoComponent/GroupMemberList";
import GroupMediaGallery from "./chatInfoComponent/GroupMediaGallery";
import SecuritySettings from "./chatInfoComponent/SecuritySettings";
import MuteNotificationModal from "./chatInfoComponent/MuteNotificationModal";
import AddMemberModal from "./chatInfoComponent/AddMemberModal";
import EditNameModal from "./chatInfoComponent/EditNameModal";
import CreateGroupModal from "./chatInfoComponent/CreateGroupModal";
import GroupActionButton from "./chatInfoComponent/GroupActionButton";
import AddToGroupModal from "./chatInfoComponent/AddToGroupModal";
import { Api_Profile } from "../../../../apis/api_profile";
import { Api_chatInfo } from "../../../../apis/Api_chatInfo";
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
} from "../../../../services/sockets/events/chatInfo";
import {
  onConversations,
  offConversations,
  onConversationUpdate,
  offConversationUpdate,
  loadAndListenConversations,
  joinConversation,
} from "../../../../services/sockets/events/conversation";
import { useSocket } from "../../../../contexts/SocketContext";
import { setChatInfoUpdate, setSelectedMessage } from "../../../../redux/slices/chatSlice";

const DEFAULT_AVATAR =
  "https://encrypted-tbn0.gstatic.com/images?q=tbngcQDPQFLjc7cTCBIW5tyYcZGlMkWfvQptRw-k1lF5XyVoor51KoaIx6gWCy-rh4J1kVlE0k&usqp=CAU";
const DEFAULT_GROUP_IMAGE =
  "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A0o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=";

// Định nghĩa interface cho dữ liệu
interface Participant {
  userId: string;
  role?: "admin" | "member";
  isHidden?: boolean;
  mute?: string | null;
  isPinned?: boolean;
}

interface ChatInfoData {
  _id: string;
  isGroup: boolean;
  name: string;
  imageGroup: string;
  linkGroup: string;
  participants: Participant[];
}

interface UserProfile {
  _id: string;
  firstname: string;
  surname: string;
  avatar: string | null;
}

interface UserGroup {
  _id: string;
  name: string;
  imageGroup?: string;
  participants?: Participant[];
}

const ChatInfo: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { userId, conversationId, socket: socketFromParams } = route.params || {};
  const { socket: socketFromContext, userId: contextUserId } = useSocket();

  // Sử dụng socket và userId từ params hoặc context
  const socket = socketFromParams || socketFromContext;
  const finalUserId = userId || contextUserId;

  // State để quản lý dữ liệu
  const [chatInfo, setChatInfo] = useState<ChatInfoData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false); // Thêm trạng thái loading cho groups
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [otherUserName, setOtherUserName] = useState("");
  const [userRoleInGroup, setUserRoleInGroup] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [commonGroups, setCommonGroups] = useState<UserGroup[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Hàm chọn và tham gia một nhóm
  // Nhận một nhóm và tham gia vào cuộc trò chuyện của nhóm đó
  const handleGroupSelect = (group: any) => {
    if (!socket) {
      Alert.alert("Lỗi", "Socket chưa kết nối!");
      return;
    }
    const formattedMessage = {
      id: group._id,
      name: group.name || "Nhóm không tên",
      participants: group.participants || [],
      isGroup: true,
      imageGroup: group.imageGroup || DEFAULT_GROUP_IMAGE,
      isPinned: false,
      mute: null,
    };
    joinConversation(socket, formattedMessage.id);
    dispatch(setSelectedMessage(formattedMessage));
  };

  // Lấy và cập nhật thông tin chat
  useEffect(() => {
    if (!socket || !conversationId || !finalUserId) {
      Alert.alert("Lỗi", "Thiếu thông tin người dùng hoặc cuộc trò chuyện.");
      setLoading(false);
      return;
    }

    // Lấy thông tin chat ban đầu
    getChatInfo(socket, { conversationId });

    // Xử lý khi nhận được thông tin chat
    const handleChatInfo = (newChatInfo: ChatInfoData) => {
      const participant = newChatInfo.participants?.find((p) => p.userId === finalUserId);
      if (participant?.isHidden) {
        Alert.alert("Lỗi", "Hội thoại này đang ẩn.");
        dispatch(setSelectedMessage(null));
        setLoading(false);
        return;
      }

      setChatInfo(newChatInfo);
      setIsMuted(!!participant?.mute);
      setIsPinned(!!participant?.isPinned);
      setUserRoleInGroup(participant?.role || null);

      // Nếu không phải nhóm, lấy thông tin người dùng khác
      if (!newChatInfo.isGroup) {
        const otherParticipant = newChatInfo.participants?.find(
          (p) => p.userId !== finalUserId
        );
        if (otherParticipant?.userId) {
          Api_Profile.getProfile(otherParticipant.userId)
            .then((response) => {
              const user = response?.data?.user as UserProfile;
              setOtherUser(user || { _id: "", firstname: "Không tìm thấy", surname: "", avatar: null });
              setOtherUserName(`${user.firstname || ""} ${user.surname || ""}`.trim() || "Người dùng");
            })
            .catch(() => {
              setOtherUser({ _id: "", firstname: "Không tìm thấy", surname: "", avatar: null });
              setOtherUserName("Người dùng");
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
      dispatch(setChatInfoUpdate(newChatInfo));
    };

    // Xử lý khi thông tin chat được cập nhật
    const handleChatInfoUpdated = (updatedInfo: Partial<ChatInfoData>) => {
      if (updatedInfo._id !== conversationId) return;
      const participant = updatedInfo.participants?.find(
        (p) => p.userId === finalUserId
      );
      if (participant?.isHidden) {
        Alert.alert("Lỗi", "Hội thoại này đang ẩn.");
        dispatch(setSelectedMessage(null));
        return;
      }

      setChatInfo((prev) => {
        if (!prev) return null;
        const newChatInfo = { ...prev, ...updatedInfo };
        dispatch(setChatInfoUpdate(newChatInfo));
        return newChatInfo;
      });
      setIsMuted(!!participant?.mute);
      setIsPinned(!!participant?.isPinned);
      setUserRoleInGroup(participant?.role || null);
    };

    // Xử lý khi có lỗi
    const handleError = (error: any) => {
      Alert.alert("Lỗi", "Đã xảy ra lỗi: " + (error.message || "Không xác định"));
      setLoading(false);
    };

    // Xử lý cập nhật thông tin chat (ảnh, video, file, link)
    const handleUpdateChatInfo = ({
      conversationId: updatedId,
      messageType,
    }: {
      conversationId: string;
      messageType: string;
    }) => {
      if (updatedId !== conversationId) return;
      if (messageType === "image" || messageType === "video")
        getChatMedia(socket, { conversationId });
      else if (messageType === "file") getChatFiles(socket, { conversationId });
      else if (messageType === "link") getChatLinks(socket, { conversationId });
    };

    // Đăng ký các sự kiện socket
    socket.on("updateChatInfo", handleUpdateChatInfo);
    onChatInfo(socket, handleChatInfo);
    onChatInfoUpdated(socket, handleChatInfoUpdated);
    onError(socket, handleError);
    getChatMedia(socket, { conversationId });
    getChatFiles(socket, { conversationId });
    getChatLinks(socket, { conversationId });

    // Dọn dẹp khi component bị hủy
    return () => {
      socket.off("updateChatInfo", handleUpdateChatInfo);
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, finalUserId, dispatch, navigation]);

  // Lấy và cập nhật danh sách cuộc trò chuyện
  useEffect(() => {
    if (!socket || !finalUserId) {
      setError("Thiếu socket hoặc ID người dùng để tải danh sách cuộc trò chuyện.");
      return;
    }

    // Hàm xử lý load danh sách cuộc trò chuyện
    const fetchConversations = async () => {
      try {
        const cleanup = loadAndListenConversations(socket, (convs: any[]) => {
          setConversations(convs);
          setError(null); // Xóa lỗi nếu load thành công
        });
        
        // Lắng nghe sự kiện cập nhật danh sách cuộc trò chuyện
        onConversations(socket, (convs: any[]) => {
          setConversations(convs);
          setError(null);
        });

        // Lắng nghe sự kiện cập nhật từng cuộc trò chuyện
        onConversationUpdate(socket, (updatedConversation: any) => {
          setConversations((prev) =>
            prev.map((conv) =>
              conv._id === updatedConversation._id ? updatedConversation : conv
            )
          );
        });

        // Trả về hàm cleanup để dọn dẹp các listener
        return () => {
          cleanup();
          offConversations(socket);
          offConversationUpdate(socket);
        };
      } catch (error) {
        console.warn("Lỗi khi tải danh sách cuộc trò chuyện:", error);
        setError("Không thể tải danh sách cuộc trò chuyện.");
      }
    };

    fetchConversations();
  }, [socket, finalUserId]);

  // Tính toán các nhóm chung giữa hai người dùng
  useEffect(() => {
    if (!chatInfo || !conversations.length || !finalUserId) {
      setCommonGroups([]);
      return;
    }

    const otherUserId = chatInfo.participants?.find((p) => p.userId !== finalUserId)?.userId;
    if (!otherUserId || chatInfo.isGroup) {
      setCommonGroups([]);
      return;
    }

    const common = conversations.filter(
      (conv) =>
        conv.isGroup &&
        conv._id !== chatInfo._id &&
        conv.participants?.some((p) => p.userId === finalUserId) &&
        conv.participants?.some((p) => p.userId === otherUserId)
    );
    setCommonGroups(common);
  }, [chatInfo, conversations, finalUserId]);

  // Lấy danh sách nhóm của người dùng
  const fetchUserGroups = useCallback(async () => {
    if (!finalUserId) {
      setError("Thiếu ID người dùng.");
      setUserGroups([]);
      setIsLoadingGroups(false);
      return;
    }

    setIsLoadingGroups(true);
    try {
      const res = await Api_chatInfo.getUserGroups(finalUserId);
      console.log("API response for getUserGroups:", res); // Debug response
      if (res.success) {
        const groups = (res.groups || []).map((group: any) => ({
          _id: group._id,
          name: group.name,
          imageGroup: group.imageGroup || DEFAULT_GROUP_IMAGE,
          participants: Array.isArray(group.participants) ? group.participants : [],
        }));
        setUserGroups(groups);
        console.log("User groups loaded:", groups); // Debug groups
      } else {
        setUserGroups([]);
        setError(res.error || "Không thể tải danh sách nhóm.");
      }
    } catch (error) {
      console.warn("Lỗi lấy danh sách nhóm:", error);
      setUserGroups([]);
      setError("Lỗi khi tải danh sách nhóm.");
    } finally {
      setIsLoadingGroups(false);
    }
  }, [finalUserId, setError, setUserGroups]);

  // Tải danh sách nhóm ngay khi component mount
  useEffect(() => {
    if (finalUserId) {
      fetchUserGroups();
    }
  }, [finalUserId, fetchUserGroups]);

  // Xử lý khi thêm thành viên mới vào nhóm
  // Cập nhật lại thông tin chat sau khi thêm thành viên
  const handleMemberAdded = () => {
    getChatInfo(socket, { conversationId });
  };

  // Xử lý khi xóa thành viên khỏi nhóm
  // Cập nhật danh sách thành viên trong state
  const handleMemberRemoved = (removedUserId: string) => {
    setChatInfo((prev) => {
      if (!prev) return null;
      const updatedChatInfo = {
        ...prev,
        participants: prev.participants.filter((p) => p.userId !== removedUserId),
      };
      dispatch(setChatInfoUpdate(updatedChatInfo));
      return updatedChatInfo;
    });
  };

  // Bật/tắt thông báo
  // Nếu đang tắt, mở modal để chọn thời gian tắt thông báo
  // Nếu đang bật, gửi yêu cầu bật lại thông báo
  const handleMuteNotification = () => {
    if (isMuted) {
      updateNotification(socket, { conversationId, mute: null });
      setIsMuted(false);
      const updatedChatInfo = {
        ...chatInfo,
        participants: chatInfo?.participants.map((p) =>
          p.userId === finalUserId ? { ...p, mute: null } : p
        ),
        updatedAt: new Date().toISOString(),
      };
      setChatInfo(updatedChatInfo);
      dispatch(setChatInfoUpdate(updatedChatInfo));
    } else {
      setIsMuteModalOpen(true);
    }
  };

  // Xử lý khi bật/tắt thông báo thành công
  // Cập nhật trạng thái và thông tin chat
  const handleMuteSuccess = (muted: boolean) => {
    setIsMuted(muted);
    const updatedChatInfo = {
      ...chatInfo,
      participants: chatInfo?.participants.map((p) =>
        p.userId === finalUserId ? { ...p, mute: muted ? "muted" : null } : p
      ),
      updatedAt: new Date().toISOString(),
    };
    setChatInfo(updatedChatInfo);
    dispatch(setChatInfoUpdate(updatedChatInfo));
  };

  // Ghim/bỏ ghim cuộc trò chuyện
  // Gửi yêu cầu ghim/bỏ ghim đến server và cập nhật state
  const handlePinChat = () => {
    if (!chatInfo) return;
    const newIsPinned = !isPinned;
    pinChat(socket, { conversationId, isPinned: newIsPinned });
    joinConversation(socket, conversationId);
    setIsPinned(newIsPinned);
    const updatedChatInfo = {
      ...chatInfo,
      participants: chatInfo.participants.map((p) =>
        p.userId === finalUserId ? { ...p, isPinned: newIsPinned } : p
      ),
      updatedAt: new Date().toISOString(),
    };
    setChatInfo(updatedChatInfo);
    dispatch(setChatInfoUpdate(updatedChatInfo));
  };

  // Sao chép link nhóm vào clipboard
  const copyToClipboard = () => {
    if (chatInfo?.linkGroup) {
      Clipboard.setString(chatInfo.linkGroup);
      Alert.alert("Thông báo", "Đã sao chép link nhóm!");
    }
  };

  // Mở modal để thêm thành viên hoặc tạo nhóm
  const handleAddMember = () => {
    if (!chatInfo) {
      Alert.alert("Lỗi", "Thông tin cuộc trò chuyện chưa được tải.");
      return;
    }
    if (chatInfo.isGroup) {
      setIsAddModalOpen(true);
      setIsCreateGroupModalOpen(false);
    } else {
      setIsCreateGroupModalOpen(true);
      setIsAddModalOpen(false);
    }
  };

  // Xem hồ sơ người dùng
  // Chuyển hướng đến màn hình hồ sơ với userId
  const handleViewProfile = () => {
    if (!otherUser?._id) {
      Alert.alert("Lỗi", "Không có thông tin người dùng.");
      return;
    }
    navigation.navigate("ProfileScreen2", { userId: otherUser._id, profile: otherUser });
  };

  // Tạo nhóm mới
  // Mở modal tạo nhóm
  const handleCreateGroup = () => {
    if (!socket) {
      Alert.alert("Lỗi", "Không thể kết nối đến server.");
      return;
    }
    if (!finalUserId || !otherUser?._id) {
      Alert.alert("Lỗi", "Thiếu thông tin người dùng.");
      return;
    }
    setIsCreateGroupModalOpen(true);
  };

  // Thêm người dùng vào nhóm
  // Mở modal thêm vào nhóm
  const handleAddToGroup = async () => {
    console.log("handleAddToGroup called, userGroups:", userGroups);
    if (!userGroups.length && !isLoadingGroups) {
      await fetchUserGroups(); // Gọi lại fetchUserGroups nếu userGroups rỗng
      if (!userGroups.length) {
        Alert.alert("Thông báo", "Bạn chưa tham gia nhóm nào.");
        return;
      }
    }
    if (!otherUser?._id) {
      Alert.alert("Lỗi", "Không có thông tin người dùng để thêm.");
      return;
    }
    setIsAddToGroupModalOpen(true);
  };

  // Xử lý khi tạo nhóm thành công
  // Chuyển hướng đến màn hình chat của nhóm mới
  const handleCreateGroupSuccess = (newGroup: any) => {
    setIsCreateGroupModalOpen(false);
    setConversations((prev) => [...prev, newGroup]);
    navigation.navigate("Main", {
      screen: "ChatScreen",
      params: { conversationId: newGroup._id },
    });
  };

  // Xử lý khi thêm vào nhóm thành công
  // Hiển thị thông báo và đóng modal
  const handleAddToGroupSuccess = (group: UserGroup) => {
    Alert.alert("Thành công", `Đã thêm thành viên vào nhóm ${group.name || "Nhóm không tên"}!`);
    setIsAddToGroupModalOpen(false);
  };

  // Mở modal chỉnh sửa tên nhóm
  const handleOpenEditNameModal = () => {
    if (!chatInfo?.isGroup) {
      Alert.alert("Lỗi", "Chỉ nhóm mới có thể đổi tên!");
      return;
    }
    setIsEditNameModalOpen(true);
  };

  // Đóng modal chỉnh sửa tên
  const handleCloseEditNameModal = () => {
    setIsEditNameModalOpen(false);
  };

  // Lưu tên nhóm mới
  // Gửi yêu cầu cập nhật tên đến server
  const handleSaveChatName = (newName: string) => {
    if (!chatInfo || !newName.trim()) return;
    const originalName = chatInfo.name;
    setChatInfo((prev) => ({ ...prev!, name: newName.trim() }));
    updateChatName(socket, { conversationId, name: newName.trim() });
    dispatch(setChatInfoUpdate({ ...chatInfo, _id: conversationId, name: newName.trim() }));

    const handleUpdateError = (error: any) => {
      Alert.alert("Lỗi", "Không thể cập nhật tên nhóm: " + (error.message || "Lỗi server."));
      setChatInfo((prev) => ({ ...prev!, name: originalName }));
      dispatch(setChatInfoUpdate({ ...chatInfo, _id: conversationId, name: originalName }));
    };
    socket.once("error", handleUpdateError);
    setTimeout(() => socket.off("error", handleUpdateError), 5000);
    handleCloseEditNameModal();
  };

  // Tìm kiếm tin nhắn
  // Chuyển hướng đến màn hình tìm kiếm tin nhắn
  const handleSearchMessage = () => {
    navigation.navigate("MessageScreen", { conversationId });
  };

  // Giao diện khi đang tải
  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textGray}>Đang tải thông tin chat...</Text>
      </View>
    );
  }

  // Giao diện khi không tải được thông tin
  if (!chatInfo) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textRed}>Không thể tải thông tin chat.</Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            getChatInfo(socket, { conversationId });
          }}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Giao diện khi có lỗi
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textRed}>{error}</Text>
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setLoading(true);
            getChatInfo(socket, { conversationId });
            fetchUserGroups(); // Thử load lại nhóm
          }}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const chatDisplayName = chatInfo.isGroup
    ? chatInfo.name
    : `${otherUser?.firstname || ""} ${otherUser?.surname || ""}`.trim() || "Đang tải...";
  const chatDisplayImage = chatInfo.isGroup
    ? chatInfo.imageGroup?.trim() || DEFAULT_GROUP_IMAGE
    : otherUser?.avatar || DEFAULT_AVATAR;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
          <FontAwesome name="arrow-left" size={20} color="#1f2023" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {chatInfo.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.groupInfo}>
          <Image source={{ uri: chatDisplayImage }} style={styles.groupImage} />
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{chatDisplayName}</Text>
            {chatInfo.isGroup && (
              <TouchableOpacity onPress={handleOpenEditNameModal}>
                <FontAwesome name="edit" size={16} color="#666" style={styles.editIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <GroupActionButton
            icon="search"
            text="Tìm tin nhắn"
            onClick={handleSearchMessage}
            isActive={false}
          />
          <GroupActionButton
            icon={isMuted ? "mute" : "unmute"}
            text={isMuted ? "Bật thông báo" : "Tắt thông báo"}
            onClick={handleMuteNotification}
            isActive={isMuted}
          />
          <GroupActionButton
            icon={isPinned ? "pin" : "unpin"}
            text={isPinned ? "Bỏ ghim trò chuyện" : "Ghim cuộc trò chuyện"}
            onClick={handlePinChat}
            isActive={isPinned}
          />
          <GroupActionButton
            icon="add"
            text={chatInfo.isGroup ? "Thêm thành viên" : "Tạo nhóm trò chuyện"}
            onClick={handleAddMember}
            isActive={false}
          />
        </View>

        <GroupMemberList
          chatInfo={chatInfo}
          userId={finalUserId}
          conversationId={conversationId}
          onMemberRemoved={handleMemberRemoved}
          socket={socket}
          commonGroups={commonGroups}
          onGroupSelect={handleGroupSelect}
        />

        {chatInfo.linkGroup && (
          <View style={styles.linkContainer}>
            <Text style={styles.linkTitle}>Link tham gia nhóm</Text>
            <Text style={styles.linkText}>{chatInfo.linkGroup}</Text>
            <TouchableOpacity onPress={copyToClipboard}>
              <FontAwesome name="copy" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {!chatInfo.isGroup && otherUser && (
          <View>
            <View style={styles.socialActionContainer}>
              <TouchableOpacity style={styles.socialActionButton} onPress={handleViewProfile}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color="#1e90ff"
                  style={styles.socialActionIcon}
                />
                <Text style={styles.socialActionText}>Trang cá nhân</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.socialActionContainer}>
              <TouchableOpacity style={styles.socialActionButton} onPress={handleCreateGroup}>
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color="#1e90ff"
                  style={styles.socialActionIcon}
                />
                <Text style={styles.socialActionText}>Tạo nhóm với {otherUserName}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.socialActionContainer}>
              <TouchableOpacity style={styles.socialActionButton} onPress={handleAddToGroup}>
                <Ionicons
                  name="person-add-outline"
                  size={16}
                  color="#1e90ff"
                  style={styles.socialActionIcon}
                />
                <Text style={styles.socialActionText}>Thêm {otherUserName} vào nhóm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <GroupMediaGallery
          conversationId={conversationId}
          userId={finalUserId}
          socket={socket}
        />

        <SecuritySettings
          conversationId={conversationId}
          userId={finalUserId}
          setChatInfo={setChatInfo}
          userRoleInGroup={userRoleInGroup}
          setUserRoleInGroup={setUserRoleInGroup}
          chatInfo={chatInfo}
          socket={socket}
        />
      </ScrollView>

      <MuteNotificationModal
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        conversationId={conversationId}
        userId={finalUserId}
        onMuteSuccess={handleMuteSuccess}
        socket={socket}
      />
      <AddMemberModal
        isOpen={isAddModalOpen}
        conversationId={conversationId}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={handleMemberAdded}
        userId={finalUserId}
        currentMembers={chatInfo?.participants?.map((p) => p.userId) || []}
        socket={socket}
      />
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={handleCloseEditNameModal}
        onSave={handleSaveChatName}
        initialName={chatInfo?.name}
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        userId={finalUserId}
        onGroupCreated={handleCreateGroupSuccess}
        currentConversationParticipants={chatInfo?.participants?.map((p) => p.userId) || []}
        socket={socket}
      />
      <AddToGroupModal
        isOpen={isAddToGroupModalOpen}
        onClose={() => setIsAddToGroupModalOpen(false)}
        userGroups={userGroups}
        commonGroups={commonGroups}
        socket={socket}
        otherUserId={otherUser?._id || ""}
        currentUserId={finalUserId}
        onMemberAdded={handleAddToGroupSuccess}
        isLoadingGroups={isLoadingGroups} // Truyền trạng thái loading vào modal
      />
    </View>
  );
};

// Styles giữ nguyên như code gốc
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  header: {
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  groupInfo: {
    alignItems: "center",
    marginVertical: 15,
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  groupNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  editIcon: {
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  socialActionContainer: {
    marginVertical: 5,
  },
  socialActionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  socialActionIcon: {
    marginRight: 12,
  },
  socialActionText: {
    fontSize: 14,
    color: "#333",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  linkText: {
    fontSize: 14,
    color: "#1e90ff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textGray: {
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  textRed: {
    color: "#ff0000",
  },
  retryText: {
    color: "#1e90ff",
    marginTop: 10,
    fontSize: 16,
  },
});

export default ChatInfo;