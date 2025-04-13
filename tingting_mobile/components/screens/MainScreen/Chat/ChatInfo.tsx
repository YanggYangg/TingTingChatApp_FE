import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import GroupMemberList from './chatInfoComponent/GroupMemberList';
import GroupMediaGallery from './chatInfoComponent/GroupMediaGallery';
import GroupFile from './chatInfoComponent/GroupFile';
import GroupLinks from './chatInfoComponent/GroupLinks';
import SecuritySettings from './chatInfoComponent/SecuritySettings';
import MuteNotificationModal from './chatInfoComponent/MuteNotificationModal';
import AddMemberModal from './chatInfoComponent/AddMemberModal';
import EditNameModal from './chatInfoComponent/EditNameModal';
import GroupActionButton from './chatInfoComponent/GroupActionButton';

interface Participant {
  userId: string;
  name: string;
  avatar: string;
  mute: string | null;
  isPinned: boolean;
}

interface ChatInfoData {
  isGroup: boolean;
  name: string;
  imageGroup: string;
  linkGroup: string;
  isPinned: boolean;
  participants: Participant[];
}

const Icon = FontAwesome;

const ChatInfo: React.FC = () => {
  const [chatInfo, setChatInfo] = useState<ChatInfoData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);

  const conversationId = "67e2d6bef1ea6ac96f10bf91";
  const userId = "6601a1b2c3d4e5f678901238";

  const mockChatInfo = {
    isGroup: true,
    name: "Nhóm bạn thân",
    imageGroup: "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/12/anh-dai-dien-zalo-thumbnail.jpg",
    linkGroup: "https://zalo.me/g/bamwwg826",
    isPinned: false,
    participants: [
      {
        userId: "6601a1b2c3d4e5f678901238",
        name: "Nguyễn Văn A",
        avatar: "https://example.com/avatar1.jpg",
        mute: null,
        isPinned: false,
      },
      {
        userId: "6601a1b2c3d4e5f678901239",
        name: "Trần Thị B",
        avatar: "https://example.com/avatar2.jpg",
        mute: "2025-04-14T10:00:00Z",
        isPinned: true,
      },
    ],
  };

  useEffect(() => {
    const fetchChatInfo = () => {
      setLoading(true);
      const response = mockChatInfo;
      setChatInfo(response);

      const participant = response.participants.find((p) => p.userId === userId);
      if (participant) {
        setIsMuted(!!participant.mute);
        setChatInfo((prev) => prev && { ...prev, isPinned: participant.isPinned });
      } else {
        setIsMuted(false);
      }

      setLoading(false);
    };

    if (conversationId) {
      fetchChatInfo();
    }
  }, [conversationId, userId]);

  const handleMemberAdded = () => {
    Alert.alert("Thông báo", "Thêm thành viên thành công!");
  };

  const handleMuteNotification = () => {
    if (isMuted) {
      setIsMuted(false);
      Alert.alert("Thông báo", "Đã bật thông báo!");
    } else {
      setIsMuteModalOpen(true);
    }
  };

  const handleMuteSuccess = (muted: boolean) => {
    setIsMuted(muted);
  };

  const handlePinChat = () => {
    if (!chatInfo) return;

    const newIsPinned = !chatInfo.isPinned;
    setChatInfo({ ...chatInfo, isPinned: newIsPinned });
    Alert.alert("Thông báo", newIsPinned ? "Đã ghim cuộc trò chuyện!" : "Đã bỏ ghim cuộc trò chuyện!");
  };

  const copyToClipboard = () => {
    Alert.alert("Thông báo", "Đã sao chép link nhóm!");
  };

  const handleAddMember = () => {
    setIsAddModalOpen(true);
  };

  const handleOpenEditNameModal = () => setIsEditNameModalOpen(true);
  const handleCloseEditNameModal = () => setIsEditNameModalOpen(false);

  const handleSaveChatName = (newName: string) => {
    if (!chatInfo || !newName.trim()) return;

    setChatInfo({ ...chatInfo, name: newName.trim() });
    Alert.alert("Thông báo", "Cập nhật tên thành công!");
    handleCloseEditNameModal();
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="arrow-left" size={24} color="#000" onPress={() => {}} />
        <Text style={styles.headerTitle}>
          {chatInfo?.isGroup ? "Thông tin nhóm" : "Thông tin hội thoại"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.groupInfo}>
          <Image
            source={{
              uri: chatInfo?.imageGroup?.trim()
                ? chatInfo.imageGroup
                : "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2023/12/anh-dai-dien-zalo-thumbnail.jpg",
            }}
            style={styles.groupImage}
          />
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{chatInfo?.name || "Không có tên"}</Text>
            <TouchableOpacity onPress={handleOpenEditNameModal}>
              <Icon name="edit" size={16} color="#666" style={styles.editIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <GroupActionButton
            icon={isMuted ? 'mute' : 'unmute'}
            text={isMuted ? "Bật thông báo" : "Tắt thông báo"}
            onClick={handleMuteNotification}
            isActive={isMuted} // Blue when muted
          />
          <GroupActionButton
            icon={chatInfo?.isPinned ? 'pin' : 'unpin'}
            text={chatInfo?.isPinned ? "Bỏ ghim trò chuyện" : "Ghim cuộc trò chuyện"}
            onClick={handlePinChat}
            isActive={chatInfo?.isPinned} // Blue when unpinned
          />
          <GroupActionButton
            icon="add"
            text={chatInfo?.isGroup ? "Thêm thành viên" : "Tạo nhóm trò chuyện"}
            onClick={handleAddMember}
            isActive={false} // No blue background for this button
          />
        </View>

        <GroupMemberList chatInfo={chatInfo} conversationId={conversationId} />

        {chatInfo?.linkGroup && (
          <View style={styles.linkContainer}>
            <Text style={styles.linkTitle}>Link tham gia nhóm</Text>
            <Text style={styles.linkText}>{chatInfo.linkGroup}</Text>
            <TouchableOpacity onPress={copyToClipboard}>
              <Icon name="copy" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <GroupMediaGallery conversationId={conversationId} />
        <GroupFile conversationId={conversationId} />
        <GroupLinks conversationId={conversationId} />
        <SecuritySettings
          conversationId={conversationId}
          userId={userId}
          setChatInfo={setChatInfo}
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
      />
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={handleCloseEditNameModal}
        onSave={handleSaveChatName}
        initialName={chatInfo?.name}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
  },
  editIcon: {
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginVertical: 15,
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
  },
  textRed: {
    color: '#ff0000',
  },
});

export default ChatInfo;