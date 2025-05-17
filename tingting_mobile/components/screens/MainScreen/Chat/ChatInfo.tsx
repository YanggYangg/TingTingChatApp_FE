import React, { useState, useEffect } from "react";
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
import { FontAwesome } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
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
import { Api_Profile } from "../../../../apis/api_profile";
import {
  getChatInfo, onChatInfo, offChatInfo, onChatInfoUpdated, offChatInfoUpdated,
  updateChatName, pinChat, updateNotification, onError, offError,
  getChatMedia, getChatFiles, getChatLinks,
} from "../../../../services/sockets/events/chatInfo";
import {
  onConversations, offConversations, onConversationUpdate, offConversationUpdate,
  loadAndListenConversations, joinConversation,
} from "../../../../services/sockets/events/conversation";
import { useSocket } from "../../../../contexts/SocketContext";
import { setChatInfoUpdate, setSelectedMessage } from "../../../../redux/slices/chatSlice";

// Default avatar and group image for fallback
const DEFAULT_AVATAR = "https://encrypted-tbn0.gstatic.com/images?q=tbngcQDPQFLjc7cTCBIW5tyYcZGlMkWfvQptRw-k1lF5XyVoor51KoaIx6gWCy-rh4J1kVlE0k&usqp=CAU";
const DEFAULT_GROUP_IMAGE = "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A0o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=";

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

interface ChatInfoProps {
  route: {
    params: {
      userId: string;
      conversationId: string;
      socket: any;
    };
  };
}

const Icon = FontAwesome;

