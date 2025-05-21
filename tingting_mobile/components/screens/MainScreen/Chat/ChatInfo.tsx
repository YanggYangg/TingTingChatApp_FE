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

  const socket = socketFromParams || socketFromContext;
  const finalUserId = userId || contextUserId;

  const [chatInfo, setChatInfo] = useState<ChatInfoData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isAddToGroupModalOpen, setIsAddToGroupModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [otherUserName, setOtherUserName] = useState("");
  const [userRoleInGroup, setUserRoleInGroup] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [commonGroups, setCommonGroups] = useState<UserGroup[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Handle group selection and join conversation
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

  // Fetch and listen for chat info updates
  useEffect(() => {
    if (!socket || !conversationId || !finalUserId) {
      Alert.alert(
        "Lỗi",
        "Thiếu thông tin người dùng, cuộc trò chuyện hoặc kết nối.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      setLoading(false);
      return;
    }

    getChatInfo(socket, { conversationId });

    const handleUpdateChatInfo = ({ conversationId: updatedId, messageType }: { conversationId: string; messageType: string }) => {
      if (updatedId !== conversationId) return;
      if (messageType === "image" || messageType === "video") getChatMedia(socket, { conversationId });
      else if (messageType === "file") getChatFiles(socket, { conversationId });
      else if (messageType === "link") getChatLinks(socket, { conversationId });
    };

    const handleOnChatInfo = (newChatInfo: ChatInfoData) => {
      const participant = newChatInfo.participants?.find((p) => p.userId === finalUserId);
      if (participant?.isHidden) {
        Alert.alert("Lỗi", "Hội thoại này đang ẩn. Vui lòng xác thực lại.");
        dispatch(setSelectedMessage(null));
        setLoading(false);
        return;
      }

      setChatInfo(newChatInfo);
      setIsMuted(!!participant?.mute);
      setIsPinned(!!participant?.isPinned);
      setUserRoleInGroup(participant?.role || null);

      if (!newChatInfo.isGroup) {
        const otherParticipant = newChatInfo.participants?.find((p) => p.userId !== finalUserId);
        if (otherParticipant?.userId) {
          Api_Profile.getProfile(otherParticipant.userId)
            .then((response) => {
              const user = response?.data?.user as UserProfile;
              setOtherUser(user || { _id: "", firstname: "Không tìm thấy", surname: "", avatar: null });
              setOtherUserName(`${user.firstname || ''} ${user.surname || ''}`.trim() || 'Người dùng');
            })
            .catch((userError) => {
              setOtherUser({ _id: "", firstname: "Không tìm thấy", surname: "", avatar: null });
              setOtherUserName('Người dùng');
              setError("Không thể tải thông tin người dùng.");
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

    const handleOnChatInfoUpdated = (updatedInfo: Partial<ChatInfoData>) => {
      if (updatedInfo._id !== conversationId) return;
      const participant = updatedInfo.participants?.find((p) => p.userId === finalUserId);
      if (participant?.isHidden) {
        Alert.alert("Lỗi", "Hội thoại này đang ẩn. Vui lòng xác thực lại.");
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

    const handleError = (error: any) => {
      setError("Đã xảy ra lỗi: " + (error.message || "Không xác định"));
      setLoading(false);
    };

    socket.on("updateChatInfo", handleUpdateChatInfo);
    onChatInfo(socket, handleOnChatInfo);
    onChatInfoUpdated(socket, handleOnChatInfoUpdated);
    onError(socket, handleError);
    getChatMedia(socket, { conversationId });
    getChatFiles(socket, { conversationId });
    getChatLinks(socket, { conversationId });

    return () => {
      socket.off("updateChatInfo", handleUpdateChatInfo);
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, finalUserId, dispatch, navigation]);

  // Load and listen for conversation updates
  useEffect(() => {
    if (!socket || !finalUserId) {
      setError("Thiếu socket hoặc ID người dùng để tải danh sách cuộc trò chuyện.");
      return;
    }

    const cleanup = loadAndListenConversations(socket, (convs: any[]) => {
      setConversations(convs);
      setError(null);
    });
    onConversations(socket, (convs: any[]) => {
      setConversations(convs);
      setError(null);
    });
    onConversationUpdate(socket, (updatedConversation: any) => {
      setConversations((prev) =>
        prev.map((conv) => (conv._id === updatedConversation._id ? updatedConversation : conv))
      );
    });

    return () => {
      cleanup();
      offConversations(socket);
      offConversationUpdate(socket);
    };
  }, [socket, finalUserId]);

  // Calculate common groups between users
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

  // Fetch user groups
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
      if (res.success) {
        const groups = (res.groups || []).map((group: any) => ({
          _id: group._id,
          name: group.name,
          imageGroup: group.imageGroup || DEFAULT_GROUP_IMAGE,
          participants: Array.isArray(group.participants) ? group.participants : [],
        }));
        setUserGroups(groups);
      } else {
        setUserGroups([]);
        setError(res.error || "Không thể tải danh sách nhóm.");
      }
    } catch (error) {
      setUserGroups([]);
      setError("Lỗi khi tải danh sách nhóm.");
    } finally {
      setIsLoadingGroups(false);
    }
  }, [finalUserId]);

  // Load user groups on component mount
  useEffect(() => {
    if (finalUserId) {
      fetchUserGroups();
    }
  }, [finalUserId, fetchUserGroups]);

  // Handle adding a new member
  const handleMemberAdded = () => {
    getChatInfo(socket, { conversationId });
  };

  // Handle removing a member
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

  // Toggle mute notification
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

  // Handle mute success
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

  // Toggle pin chat
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

  // Copy group link to clipboard
  const copyToClipboard = () => {
    if (chatInfo?.linkGroup) {
      Clipboard.setString(chatInfo.linkGroup);
      Alert.alert("Thông báo", "Đã sao chép link nhóm!");
    }
  };

  // Open modal to add member or create group
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

  // View user profile
  const handleViewProfile = () => {
    if (!otherUser?._id) {
      Alert.alert("Lỗi", "Không có thông tin người dùng.");
      return;
    }
    navigation.navigate("ProfileScreen2", { userId: otherUser._id, profile: otherUser });
  };

  // Create new group
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

  // Add user to group
  const handleAddToGroup = async () => {
    if (!userGroups.length && !isLoadingGroups) {
      await fetchUserGroups();
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

  // Handle group creation success
  const handleCreateGroupSuccess = (newGroup: any) => {
    setIsCreateGroupModalOpen(false);
    setConversations((prev) => [...prev, newGroup]);
    navigation.navigate("Main", {
      screen: "ChatScreen",
      params: { conversationId: newGroup._id },
    });
  };

  // Handle add to group success
  const handleAddToGroupSuccess = (group: UserGroup) => {
    Alert.alert("Thành công", `Đã thêm thành viên vào nhóm ${group.name || "Nhóm không tên"}!`);
    setIsAddToGroupModalOpen(false);
    getChatInfo(socket, { conversationId });
  };

  // Open edit name modal
  const handleOpenEditNameModal = () => {
    if (!chatInfo?.isGroup) {
      Alert.alert("Lỗi", "Chỉ nhóm mới có thể đổi tên!");
      return;
    }
    setIsEditNameModalOpen(true);
  };

  // Close edit name modal
  const handleCloseEditNameModal = () => {
    setIsEditNameModalOpen(false);
  };

  // Save new chat name
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

  // Search messages
  const handleSearchMessage = () => {
    navigation.navigate("MessageScreen", { conversationId });
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textGray}>Đang tải thông tin chat...</Text>
      </View>
    );
  }

  // Error state
  if (error || !chatInfo) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textRed}>{error || "Không thể tải thông tin chat."}</Text>
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setLoading(true);
            getChatInfo(socket, { conversationId });
            fetchUserGroups();
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
        isLoadingGroups={isLoadingGroups}
      />
    </View>
  );
};

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