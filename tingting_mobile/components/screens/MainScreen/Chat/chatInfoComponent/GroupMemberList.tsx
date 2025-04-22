import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MemberListModal from './MemberListModal';
import CommonGroupsModal from './CommonGroupsModal';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';

interface Participant {
  userId: string;
  role?: 'admin' | 'member';
  isHidden?: boolean;
}

interface ChatInfoData {
  _id: string;
  isGroup: boolean;
  participants: Participant[];
}

interface Props {
  chatInfo: ChatInfoData;
  conversationId: string;
  userId: string;
  onMemberRemoved?: (memberId: string) => void;
}

const GroupMemberList: React.FC<Props> = ({ chatInfo, conversationId, userId, onMemberRemoved }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [commonGroups, setCommonGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchCommonGroups = async () => {
      if (!chatInfo?.isGroup && chatInfo?._id) {
        try {
          const res = await Api_chatInfo.getCommonGroups(chatInfo._id);
          console.log('Common groups API response:', res);
          setCommonGroups(res?.commonGroups || []);
        } catch (err) {
          console.error('Lỗi khi lấy nhóm chung:', err);
          setCommonGroups([]);
        }
      } else {
        setCommonGroups([]);
      }
    };

    fetchCommonGroups();
  }, [chatInfo]);

  if (!chatInfo || !chatInfo.participants) {
    return null;
  }

  const visibleParticipants = chatInfo.participants.filter((p) => !p.isHidden);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {chatInfo.isGroup ? 'Thành viên' : 'Thông tin hội thoại'}
      </Text>

      {chatInfo.isGroup ? (
        <TouchableOpacity style={styles.memberRow} onPress={() => setMemberModalOpen(true)}>
          <Text style={styles.linkText}>{visibleParticipants.length} thành viên</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.memberRow} onPress={() => setGroupModalOpen(true)}>
          <Text style={styles.linkText}>{commonGroups.length} nhóm chung</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      )}

      <MemberListModal
        isOpen={isMemberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        chatInfo={chatInfo}
        currentUserId={userId}
        onMemberRemoved={onMemberRemoved}
      />

      <CommonGroupsModal
        isOpen={isGroupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        commonGroups={commonGroups}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 5,
    padding: 10,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#1e90ff',
  },
});

export default GroupMemberList;