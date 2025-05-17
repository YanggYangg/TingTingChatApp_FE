import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import NetInfo from '@react-native-community/netinfo';
import { Api_FriendRequest } from '../../../../../apis/api_friendRequest';
import {
  addParticipant,
  onError,
  offError,
  onAddParticipantResponse,
  offAddParticipantResponse,
} from '../../../../../services/sockets/events/chatInfo';

interface Member {
  _id: string;
  name: string;
  avatar: string | null;
  phone?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  userId?: string;
  currentMembers?: string[];
  onMemberAdded: () => void;
  socket: any; // Socket.IO client instance
}

const AddMemberModal: React.FC<Props> = ({
  isOpen,
  onClose,
  conversationId,
  userId,
  currentMembers = [],
  onMemberAdded,
  socket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [friendsList, setFriendsList] = useState<Member[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorFriends, setErrorFriends] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!isOpen || !userId || !conversationId) {
        if (!userId) setErrorFriends('Thiếu thông tin người dùng.');
        if (!conversationId) setErrorFriends('Thiếu thông tin cuộc trò chuyện.');
        return;
      }

      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        setErrorFriends('Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn.');
        return;
      }

      setLoadingFriends(true);
      setErrorFriends('');
      try {
        const response = await Api_FriendRequest.getFriendsList(userId);
        let friends: Member[] = [];
        if (Array.isArray(response.data)) {
          friends = response.data;
        } else if (response.data?.friends && Array.isArray(response.data.friends)) {
          friends = response.data.friends;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          friends = response.data.data;
        } else {
          setErrorFriends('Dữ liệu bạn bè không đúng định dạng. Vui lòng thử lại.');
          return;
        }

        const filteredFriends = friends.filter(
          (friend: Member) =>
            !currentMembers.includes(friend._id || friend.id || friend.userID)
        );
        setFriendsList(filteredFriends);
      } catch (error) {
        setErrorFriends(
          error.message.includes('timeout')
            ? 'Yêu cầu hết thời gian. Máy chủ mất quá nhiều thời gian để phản hồi.'
            : error.message || 'Không thể tải danh sách bạn bè. Vui lòng thử lại.'
        );
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, [isOpen, userId, conversationId, currentMembers]);

  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleError = (error: { message?: string }) => {
      setError(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    };

    const handleAddParticipantResponse = (response: { success: boolean; message?: string }) => {
      if (response.success) {
        setSuccessMessage('Thêm thành viên thành công!');
        onMemberAdded();
        onClose();
      } else {
        setError(response.message || 'Không thể thêm thành viên.');
      }
    };

    onError(socket, handleError);
    onAddParticipantResponse(socket, handleAddParticipantResponse);

    return () => {
      offError(socket);
      offAddParticipantResponse(socket);
    };
  }, [socket, isOpen, onMemberAdded, onClose]);

  const retryFetchFriends = () => {
    setErrorFriends('');
    setLoadingFriends(true);
    const fetchFriends = async () => {
      try {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
          setErrorFriends('Không có kết nối mạng. Vui lòng kiểm tra kết nối của bạn.');
          return;
        }
        const response = await Api_FriendRequest.getFriendsList(userId!);
        let friends: Member[] = [];
        if (Array.isArray(response.data)) {
          friends = response.data;
        } else if (response.data?.friends && Array.isArray(response.data.friends)) {
          friends = response.data.friends;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          friends = response.data.data;
        } else {
          setErrorFriends('Dữ liệu bạn bè không đúng định dạng. Vui lòng thử lại.');
          return;
        }

        const filteredFriends = friends.filter(
          (friend: Member) =>
            !currentMembers.includes(friend._id || friend.id || friend.userID)
        );
        setFriendsList(filteredFriends);
      } catch (error) {
        setErrorFriends(
          error.message.includes('timeout')
            ? 'Yêu cầu hết thời gian. Máy chủ mất quá nhiều thời gian để phản hồi.'
            : error.message || 'Không thể tải danh sách bạn bè. Vui lòng thử lại.'
        );
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  };

  const filteredFriends = friendsList
    .filter((friend) => friend.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const addMember = async (memberId: string) => {
    if (!conversationId || !memberId || !socket) {
      setError('Thiếu thông tin để thêm thành viên hoặc không có kết nối Socket.IO.');
      return;
    }
    if (!socket.connected) {
      setError('Socket chưa kết nối. Vui lòng thử lại.');
      return;
    }

    setAddingMember(true);
    setError('');
    setSuccessMessage('');
    const participantData = { conversationId, userId: memberId, role: 'member', performerId: userId };
    addParticipant(socket, participantData);
    setAddingMember(false);
  };

  const renderFriend = ({ item }: { item: Member }) => (
    <View style={styles.memberItem}>
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/30/007bff/FFFFFF?Text=User' }}
        style={styles.avatar}
      />
      <Text style={styles.memberName}>{item.name}</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addMember(item._id)}
        disabled={addingMember}
      >
        {addingMember ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.addButtonText}>Thêm</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose} style={styles.modal}>
      <View style={styles.container}>
        <Text style={styles.title}>Thêm thành viên</Text>

        <TextInput
          placeholder="Nhập tên bạn bè..."
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
        {errorFriends ? (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{errorFriends}</Text>
            <TouchableOpacity onPress={retryFetchFriends} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loadingFriends ? (
          <ActivityIndicator size="large" color="#1e90ff" style={styles.loader} />
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item._id}
            renderItem={renderFriend}
            ListEmptyComponent={
              <Text style={styles.noResult}>Không tìm thấy bạn bè nào để thêm</Text>
            }
            style={styles.list}
          />
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  memberName: {
    flex: 1,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  cancelButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ff0000',
    fontSize: 16,
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorContainer: {
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: '#1e90ff',
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  noResult: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  list: {
    maxHeight: 300,
  },
  loader: {
    marginVertical: 20,
  },
});

export default AddMemberModal;