const ChatInfo: React.FC<ChatInfoProps> = () => {
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
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [userRoleInGroup, setUserRoleInGroup] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [commonGroups, setCommonGroups] = useState<any[]>([]);

  const instanceId = Math.random().toString(36).substring(7);

  console.log(
    `ChatInfo instance ${instanceId} received props at:`,
    new Date().toISOString(),
    {
      userId: finalUserId,
      conversationId,
      socket: socket ? "Socket exists" : "Socket missing",
      routeParams: route.params,
      navigationState: navigation.getState()?.routes,
    }
  );

  // Select a group and join its conversation
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
      mute: false,
    };
    joinConversation(socket, formattedMessage.id);
    dispatch(setSelectedMessage(formattedMessage));
  };

  // Fetch and listen for chat info updates
  useEffect(() => {
    if (!socket || !conversationId || !finalUserId) {
      console.warn(
        `ChatInfo instance ${instanceId} missing userId, conversationId, or socket:`,
        {
          userId: finalUserId,
          conversationId,
          socket,
        }
      );
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
      console.log(`ChatInfo instance ${instanceId} received chat info:`, newChatInfo);
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
          console.log(`ChatInfo instance ${instanceId} fetching other user profile:`, otherParticipant.userId);
          Api_Profile.getProfile(otherParticipant.userId)
            .then((response) => {
              console.log(`ChatInfo instance ${instanceId} received other user profile:`, response?.data?.user);
              const user = response?.data?.user as UserProfile;
              setOtherUser(user || { _id: "", firstname: "Không tìm thấy", surname: "", avatar: null });
            })
            .catch((userError) => {
              console.error(`ChatInfo instance ${instanceId} error fetching other user:`, userError);
              setOtherUser({ _id: "", firstname: "Không tìm thấy", surname: "", avatar: null });
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
      console.log(`ChatInfo instance ${instanceId} received chat info update:`, updatedInfo);
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
      console.error(`ChatInfo instance ${instanceId} received error:`, error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi: " + (error.message || "Không thể cập nhật thông tin."));
      setLoading(false);
    };

    console.log(`ChatInfo instance ${instanceId} setting up socket listeners`);
    socket.on("updateChatInfo", handleUpdateChatInfo);
    onChatInfo(socket, handleOnChatInfo);
    onChatInfoUpdated(socket, handleOnChatInfoUpdated);
    onError(socket, handleError);
    getChatMedia(socket, { conversationId });
    getChatFiles(socket, { conversationId });
    getChatLinks(socket, { conversationId });

    return () => {
      console.log(`ChatInfo instance ${instanceId} cleaning up socket listeners`);
      socket.off("updateChatInfo", handleUpdateChatInfo);
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, finalUserId, dispatch, navigation]);

  // Load and listen for conversation updates
  useEffect(() => {
    if (!socket || !finalUserId) return;

    console.log(`ChatInfo instance ${instanceId} setting up conversation listeners`);
    const cleanup = loadAndListenConversations(socket, setConversations);
    onConversations(socket, setConversations);
    onConversationUpdate(socket, (updatedConversation: any) => {
      console.log(`ChatInfo instance ${instanceId} received conversation update:`, updatedConversation);
      setConversations((prev) =>
        prev.map((conv) => (conv._id === updatedConversation._id ? updatedConversation : conv))
      );
    });

    return () => {
      console.log(`ChatInfo instance ${instanceId} cleaning up conversation listeners`);
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

  // Handle adding a new member to the group
  const handleMemberAdded = () => {
    console.log(`ChatInfo instance ${instanceId} requesting updated chat info after member added`);
    getChatInfo(socket, { conversationId });
  };

  // Handle removing a member from the group
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

  // Toggle mute notification status
  const handleMuteNotification = () => {
    if (isMuted) {
      console.log(`ChatInfo instance ${instanceId} requesting to unmute notifications`);
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
      console.log(`ChatInfo instance ${instanceId} opening mute notification modal`);
      setIsMuteModalOpen(true);
    }
  };

  // Handle successful mute action
  const handleMuteSuccess = (muted: boolean) => {
    console.log(`ChatInfo instance ${instanceId} mute status updated to:`, muted);
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

  // Toggle pin chat status
  const handlePinChat = () => {
    if (!chatInfo) return;
    const newIsPinned = !isPinned;
    console.log(`ChatInfo instance ${instanceId} requesting to pin chat:`, newIsPinned);
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

  // Open modal to add a member
  const handleAddMember = () => {
    if (!chatInfo) {
      Alert.alert("Lỗi", "Thông tin cuộc trò chuyện chưa được tải. Vui lòng thử lại.");
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

  // Handle successful group creation
  const handleCreateGroupSuccess = (newGroup: any) => {
    setIsCreateGroupModalOpen(false);
    setConversations((prev) => [...prev, newGroup]);
    navigation.navigate("Main", {
      screen: "ChatScreen",
      params: { conversationId: newGroup._id },
    });
  };

  // Open modal to edit group name
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
    console.log(`ChatInfo instance ${instanceId} requesting to update chat name:`, newName.trim());
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

  // Handle search message
  const handleSearchMessage = () => {
    navigation.navigate("MessageScreen", { conversationId });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textGray}>Đang tải thông tin chat...</Text>
      </View>
    );
  }

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

  const chatDisplayName = chatInfo.isGroup
    ? chatInfo.name
    : `${otherUser?.firstname || ""} ${otherUser?.surname || ""}`.trim() || "Đang tải...";
  const chatDisplayImage = chatInfo.isGroup
    ? chatInfo.imageGroup?.trim() || DEFAULT_GROUP_IMAGE
    : otherUser?.avatar || DEFAULT_AVATAR;

  console.log(`ChatInfo instance ${instanceId} render - chatInfo:`, chatInfo);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 10 }}
        >
          <Icon name="arrow-left" size={20} color="#1f2023" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {chatInfo.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.groupInfo}>
          <Image
            source={{ uri: chatDisplayImage }}
            style={styles.groupImage}
            onError={() =>
              console.log(
                `ChatInfo instance ${instanceId} error loading group/avatar image`
              )
            }
          />
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{chatDisplayName}</Text>
            {chatInfo.isGroup && (
              <TouchableOpacity onPress={handleOpenEditNameModal}>
                <Icon
                  name="edit"
                  size={16}
                  color="#666"
                  style={styles.editIcon}
                />
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
              <Icon name="copy" size={20} color="#666" />
            </TouchableOpacity>
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