import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MemberListModal from './MemberListModal';
import CommonGroupsModal from './CommonGroupsModal';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo'; // Adjust path as needed

interface Participant {
  userId: string;
  role?: 'admin' | 'member';
}

interface ChatInfoData {
  _id: string;
  isGroup: boolean;
  participants: Participant[];
}

interface CommonGroup {
  _id: string;
  name: string;
  imageGroup?: string;
}

interface Props {
  chatInfo: ChatInfoData;
  userId: string;
  onMemberRemoved?: (memberId: string) => void;
  socket: any;
  onGroupSelect?: (group: CommonGroup) => void;
}

const GroupMemberList: React.FC<Props> = ({ chatInfo, userId, onMemberRemoved, socket, onGroupSelect }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [commonGroups, setCommonGroups] = useState<CommonGroup[]>([]);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  // Fetch common groups and other user ID for non-group chats
  useEffect(() => {
    const fetchCommonGroups = async () => {
      if (!chatInfo?.isGroup && chatInfo?._id) {
        // Set other user ID (assuming 1:1 chat has exactly 2 participants)
        const otherParticipant = chatInfo.participants.find(p => p.userId !== userId);
        if (otherParticipant) {
          setOtherUserId(otherParticipant.userId);
        } else {
          setOtherUserId(null);
          setCommonGroups([]);
          return;
        }

        try {
          const res = await Api_chatInfo.getCommonGroups(chatInfo._id);
          setCommonGroups(res?.commonGroups || []);
        } catch (err) {
          console.error('Error fetching common groups:', err);
          setCommonGroups([]);
        }
      } else {
        setOtherUserId(null);
        setCommonGroups([]);
      }
    };

    fetchCommonGroups();
  }, [chatInfo, userId]);

  const handleOpenGroupModal = () => {
    if (!commonGroups.length) {
      Alert.alert('Thông báo', 'Không có nhóm chung nào!');
      return;
    }
    if (!otherUserId) {
      Alert.alert('Lỗi', 'Không thể xác định người dùng khác trong cuộc trò chuyện.');
      return;
    }
    setGroupModalOpen(true);
  };

  if (!chatInfo || !chatInfo.participants) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Ionicons name="information-circle-outline" size={20} color="#000" style={styles.titleIcon} />
        <Text style={styles.title}>Thông tin hội thoại</Text>
      </View>
      {chatInfo.isGroup ? (
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={() => setMemberModalOpen(true)}
        >
          <Ionicons name="people-outline" size={20} color="#1e90ff" style={styles.icon} />
          <Text style={styles.linkText}>{chatInfo.participants.length} thành viên</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.linkContainer}
          onPress={handleOpenGroupModal}
        >
          <Ionicons name="chatbubbles-outline" size={20} color="#1e90ff" style={styles.icon} />
          <Text style={styles.linkText}>{commonGroups.length} nhóm chung</Text>
        </TouchableOpacity>
      )}
      <MemberListModal
        isOpen={isMemberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        chatInfo={chatInfo}
        currentUserId={userId}
        onMemberRemoved={onMemberRemoved}
        socket={socket}
      />
      {otherUserId && (
        <CommonGroupsModal
          isOpen={isGroupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          commonGroups={commonGroups}
          userId={userId}
          otherUserId={otherUserId}
          socket={socket}
          onGroupSelect={onGroupSelect}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    color: '#1e90ff',
    fontSize: 14,
  },
  icon: {
    marginRight: 8,
  },
});

export default GroupMemberList;
