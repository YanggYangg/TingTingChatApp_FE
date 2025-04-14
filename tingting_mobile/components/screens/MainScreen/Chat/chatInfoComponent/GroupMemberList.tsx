import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MemberListModal from './MemberListModal';
import CommonGroupsModal from './CommonGroupsModal';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';

interface Participant {
  userId: string;
  name: string;
  avatar: string;
  isHidden: boolean;
}

interface ChatInfoData {
  _id: string;
  isGroup: boolean;
  participants: Participant[];
}

interface Props {
  chatInfo: ChatInfoData;
  conversationId: string;
}

const GroupMemberList: React.FC<Props> = ({ chatInfo, conversationId }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [commonGroups, setCommonGroups] = useState<any[]>([]);

  // Lấy danh sách nhóm chung nếu không phải nhóm
  useEffect(() => {
    const fetchCommonGroups = async () => {
      if (!chatInfo?.isGroup && chatInfo?._id) {
        try {
          const res = await Api_chatInfo.getCommonGroups(chatInfo._id);
          setCommonGroups(res?.commonGroups || []);
          console.log('API Response nhóm:', res);
        } catch (err) {
          console.error('Lỗi khi lấy nhóm chung:', err);
          setCommonGroups([]);
        }
      }
    };

    fetchCommonGroups();
  }, [chatInfo]);

  if (!chatInfo) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin hội thoại</Text>

      {chatInfo.isGroup ? (
        <TouchableOpacity onPress={() => setMemberModalOpen(true)}>
          <Text style={styles.linkText}>{chatInfo.participants.length} thành viên</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setGroupModalOpen(true)}>
          <Text style={styles.linkText}>{commonGroups.length} nhóm chung</Text>
        </TouchableOpacity>
      )}

      <MemberListModal
        isOpen={isMemberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        chatInfo={chatInfo}
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
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  linkText: {
    fontSize: 14,
    color: '#1e90ff',
  },
});

export default GroupMemberList;