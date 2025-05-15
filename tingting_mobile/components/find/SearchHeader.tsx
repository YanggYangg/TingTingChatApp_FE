import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateGroupModal from '../../components/screens/MainScreen/Chat/chatInfoComponent/CreateGroupModal';
import { useSocket } from "../../contexts/SocketContext";

const SearchHeader = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const navigation = useNavigation<any>();

 
  const { socket, userId: currentUserId } = useSocket();

  // Lấy userId từ AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          console.error('Không tìm thấy userId trong AsyncStorage');
        }
      } catch (error) {
        console.error('Lỗi khi lấy userId:', error);
      }
    };
    fetchUserId();
  }, []);

  // Xử lý khi nhấn "Tạo nhóm"
  const handleOpenCreateGroupModal = () => {
    setIsModalVisible(false); // Đóng modal hiện tại
    setIsCreateGroupModalOpen(true); // Mở CreateGroupModal
  };

  // Xử lý khi đóng CreateGroupModal
  const handleCloseCreateGroupModal = () => {
    setIsCreateGroupModalOpen(false);
  };

  // Xử lý khi nhóm được tạo thành công
  const handleGroupCreated = (data: any) => {
    console.log('Nhóm đã được tạo:', data);
    // Có thể điều hướng hoặc thực hiện hành động khác, ví dụ:
    // navigation.navigate('GroupsScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#888" style={styles.icon} />
        <TextInput
          placeholder="Tìm kiếm"
          placeholderTextColor="#888"
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('QRScannerScreen')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={styles.iconButton}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Focus tìm kiếm */}
      {isFocused && (
        <View style={styles.searchOverlay}>
          <Text style={styles.sectionTitle}>Không có kết quả tìm kiếm !!!</Text>
        </View>
      )}

      {/* Modal button + */}
      {isModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddFriendScreen')}
              style={styles.modalItem}
            >
              <Ionicons name="person-add-outline" size={20} color="#000" />
              <Text style={styles.modalText}>Thêm bạn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenCreateGroupModal}
              style={styles.modalItem}
            >
              <Ionicons name="people-outline" size={20} color="#000" />
              <Text style={styles.modalText}>Tạo nhóm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={{ marginTop: 10 }}
            >
              <Text style={{ textAlign: 'center', color: '#0196fc' }}>
                Đóng
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Create Group Modal */}
      {userId && (
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={handleCloseCreateGroupModal}
          onGroupCreated={handleGroupCreated}
          userId={userId}
          socket={socket}
          currentConversationParticipants={[]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0196fc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    height: 70,
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 40,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  iconButton: {
    marginLeft: 8,
  },
  searchOverlay: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    zIndex: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#c0c0c0',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 70,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    padding: 10,
    zIndex: 999,
  },
  modalBox: {
    width: 220,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default SearchHeader;