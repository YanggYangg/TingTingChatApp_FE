import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Api_Conversation } from '../../../../apis/api_conversation';
import { setSelectedMessage } from '../../../../redux/slices/chatSlice';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateGroupModal from '../Chat/chatInfoComponent/CreateGroupModal';
import { useSocket } from "../../../../contexts/SocketContext";

export default function GroupsScreen() {
  const { socket, userId: currentUserId } = useSocket();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // State để kiểm soát modal
  const [userId, setUserId] = useState<string | null>(null); // State để lưu userId

  // Giả định socket được truyền từ context hoặc parent component
  // Nếu không, bạn cần cung cấp socket từ một nguồn khác
 

  // Lấy userId từ AsyncStorage và fetch groups
  const fetchGroups = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        console.error('Không tìm thấy userId trong AsyncStorage');
        return;
      }
      setUserId(storedUserId);
      const res = await Api_Conversation.getUserJoinGroup(storedUserId);
      console.log('Danh sách nhóm:', res);
      setGroups(res);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhóm:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Xử lý khi nhóm được tạo thành công
  const handleGroupCreated = (data: any) => {
    console.log('Nhóm đã được tạo:', data);
    fetchGroups(); // Làm mới danh sách nhóm
  };

  // Xử lý khi nhấn vào nút "Tạo nhóm"
  const handleOpenCreateGroupModal = () => {
    setIsModalOpen(true);
  };

  // Xử lý khi đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Xử lý khi bắt đầu trò chuyện nhóm
  const handleStartChat = async (group: any) => {
    try {
      const conversationId = group._id; // dùng luôn ID của group làm conversationId
      console.log('== Navigating to group conversation ==', conversationId);

      dispatch(
        setSelectedMessage({
          id: conversationId,
          isGroup: true,
          participants: group.participants,
          name: group.name,
          imageGroup: group.imageGroup || '',
        })
      );

      navigation.navigate('MessageScreen', {
        conversationId: conversationId,
        isGroup: true,
        participants: group.participants,
        name: group.name,
        imageGroup: group.imageGroup || '',
      });
    } catch (error) {
      console.error('Lỗi khi bắt đầu trò chuyện nhóm:', error);
    }
  };

  const renderGroupItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleStartChat(item)}
      style={styles.groupItem}
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
        style={styles.groupAvatar}
      />

      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupLastMessage} numberOfLines={1}>
          {item.participants.length} thành viên
        </Text>
      </View>

      <Text style={styles.groupTime}>{item.time || ''}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhóm</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={styles.topTab}
          onPress={() => navigation.navigate('FriendsMain')}
        >
          <Text style={styles.topTabText}>Bạn bè</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, styles.activeTopTab]}>
          <Text style={styles.activeTopTabText}>Nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topTab}
          onPress={() => navigation.navigate('OATab')}
        >
          <Text style={styles.topTabText}>OA</Text>
        </TouchableOpacity>
      </View>

      {/* Create Group */}
      <TouchableOpacity
        style={styles.createGroupOption}
        onPress={handleOpenCreateGroupModal}
      >
        <View style={styles.createGroupIcon}>
          <Ionicons name="people" size={24} color="#0091ff" />
          <View style={styles.addIcon}>
            <Ionicons name="add" size={14} color="#fff" />
          </View>
        </View>
        <Text style={styles.createGroupText}>Tạo nhóm</Text>
      </TouchableOpacity>

      {/* Groups List */}
      <View style={styles.groupsHeader}>
        <Text style={styles.groupsHeaderText}>
          Nhóm đang tham gia ({groups.length})
        </Text>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item._id}
        style={styles.groupsList}
      />

      {/* Create Group Modal */}
      {userId && (
        <CreateGroupModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onGroupCreated={handleGroupCreated}
          userId={userId}
          socket={socket} // Thay bằng socket thực tế nếu có
          currentConversationParticipants={[]} // Có thể truyền nếu cần
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  topTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTopTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0091ff',
  },
  topTabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTopTabText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  createGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  createGroupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e6f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  addIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0091ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0091ff',
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 16,
  },
  groupsHeaderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  groupsList: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
  },
  groupLastMessage: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  groupTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
});