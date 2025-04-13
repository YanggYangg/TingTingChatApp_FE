import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MemberListModal from './MemberListModal';
import CommonGroupsModal from './CommonGroupsModal';

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
  
}

const GroupMemberList: React.FC<Props> = ({ chatInfo }) => {
  const [isMemberModalOpen, setMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [commonGroups, setCommonGroups] = useState<any[]>([]);
  const mockCommonGroups = [
    { id: "group1", name: "Nhóm 1", image: "https://example.com/group1.jpg" },
    { id: "group2", name: "Nhóm 2", image: "https://example.com/group2.jpg" },
  ];
  useEffect(() => {
    const fetchCommonGroups = () => {
      if (!chatInfo?.isGroup && chatInfo?._id) {
        // Mô phỏng API
        setCommonGroups(mockCommonGroups);
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