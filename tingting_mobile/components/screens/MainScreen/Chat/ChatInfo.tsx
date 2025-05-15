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
import { Ionicons } from "@expo/vector-icons";
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

interface UserGroup {
  _id: string;
  name: string;
  imageGroup?: string;
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

const AddToGroupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userGroups: UserGroup[];
  socket: any;
  otherUserId: string;
  onMemberAdded: () => void;
}> = ({ isOpen, onClose, userGroups, socket, otherUserId, onMemberAdded }) => {
  const handleSelectGroup = (group: UserGroup) => {
    if (!socket) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server.');
      return;
    }
    socket.emit('addMemberToGroup', { conversationId: group._id, userId: otherUserId }, (response: any) => {
      if (response?.success) {
        onMemberAdded();
      } else {
        Alert.alert('Lỗi', `Thêm thành viên thất bại: ${response?.message || 'Lỗi không xác định'}`);
      }
    });
    onClose();
  };

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose} style={styles.modal}>
      <View style={styles.modalContainer}>
        <View style={styles.modalTitleContainer}>
          <Ionicons name="person-add-outline" size={20} color="#333" style={styles.modalTitleIcon} />
          <Text style={styles.modalTitle}>Thêm vào nhóm</Text>
        </View>
        {userGroups.length === 0 ? (
          <Text style={styles.noGroupsText}>Bạn chưa tham gia nhóm nào.</Text>
        ) : (
          <ScrollView style={styles.list}>
            {userGroups.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.groupItem}
                onPress={() => handleSelectGroup(item)}
              >
                <Image
                  source={{ uri: item.imageGroup || 'https://via.placeholder.com/40' }}
                  style={styles.groupImageSmall}
                />
                <Text style={styles.groupName}>{item.name || 'Nhóm không tên'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <TouchableOpacity onPress={onClose} style={styles.closeIconWrapper}>
          <Ionicons name="close-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const ChatInfo: React.FC<ChatInfoProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
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
  const [error, setError] = useState<string | null>(null);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const [userRoleInGroup, setUserRoleInGroup] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [commonGroups, setCommonGroups] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);

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
              const user = response?.data?.user as UserProfile;
              setOtherUser(user);
              setOtherUserName(`${user.firstname || ''} ${user.surname || ''}`.trim() || 'Người dùng');
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
              setOtherUserName('Người dùng');
            });
        } else {
          setOtherUser(null);
          setOtherUserName('');
        }
      } else {
        setOtherUser(null);
        setOtherUserName('');
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

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!finalUserId) {
        setUserGroups([]);
        return;
      }
      try {
        const res = await Api_chatInfo.getUserGroups(finalUserId);
        setUserGroups(res?.groups || []);
      } catch (err) {
        console.error('Error fetching user groups:', err);
        setUserGroups([]);
      }
    };
    if (isAddToGroupModalOpen) {
      fetchUserGroups();
    }
  }, [isAddToGroupModalOpen, finalUserId]);

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
      // Alert.alert("Thông báo", "Đã bật thông báo!");
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
    // Alert.alert("Thông báo", muted ? "Đã tắt thông báo!" : "Đã bật thông báo!");
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
    // Alert.alert(
    //   "Thông báo",
    //   // newIsPinned ? "Đã ghim cuộc trò chuyện!" : "Đã bỏ ghim cuộc trò chuyện!"
    // );
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

  const handleViewProfile = () => {
    if (!otherUser?._id) {
      Alert.alert('Lỗi', 'Không có thông tin người dùng.');
      return;
    }
    navigation.navigate('ProfileScreen', { userId: otherUser._id, profile: otherUser });
  };

  const handleCreateGroup = () => {
    if (!socket) {
      Alert.alert('Lỗi', 'Không thể kết nối đến server.');
      return;
    }
    if (!finalUserId || !otherUser?._id) {
      Alert.alert('Lỗi', 'Thiếu thông tin người dùng.');
      return;
    }
    setIsCreateGroupModalOpen(true);
  };

  const handleAddToGroup = () => {
    if (!userGroups.length) {
      Alert.alert('Thông báo', 'Bạn chưa tham gia nhóm nào để thêm thành viên.');
      return;
    }
    if (!otherUser?._id) {
      Alert.alert('Lỗi', 'Không có thông tin người dùng để thêm.');
      return;
    }
    setIsAddToGroupModalOpen(true);
  };

  const handleAddToGroupSuccess = () => {
    Alert.alert('Thành công', 'Đã thêm thành viên vào nhóm!');
    setIsAddToGroupModalOpen(false);
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

        {!chatInfo.isGroup && otherUser && (
          <View>
            <View style={styles.socialActionContainer}>
              <TouchableOpacity style={styles.socialActionButton} onPress={handleViewProfile}>
                <Ionicons name="person-outline" size={16} color="#1e90ff" style={styles.socialActionIcon} />
                <Text style={styles.socialActionText}>Trang cá nhân</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.socialActionContainer}>
              <TouchableOpacity style={styles.socialActionButton} onPress={handleCreateGroup}>
                <Ionicons name="add-circle-outline" size={16} color="#1e90ff" style={styles.socialActionIcon} />
                <Text style={styles.socialActionText}>Tạo nhóm với {otherUserName}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.socialActionContainer}>
              <TouchableOpacity style={styles.socialActionButton} onPress={handleAddToGroup}>
                <Ionicons name="person-add-outline" size={16} color="#1e90ff" style={styles.socialActionIcon} />
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

    

        {/* <GroupFile
          conversationId={conversationId}
          userId={finalUserId}
          socket={socket}
        />
        <GroupLinks
          conversationId={conversationId}
          userId={finalUserId}
          socket={socket}
        /> */}
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
      <AddToGroupModal
        isOpen={isAddToGroupModalOpen}
        onClose={() => setIsAddToGroupModalOpen(false)}
        userGroups={userGroups}
        socket={socket}
        otherUserId={otherUser?._id || ''}
        onMemberAdded={handleAddToGroupSuccess}
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
    elevation: 2,
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
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  list: {
    maxHeight: 300,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupImageSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  groupName: {
    fontSize: 14,
    color: '#333',
  },
  noGroupsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  closeIconWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  },
});

export default ChatInfo;