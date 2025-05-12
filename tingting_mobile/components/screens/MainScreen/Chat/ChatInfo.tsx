import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { useNavigation, useRoute } from "@react-navigation/native";
import GroupMemberList from "./chatInfoComponent/GroupMemberList";
import GroupMediaGallery from "./chatInfoComponent/GroupMediaGallery";
import GroupFile from "./chatInfoComponent/GroupFile";
import GroupLinks from "./chatInfoComponent/GroupLinks";
import SecuritySettings from "./chatInfoComponent/SecuritySettings";
import MuteNotificationModal from "./chatInfoComponent/MuteNotificationModal";
import AddMemberModal from "./chatInfoComponent/AddMemberModal";
import EditNameModal from "./chatInfoComponent/EditNameModal";
import CreateGroupModal from "./chatInfoComponent/CreateGroupModal";
import GroupActionButton from "./chatInfoComponent/GroupActionButton";
import { Api_Profile } from "../../../../apis/api_profile";
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
  removeParticipant,
} from "../../../../services/sockets/events/chatInfo";
import {
  onConversations,
  offConversations,
  onConversationUpdate,
  offConversationUpdate,
  loadAndListenConversations,
} from "../../../../services/sockets/events/conversation";
import { useSocket } from "../../../../contexts/SocketContext";

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
  isPinned: boolean;
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
  const { userId, conversationId, socket: socketFromParams } = route.params || {};
  const { socket: socketFromContext, userId: contextUserId } = useSocket();

  // Sử dụng socket từ params nếu có, nếu không thì từ context
  const socket = socketFromParams || socketFromContext;
  // Sử dụng userId từ params nếu có, nếu không thì từ context
  const finalUserId = userId || contextUserId;

  const [chatInfo, setChatInfo] = useState<ChatInfoData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [userRoleInGroup, setUserRoleInGroup] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [commonGroups, setCommonGroups] = useState<any[]>([]);

  // Unique instance ID for debugging
  const instanceId = Math.random().toString(36).substring(7);

  // Log received props
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

  // Check for missing props
  useEffect(() => {
    if (!finalUserId || !conversationId || !socket) {
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
    } else {
      setHasMounted(true);
    }
  }, [finalUserId, conversationId, socket, navigation]);

  useEffect(() => {
    if (!socket || !conversationId || !hasMounted) return;

    console.log(
      `ChatInfo instance ${instanceId} sending getChatInfo request:`,
      { conversationId }
    );
    getChatInfo(socket, { conversationId });

    const handleOnChatInfo = (newChatInfo: ChatInfoData) => {
      console.log(
        `ChatInfo instance ${instanceId} received chat info:`,
        newChatInfo
      );
      setChatInfo(newChatInfo);

      const participant = newChatInfo.participants?.find(
        (p: Participant) => p.userId === finalUserId
      );
      if (participant) {
        setIsMuted(!!participant.mute);
        setIsPinned(!!participant.isPinned);
        setUserRoleInGroup(participant.role);
      } else {
        setIsMuted(false);
        setIsPinned(false);
        setUserRoleInGroup(null);
      }

      if (!newChatInfo.isGroup) {
        const otherParticipant = newChatInfo.participants?.find(
          (p: Participant) => p.userId !== finalUserId
        );
        if (otherParticipant?.userId) {
          console.log(
            `ChatInfo instance ${instanceId} fetching other user profile:`,
            otherParticipant.userId
          );
          Api_Profile.getProfile(otherParticipant.userId)
            .then((response) => {
              console.log(
                `ChatInfo instance ${instanceId} received other user profile:`,
                response?.data?.user
              );
              setOtherUser(response?.data?.user as UserProfile);
            })
            .catch((userError) => {
              console.error(
                `ChatInfo instance ${instanceId} error fetching other user:`,
                userError
              );
              setOtherUser({
                _id: "",
                firstname: "Không tìm thấy",
                surname: "",
                avatar: null,
              });
            });
        } else {
          setOtherUser(null);
        }
      } else {
        setOtherUser(null);
      }
      setLoading(false);
    };

    const handleOnChatInfoUpdated = (updatedInfo: Partial<ChatInfoData>) => {
      console.log(
        `ChatInfo instance ${instanceId} received chat info update:`,
        updatedInfo
      );
      setChatInfo((prevChatInfo) => {
        if (!prevChatInfo) return null;
        const updatedParticipants = updatedInfo.participants
          ? updatedInfo.participants
          : prevChatInfo.participants;
        return {
          ...prevChatInfo,
          ...updatedInfo,
          participants: updatedParticipants,
        };
      });
      const participant = updatedInfo.participants?.find(
        (p: Participant) => p.userId === finalUserId
      );
      if (participant) {
        setIsMuted(!!participant.mute);
        setIsPinned(!!participant.isPinned);
        setUserRoleInGroup(participant.role);
      }
    };

    const handleError = (err: string) => {
      console.error(`ChatInfo instance ${instanceId} received error:`, err);
      setError(err);
      Alert.alert("Lỗi", err);
      setLoading(false);
    };

    console.log(`ChatInfo instance ${instanceId} setting up socket listeners`);
    onChatInfo(socket, handleOnChatInfo);
    onChatInfoUpdated(socket, handleOnChatInfoUpdated);
    onError(socket, handleError);

    return () => {
      console.log(`ChatInfo instance ${instanceId} cleaning up socket listeners`);
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, finalUserId, hasMounted]);

  useEffect(() => {
    if (!socket || !finalUserId || !hasMounted) return;

    console.log(
      `ChatInfo instance ${instanceId} setting up conversation listeners`
    );

    const handleOnConversations = (conversationsData: any[]) => {
      console.log(
        `ChatInfo instance ${instanceId} received conversations:`,
        conversationsData
      );
      setConversations(conversationsData);
    };

    const handleOnConversationUpdate = (updatedConversation: any) => {
      console.log(
        `ChatInfo instance ${instanceId} received conversation update:`,
        updatedConversation
      );
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv._id === updatedConversation._id ? updatedConversation : conv
        )
      );
    };

    loadAndListenConversations(socket, handleOnConversations);
    onConversations(socket, handleOnConversations);
    onConversationUpdate(socket, handleOnConversationUpdate);

    return () => {
      console.log(
        `ChatInfo instance ${instanceId} cleaning up conversation listeners`
      );
      offConversations(socket);
      offConversationUpdate(socket);
    };
  }, [socket, finalUserId, hasMounted]);

  useEffect(() => {
    if (!chatInfo || !conversations.length || !finalUserId) {
      setCommonGroups([]);
      return;
    }

    const otherParticipant = chatInfo.participants?.find(
      (p) => p.userId !== finalUserId
    );
    const otherUserId = otherParticipant?.userId;

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

  const handleMemberAdded = () => {
    console.log(
      `ChatInfo instance ${instanceId} requesting updated chat info after member added`
    );
    getChatInfo(socket, { conversationId });
    Alert.alert("Thành công", "Đã thêm thành viên vào nhóm!");
  };

  const handleMemberRemoved = (memberId: string) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa thành viên này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: () => {
            console.log(
              `ChatInfo instance ${instanceId} requesting removal of member:`,
              memberId
            );
            removeParticipant(socket, { conversationId, userId: memberId });
            setChatInfo((prevChatInfo) => ({
              ...prevChatInfo,
              participants:
                prevChatInfo?.participants.filter(
                  (p) => p.userId !== memberId
                ) || [],
            }));
            Alert.alert("Thành công", "Đã xóa thành viên khỏi nhóm!");
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleCreateGroupSuccess = (newGroup: any) => {
    Alert.alert("Thành công", "Tạo nhóm thành công!");
    setIsCreateGroupModalOpen(false);
    navigation.navigate("Main", {
      screen: "ChatScreen",
      params: { conversationId: newGroup._id },
    });
  };

  const handleMuteNotification = () => {
    if (isMuted) {
      console.log(
        `ChatInfo instance ${instanceId} requesting to unmute notifications`
      );
      updateNotification(socket, { conversationId, mute: null });
      setIsMuted(false);
      Alert.alert("Thông báo", "Đã bật thông báo!");
    } else {
      console.log(
        `ChatInfo instance ${instanceId} opening mute notification modal`
      );
      setIsMuteModalOpen(true);
    }
  };

  const handleMuteSuccess = (muted: boolean) => {
    console.log(
      `ChatInfo instance ${instanceId} mute status updated to:`,
      muted
    );
    setIsMuted(muted);
    Alert.alert("Thông báo", muted ? "Đã tắt thông báo!" : "Đã bật thông báo!");
  };

  const handlePinChat = () => {
    if (!chatInfo) return;

    const newIsPinned = !isPinned;
    console.log(
      `ChatInfo instance ${instanceId} requesting to pin chat:`,
      newIsPinned
    );
    pinChat(socket, { conversationId, isPinned: newIsPinned });
    setIsPinned(newIsPinned);
    Alert.alert(
      "Thông báo",
      newIsPinned ? "Đã ghim cuộc trò chuyện!" : "Đã bỏ ghim cuộc trò chuyện!"
    );
  };

  const handleAddMember = () => {
    if (!chatInfo) {
      Alert.alert(
        "Lỗi",
        "Thông tin cuộc trò chuyện chưa được tải. Vui lòng thử lại."
      );
      return;
    }
    if (chatInfo.isGroup) {
      setIsAddModalOpen(true);
    } else {
      setIsCreateGroupModalOpen(true);
    }
  };

  const handleOpenEditNameModal = () => setIsEditNameModalOpen(true);
  const handleCloseEditNameModal = () => setIsEditNameModalOpen(false);

  const handleSaveChatName = async (newName: string) => {
    if (!chatInfo || !newName.trim()) return;

    console.log(
      `ChatInfo instance ${instanceId} requesting to update chat name:`,
      newName.trim()
    );
    updateChatName(socket, { conversationId, name: newName.trim() });
    setChatInfo({ ...chatInfo, name: newName.trim() });
    Alert.alert("Thông báo", "Cập nhật tên thành công!");
    handleCloseEditNameModal();
  };

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

  if (error || !chatInfo) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textRed}>
          {error || "Không thể tải thông tin chat."}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            setError(null);
            getChatInfo(socket, { conversationId });
          }}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentConversationParticipants = chatInfo.participants
    .filter((p) => p.userId !== finalUserId)
    .map((p) => p.userId);

  const chatDisplayName = chatInfo.isGroup
    ? chatInfo.name
    : `${otherUser?.firstname || ""} ${otherUser?.surname || ""}`.trim() ||
      "Đang tải...";
  const chatDisplayImage = chatInfo.isGroup
    ? chatInfo.imageGroup?.trim() || "https://via.placeholder.com/150"
    : otherUser?.avatar || "https://via.placeholder.com/150";

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
            {!chatInfo.isGroup && otherUser && (
              <Text style={styles.textGray}>
                {otherUser.firstname} {otherUser.surname}
              </Text>
            )}
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
        />

        {chatInfo.linkGroup && (
          <View style={styles.linkContainer}>
            <Text style={styles.linkTitle}>Link tham gia nhóm</Text>
            <Text style={styles.linkText}>{chatInfo.linkGroup}</Text>
            <TouchableOpacity
              onPress={() => Alert.alert("Sao chép", "Đã sao chép link nhóm!")}
            >
              <Icon name="copy" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <GroupMediaGallery
          conversationId={conversationId}
          userId={finalUserId}
          socket={socket}
        />
        <GroupFile
          conversationId={conversationId}
          userId={finalUserId}
          socket={socket}
        />
        <GroupLinks
          conversationId={conversationId}
          userId={finalUserId}
          socket={socket}
        />
        <SecuritySettings
          conversationId={conversationId}
          userId={finalUserId}
          setChatInfo={setChatInfo}
          userRoleInGroup={userRoleInGroup}
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
        currentMembers={currentConversationParticipants}
        socket={socket}
      />
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={handleCloseEditNameModal}
        onSave={handleSaveChatName}
        initialName={chatInfo.name}
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        userId={finalUserId}
        onGroupCreated={handleCreateGroupSuccess}
        currentConversationParticipants={currentConversationParticipants}
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
    flexDirection: "column",
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