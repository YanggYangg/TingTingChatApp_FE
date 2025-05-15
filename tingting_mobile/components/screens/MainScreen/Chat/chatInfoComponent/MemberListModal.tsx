import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Api_Profile } from '../../../../../apis/api_profile';
import { Api_Conversation } from '../../../../../apis/api_conversation';
import { useDispatch } from 'react-redux';
import { setSelectedMessage } from '../../../../../redux/slices/chatSlice';
import { useNavigation } from '@react-navigation/native';
import { removeParticipant, onError } from '../../../../../services/sockets/events/chatInfo';

interface Participant {
  userId: string;
  role?: 'admin' | 'member';
}

interface ChatInfoData {
  _id: string;
  isGroup: boolean;
  participants: Participant[];
}

interface MemberDetails {
  [userId: string]: {
    name: string;
    avatar: string;
    role?: 'admin' | 'member';
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatInfo: ChatInfoData;
  currentUserId: string;
  onMemberRemoved?: (memberId: string) => void;
  socket: any;
}

const MemberListModal: React.FC<Props> = ({
  isOpen,
  onClose,
  chatInfo,
  currentUserId,
  onMemberRemoved,
  socket,
}) => {
  const [memberDetails, setMemberDetails] = useState<MemberDetails>({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = () => {
      if (chatInfo?.participants && currentUserId) {
        const adminMember = chatInfo.participants.find(
          (member) => member.userId === currentUserId && member.role === 'admin'
        );
        setIsAdmin(!!adminMember);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [chatInfo, currentUserId]);

  // Fetch member details
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!chatInfo?.participants) {
        setErrorDetails('Không có thông tin thành viên');
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      setErrorDetails(null);
      const details: MemberDetails = {};

      try {
        const fetchPromises = chatInfo.participants.map(async (member) => {
          try {
            const response = await Api_Profile.getProfile(member.userId);
            if (response?.data?.user) {
              details[member.userId] = {
                name: `${response.data.user.firstname || ''} ${response.data.user.surname || ''}`.trim() || 'Không tên',
                avatar: response.data.user.avatar || 'https://via.placeholder.com/150',
                role: member.role,
              };
            } else {
              details[member.userId] = {
                name: 'Không tìm thấy',
                avatar: 'https://via.placeholder.com/150',
                role: member.role,
              };
            }
          } catch (error) {
            console.error(`Error fetching user ${member.userId}:`, error);
            details[member.userId] = {
              name: 'Lỗi tải',
              avatar: 'https://via.placeholder.com/150',
              role: member.role,
            };
          }
        });

        await Promise.all(fetchPromises);
        setMemberDetails(details);
      } catch (error) {
        setErrorDetails('Lỗi khi tải thông tin thành viên');
        console.error('Error fetching member details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };

    if (isOpen && chatInfo) {
      fetchMemberDetails();
    } else {
      setMemberDetails({});
      setLoadingDetails(false);
    }
  }, [isOpen, chatInfo]);

  const openConfirmModal = (userId: string) => {
    setMemberToRemove(userId);
    setShowConfirmModal(true);
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;

    if (!socket) {
      Alert.alert('Lỗi', 'Socket chưa kết nối, không thể xóa thành viên!');
      return;
    }

    if (!isAdmin) {
      Alert.alert('Lỗi', 'Bạn không có quyền xóa thành viên khỏi nhóm này.');
      return;
    }

    if (currentUserId === memberToRemove) {
      Alert.alert(
        'Lỗi',
        'Bạn không thể tự xóa mình khỏi đây. Hãy rời nhóm từ trang thông tin nhóm.'
      );
      return;
    }

    try {
      removeParticipant(socket, { conversationId: chatInfo._id, userId: memberToRemove }, (response: any) => {
        if (response.success) {
          console.log('Member removed from group!');
          if (onMemberRemoved) {
            onMemberRemoved(memberToRemove);
          }
        } else {
          console.error('Error removing member:', response.message);
          Alert.alert('Lỗi', response.message || 'Không thể xóa thành viên.');
        }
      });

      onError(socket, (error: any) => {
        console.error('Server error when removing member:', error);
        Alert.alert('Lỗi', 'Lỗi từ server khi xóa thành viên.');
      });
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Lỗi', 'Lỗi khi xóa thành viên.');
    } finally {
      setShowConfirmModal(false);
      setMemberToRemove(null);
    }
  };

  const cancelRemove = () => {
    setShowConfirmModal(false);
    setMemberToRemove(null);
  };

const handleMemberClick = async (memberId: string) => {
  if (memberId === currentUserId) {
    Alert.alert('Thông báo', 'Bạn không thể trò chuyện với chính mình!');
    return;
  }

  try {
    const res = await Api_Conversation.getOrCreateConversation(currentUserId, memberId);

    if (res?.conversationId) {
      // Dispatch redux
      dispatch(setSelectedMessage({
        id: res.conversationId,
        isGroup: false,
        participants: [
          { userId: currentUserId },
          { userId: memberId },
        ],
      }));

      // Điều hướng tới màn hình nhắn tin
      navigation.navigate('MessageScreen', {
        conversationId: res.conversationId,
        isGroup: false,
        participants: [
          { userId: currentUserId },
          { userId: memberId },
        ],
      });

      // Join socket room
      setTimeout(() => {
        socket?.emit('joinConversation', { conversationId: res.conversationId });
      }, 1000);

      onClose();
    } else {
      Alert.alert('Lỗi', res?.message || 'Không thể lấy hoặc tạo hội thoại.');
    }
  } catch (error) {
    Alert.alert('Lỗi', 'Lỗi khi bắt đầu trò chuyện.');
  }
};



  useEffect(() => {
    return () => {
      socket?.off('error');
    };
  }, [socket]);

  if (!chatInfo?.participants) return null;

  return (
    <>
      <Modal
        isVisible={isOpen}
        onBackdropPress={onClose}
        style={styles.modal}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            Thành viên ({chatInfo.participants.length || 0})
          </Text>
          {loadingDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e90ff" />
              <Text style={styles.loadingText}>Đang tải thông tin thành viên...</Text>
            </View>
          ) : errorDetails ? (
            <Text style={styles.errorText}>{errorDetails}</Text>
          ) : (
            <FlatList
              data={chatInfo.participants}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <TouchableOpacity
                    style={styles.memberInfo}
                    onPress={() => handleMemberClick(item.userId)}
                  >
                    <Image
                      source={{
                        uri: memberDetails[item.userId]?.avatar || 'https://via.placeholder.com/150',
                      }}
                      style={styles.avatar}
                    />
                    <View>
                      <Text style={styles.memberName}>
                        {memberDetails[item.userId]?.name || 'Không tên'}
                      </Text>
                      {memberDetails[item.userId]?.role === 'admin' && (
                        <Text style={styles.adminLabel}>(Admin)</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {isAdmin && currentUserId !== item.userId && (
                    <TouchableOpacity
                      onPress={() => openConfirmModal(item.userId)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash" size={16} color="#ff0000" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              style={styles.list}
            />
          )}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeIconWrapper}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

        </View>
      </Modal>
      {showConfirmModal && (
        <Modal isVisible={showConfirmModal} onBackdropPress={cancelRemove}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Xác nhận</Text>
            <Text style={styles.confirmText}>
              Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                onPress={cancelRemove}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRemove}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  list: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberName: {
    fontSize: 14,
    color: '#333',
  },
  adminLabel: {
    fontSize: 12,
    color: '#1e90ff',
  },
  removeButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#ff0000',
    textAlign: 'center',
    paddingVertical: 20,
  },
  closeButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 12,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  confirmModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    height: 200,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  cancelButton: {
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
  },
  confirmButton: {
    padding: 10,
    backgroundColor: '#ff0000',
    borderRadius: 5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  closeIconWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    zIndex: 10,
  },

});

export default MemberListModal;