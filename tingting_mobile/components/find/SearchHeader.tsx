import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';
import Toast from 'react-native-toast-message';
import CreateGroupModal from '../../components/screens/MainScreen/Chat/chatInfoComponent/CreateGroupModal';
import { useSocket } from '../../contexts/SocketContext';
import { Api_Conversation } from '../../apis/api_conversation';
import PinVerificationModal from './PinVerificationModal';

const SearchHeader = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [userId, setUserId] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [selectedHiddenConversation, setSelectedHiddenConversation] = useState(null);
  const navigation = useNavigation();
  const { socket } = useSocket();
  const inputRef = useRef(null);

  // Debounced search function
  const debouncedSearch = debounce((keyword) => {
    handleSearchConversations(keyword);
  }, 300);

  // Lấy userId từ AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          console.error('Không tìm thấy userId trong AsyncStorage');
          Toast.show({
            type: 'error',
            text1: 'Không tìm thấy ID người dùng',
            text2: 'Vui lòng đăng nhập lại.',
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy userId:', error);
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Không thể lấy thông tin người dùng.',
        });
      }
    };
    fetchUserId();
  }, []);

  // Xử lý tìm kiếm cuộc trò chuyện
  const handleSearchConversations = async (keyword = searchValue) => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    console.log('UserId:', userId, 'Keyword:', normalizedKeyword);
    if (!normalizedKeyword) {
      console.log('Từ khóa rỗng');
      setSearchResults([]);
      Toast.show({
        type: 'info',
        text1: 'Vui lòng nhập tên hoặc số điện thoại để tìm kiếm.',
      });
      return;
    }
    if (!userId) {
      console.error('User ID không tồn tại');
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không tìm thấy ID người dùng.',
      });
      return;
    }
    try {
      const response = await Api_Conversation.searchConversationsByUserId(userId, normalizedKeyword);
      console.log('API response:', response);
      const result = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : []);
      console.log('Kết quả tìm kiếm:', result);
      setSearchResults(result);
      if (result.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'Không tìm thấy cuộc trò chuyện phù hợp.',
        });
      }
    } catch (error) {
      console.error('Lỗi API:', error.response?.data || error.message);
      setSearchResults([]);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Đã xảy ra lỗi khi tìm kiếm.',
      });
    }
  };

  // Xử lý khi chọn một cuộc trò chuyện
  const handleStartChat = async (conv) => {
    try {
      const participant = conv.participants.find(p => p.userId._id === userId);

      if (participant?.isHidden && participant?.pin) {
        setSelectedHiddenConversation(conv);
        setIsPinModalOpen(true);
        return;
      }

      proceedWithChat(conv);
    } catch (error) {
      console.error('Lỗi khi bắt đầu trò chuyện:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Đã xảy ra lỗi khi mở trò chuyện.',
      });
    }
  };

  // Xử lý điều hướng đến cuộc trò chuyện
// Xử lý điều hướng đến cuộc trò chuyện
const proceedWithChat = (conv) => {
  const conversationId = conv._id;
  const isGroup = conv.isGroup;
  const name = conv.displayName || "Unknown User";
  const avatar = isGroup
    ? conv.avatar || 'https://picsum.photos/200/300'
    : conv.participants.find((p) => p.userId._id !== userId)?.userId?.avatar ||
      'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  console.log('Navigating to MessageScreen with params:', {
    message: {
      id: conversationId,
      isGroup,
      participants: conv.participants,
      name,
      imageGroup: avatar,
      isHidden: conv.participants.find(p => p.userId._id === userId)?.isHidden || false,
    },
  });

navigation.navigate('MessageScreen', {
  message: {
    id: conversationId,
    isGroup,
    participants: conv.participants,
    name,
    imageGroup: avatar,
    isHidden: conv.participants.find(p => p.userId._id === userId)?.isHidden || false,
  },
});

  setSearchValue('');
  setSearchResults([]);
  setIsFocused(false);
};

  // Xử lý khi xác thực PIN thành công
  const handlePinVerified = () => {
    if (selectedHiddenConversation) {
      proceedWithChat(selectedHiddenConversation);
    }
    setIsPinModalOpen(false);
    setSelectedHiddenConversation(null);
  };

  // Xử lý khi nhấn "Tạo nhóm"
  const handleOpenCreateGroupModal = () => {
    setIsModalVisible(false);
    setIsCreateGroupModalOpen(true);
  };

  // Xử lý khi đóng CreateGroupModal
  const handleCloseCreateGroupModal = () => {
    setIsCreateGroupModalOpen(false);
  };

  // Xử lý khi nhóm được tạo thành công
  const handleGroupCreated = (data) => {
    console.log('Nhóm đã được tạo:', data);
  };

  // Render item cho danh sách kết quả tìm kiếm
  const renderSearchItem = ({ item }) => {
    const isGroup = item.isGroup;
    const isHidden = item.participants.find(p => p.userId._id === userId)?.isHidden;
    const displayName = item.displayName || (isGroup ? item.name : 'Unknown User');
    const avatarUrl = isGroup
      ? item.imageGroup || 'https://picsum.photos/200/300'
      : item.participants.find((p) => p.userId._id !== userId)?.userId?.avatar ||
        'https://cdn-icons-png.flaticon.com/512/149/149071.png';

    return (
      <TouchableOpacity
        style={styles.searchItem}
        onPress={() => handleStartChat(item)}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
        <View style={styles.searchItemText}>
          <Text style={styles.searchItemName}>
            {displayName}
            {isGroup && <Text style={styles.groupTag}> (Nhóm)</Text>}
            {isHidden && <Text style={styles.hiddenTag}> (Đã ẩn)</Text>}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#888" style={styles.icon} />
        <TextInput
          ref={inputRef}
          placeholder="Tìm kiếm tên hoặc số điện thoại"
          placeholderTextColor="#888"
          style={styles.input}
          value={searchValue}
          onChangeText={(text) => {
            setSearchValue(text);
            debouncedSearch(text);
          }}
          onFocus={() => setIsFocused(true)}
        />
      </View>

      <View style={styles.actions}>
        {/* <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('QRScannerScreen')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={styles.iconButton}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Kết quả tìm kiếm */}
      {isFocused && (
        <TouchableWithoutFeedback onPress={() => setIsFocused(false)}>
          <View style={styles.searchOverlay}>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchItem}
                keyExtractor={(item) => item._id}
                style={styles.searchResults}
              />
            ) : (
              <Text style={styles.sectionTitle}>
                {searchValue.trim()
                  ? 'Không tìm thấy cuộc trò chuyện phù hợp.'
                  : 'Vui lòng nhập tên hoặc số điện thoại để tìm kiếm.'}
              </Text>
            )}
          </View>
        </TouchableWithoutFeedback>
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

      {/* Modal xác thực PIN */}
      {isPinModalOpen && selectedHiddenConversation && userId && (
        <PinVerificationModal
          isOpen={isPinModalOpen}
          onClose={() => {
            setIsPinModalOpen(false);
            setSelectedHiddenConversation(null);
          }}
          conversationId={selectedHiddenConversation._id}
          userId={userId}
          socket={socket}
          onVerified={handlePinVerified}
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
    maxHeight: 300,
  },
  searchResults: {
    flexGrow: 0,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  searchItemText: {
    flex: 1,
  },
  searchItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  groupTag: {
    fontSize: 12,
    color: '#0196fc',
    marginLeft: 5,
  },
  hiddenTag: {
    fontSize: 12,
    color: '#ff4444',
    marginLeft: 5,
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