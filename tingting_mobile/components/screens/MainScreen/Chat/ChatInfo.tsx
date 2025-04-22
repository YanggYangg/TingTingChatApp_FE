// ChatInfo.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import GroupMemberList from './chatInfoComponent/GroupMemberList';
import GroupMediaGallery from './chatInfoComponent/GroupMediaGallery';
import GroupFile from './chatInfoComponent/GroupFile';
import GroupLinks from './chatInfoComponent/GroupLinks';
import SecuritySettings from './chatInfoComponent/SecuritySettings';
import MuteNotificationModal from './chatInfoComponent/MuteNotificationModal';
import AddMemberModal from './chatInfoComponent/AddMemberModal';
import EditNameModal from './chatInfoComponent/EditNameModal';
import CreateGroupModal from './chatInfoComponent/CreateGroupModal';
import GroupActionButton from './chatInfoComponent/GroupActionButton';
import { Api_chatInfo } from '../../../../apis/Api_chatInfo';
import { Api_Profile } from '../../../../apis/api_profile';
import { useNavigation } from '@react-navigation/native';

interface Participant {
  userId: string;
  role?: 'admin' | 'member';
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
  userId?: string;
  conversationId?: string;
}

const Icon = FontAwesome;

const ChatInfo: React.FC<ChatInfoProps> = ({
  userId = "6806780f2d6b2f2b0c3f3ca1",
  conversationId = "68073f696cdca1faf3d02368",
}) => {
  const [chatInfo, setChatInfo] = useState<ChatInfoData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [userRoleInGroup, setUserRoleInGroup] = useState<string | null>(null);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await Api_chatInfo.getChatInfo(conversationId);
        console.log('Chat info API response:', response);

        if (!response || !response._id) {
          throw new Error('Dữ liệu trả về không hợp lệ.');
        }

        setChatInfo(response);

        const participant = response.participants.find((p: Participant) => p.userId === userId);
        if (participant) {
          setIsMuted(!!participant.mute);
          setUserRoleInGroup(participant.role);
        } else {
          setIsMuted(false);
          setUserRoleInGroup(null);
        }

        if (!response.isGroup) {
          const otherParticipant = response.participants.find((p: Participant) => p.userId !== userId);
          if (otherParticipant?.userId) {
            try {
              const userResponse = await Api_Profile.getProfile(otherParticipant.userId);
              setOtherUser(userResponse?.data?.user as UserProfile);
            } catch (userError) {
              console.error('Lỗi khi lấy thông tin người dùng khác:', userError);
              setOtherUser({ _id: '', firstname: 'Không tìm thấy', surname: '', avatar: null });
            }
          }
        } else {
          setOtherUser(null);
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin chat:', error);
        setError('Không thể tải thông tin chat.');
        Alert.alert('Lỗi', 'Không thể tải thông tin chat. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchChatInfo();
    }
  }, [conversationId, userId]);

  const handleMemberAdded = async () => {
    try {
      const updatedChatInfo = await Api_chatInfo.getChatInfo(conversationId);
      setChatInfo(updatedChatInfo);
      const participant = updatedChatInfo.participants.find((p) => p.userId === userId);
      if (participant) {
        setUserRoleInGroup(participant.role);
      }
      Alert.alert('Thành công', 'Đã thêm thành viên vào nhóm!');
    } catch (error) {
      console.error('Lỗi khi cập nhật chatInfo sau khi thêm thành viên:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật danh sách thành viên. Vui lòng thử lại.');
    }
  };

  const handleMemberRemoved = (memberId: string) => {
    if (!chatInfo) return;
    setChatInfo({
      ...chatInfo,
      participants: chatInfo.participants.filter((p) => p.userId !== memberId),
    });
  };

  const handleCreateGroupSuccess = (newGroup: any) => {
    Alert.alert('Thành công', 'Tạo nhóm thành công!');
    setIsCreateGroupModalOpen(false);
    navigation.navigate('ChatScreen', { conversationId: newGroup._id });
  };

  const handleMuteNotification = async () => {
    if (isMuted) {
      try {
        await Api_chatInfo.updateNotification(conversationId, { userId, mute: null });
        setIsMuted(false);
        Alert.alert('Thông báo', 'Đã bật thông báo!');
      } catch (error) {
        console.error('Lỗi khi bật thông báo:', error);
        Alert.alert('Lỗi', 'Không thể bật thông báo. Vui lòng thử lại.');
      }
    } else {
      setIsMuteModalOpen(true);
    }
  };

  const handleMuteSuccess = (muted: boolean) => {
    setIsMuted(muted);
    Alert.alert('Thông báo', muted ? 'Đã tắt thông báo!' : 'Đã bật thông báo!');
  };

  const handlePinChat = async () => {
    if (!chatInfo) return;

    try {
      const newIsPinned = !chatInfo.isPinned;
      await Api_chatInfo.pinChat(conversationId, { isPinned: newIsPinned, userId });
      setChatInfo({ ...chatInfo, isPinned: newIsPinned });
      Alert.alert('Thông báo', newIsPinned ? 'Đã ghim cuộc trò chuyện!' : 'Đã bỏ ghim cuộc trò chuyện!');
    } catch (error) {
      console.error('Lỗi khi ghim/bỏ ghim cuộc trò chuyện:', error);
      Alert.alert('Lỗi', 'Không thể ghim/bỏ ghim cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  const handleAddMember = () => {
    if (!chatInfo) {
      Alert.alert('Lỗi', 'Thông tin cuộc trò chuyện chưa được tải. Vui lòng thử lại.');
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

    try {
      await Api_chatInfo.updateChatName(conversationId, newName.trim());
      setChatInfo({ ...chatInfo, name: newName.trim() });
      Alert.alert('Thông báo', 'Cập nhật tên thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật tên:', error);
      Alert.alert('Lỗi', 'Cập nhật tên thất bại!');
    } finally {
      handleCloseEditNameModal();
    }
  };

  const handleSearchMessage = () => {
    navigation.navigate('MessageScreen', { conversationId });
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
        <Text style={styles.textRed}>{error || 'Không thể tải thông tin chat.'}</Text>
        <TouchableOpacity
          onPress={() => {
            setLoading(true);
            setError(null);
            // Re-trigger the useEffect to fetch chat info
          }}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentConversationParticipants = chatInfo.participants
    .filter((p) => p.userId !== userId)
    .map((p) => p.userId);

  const chatDisplayName = chatInfo.isGroup
    ? chatInfo.name
    : `${otherUser?.firstname || ''} ${otherUser?.surname || ''}`.trim() || 'Đang tải...';
  const chatDisplayImage = chatInfo.isGroup
    ? chatInfo.imageGroup?.trim() || 'https://via.placeholder.com/150'
    : otherUser?.avatar || 'https://via.placeholder.com/150';

  console.log('ChatInfo render - chatInfo:', chatInfo); // LOGGING

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {chatInfo.isGroup ? 'Thông tin nhóm' : 'Thông tin hội thoại'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.groupInfo}>
          <Image
            source={{ uri: chatDisplayImage }}
            style={styles.groupImage}
            onError={() => console.log('Lỗi tải ảnh nhóm/avatar')}
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
                <Icon name="edit" size={16} color="#666" style={styles.editIcon} />
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
            icon={isMuted ? 'mute' : 'unmute'}
            text={isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
            onClick={handleMuteNotification}
            isActive={isMuted}
          />
          <GroupActionButton
            icon={chatInfo.isPinned ? 'pin' : 'unpin'}
            text={chatInfo.isPinned ? 'Bỏ ghim trò chuyện' : 'Ghim cuộc trò chuyện'}
            onClick={handlePinChat}
            isActive={chatInfo.isPinned}
          />
          <GroupActionButton
            icon="add"
            text={chatInfo.isGroup ? 'Thêm thành viên' : 'Tạo nhóm trò chuyện'}
            onClick={handleAddMember}
            isActive={false}
          />
        </View>

        <GroupMemberList
          chatInfo={chatInfo}
          userId={userId}
          conversationId={conversationId}
          onMemberRemoved={handleMemberRemoved}
        />

        {chatInfo.linkGroup && (
          <View style={styles.linkContainer}>
            <Text style={styles.linkTitle}>Link tham gia nhóm</Text>
            <Text style={styles.linkText}>{chatInfo.linkGroup}</Text>
            <TouchableOpacity onPress={() => Alert.alert('Sao chép', 'Đã sao chép link nhóm!')}>
              <Icon name="copy" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <GroupMediaGallery conversationId={conversationId} userId={userId} />
        <GroupFile conversationId={conversationId} userId={userId} />
        <GroupLinks conversationId={conversationId} userId={userId} />
        <SecuritySettings
          conversationId={conversationId}
          userId={userId}
          setChatInfo={setChatInfo}
          userRoleInGroup={userRoleInGroup}
          chatInfo={chatInfo}
        />
      </ScrollView>

      <MuteNotificationModal
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        conversationId={conversationId}
        userId={userId}
        onMuteSuccess={handleMuteSuccess}
      />
      <AddMemberModal
        isOpen={isAddModalOpen}
        conversationId={conversationId}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={handleMemberAdded}
        userId={userId}
        currentMembers={currentConversationParticipants}
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
        userId={userId}
        onGroupCreated={handleCreateGroupSuccess}
        currentConversationParticipants={currentConversationParticipants}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  header: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  groupInfo: {
    alignItems: 'center',
    marginVertical: 15,
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  groupNameContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  editIcon: {
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 5,
    elevation: 2,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 14,
    color: '#1e90ff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textGray: {
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  textRed: {
    color: '#ff0000',
  },
  retryText: {
    color: '#1e90ff',
    marginTop: 10,
    fontSize: 16,
  },
});

export default ChatInfo;