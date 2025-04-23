import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';
import { Api_Profile } from '../../../../../apis/api_profile';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';

interface Participant {
  userId: string;
  name: string;
  avatar: string | null;
  isHidden: boolean;
  role: 'member' | 'admin';
}

interface ChatInfoData {
  _id: string;
  isGroup: boolean;
  participants: Participant[];
}

interface ProfileDetails {
  [userId: string]: {
    name: string;
    avatar: string | null;
  };
}

interface Props {
  conversationId: string;
  userId: string;
  setChatInfo: React.Dispatch<React.SetStateAction<ChatInfoData | null>>;
}

const SecuritySettings: React.FC<Props> = ({ conversationId, userId, setChatInfo }) => {
  const [isHidden, setIsHidden] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [groupMembers, setGroupMembers] = useState<Participant[]>([]);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const navigation = useNavigation();

  // Retry logic for API calls to handle socket timeouts
  const withRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        console.warn(`API call failed (attempt ${i + 1}/${retries}):`, error);
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay * 2 ** i));
      }
    }
  };

  // Fetch chat information
  const fetchChatInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await withRetry(() => Api_chatInfo.getChatInfo(conversationId));
      if (!response || !response._id) {
        throw new Error('Không tìm thấy thông tin cuộc trò chuyện');
      }
      setIsGroup(response.isGroup);
      setGroupMembers(response.participants.filter((p) => p.userId !== userId));
      const participant = response.participants.find((p: Participant) => p.userId === userId);
      setIsHidden(participant?.isHidden || false);
      setIsAdmin(participant?.role === 'admin');
      setChatInfo(response);
    } catch (err: any) {
      console.error('Error fetching chat information:', err);
      setError('Không thể tải cài đặt bảo mật. Vui lòng thử lại.');
      Alert.alert('Lỗi', 'Không thể tải cài đặt bảo mật. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, setChatInfo]);

  // Fetch profile details for group members
  const fetchProfileDetails = useCallback(async (members: Participant[]) => {
    setLoadingDetails(true);
    setErrorDetails(null);
    const details: ProfileDetails = {};
    const fetchPromises = members.map(async (member) => {
      try {
        const response = await withRetry(() => Api_Profile.getProfile(member.userId));
        if (response?.data?.user) {
          details[member.userId] = {
            name: `${response.data.user.firstname} ${response.data.user.surname}`.trim(),
            avatar: response.data.user.avatar,
          };
        } else {
          details[member.userId] = { name: 'Không tìm thấy', avatar: null };
        }
      } catch (error) {
        console.error(`Lỗi khi lấy thông tin người dùng ${member.userId}:`, error);
        details[member.userId] = { name: 'Lỗi tải', avatar: null };
      }
    });

    try {
      await Promise.all(fetchPromises);
      setProfileDetails(details);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thông tin người dùng:', error);
      setErrorDetails('Không thể tải thông tin thành viên.');
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId && userId) {
      fetchChatInfo();
    }
  }, [conversationId, userId, fetchChatInfo]);

  useEffect(() => {
    if (groupMembers.length > 0) {
      fetchProfileDetails(groupMembers);
    }
  }, [groupMembers, fetchProfileDetails]);

  // Handle hiding/unhiding chat
  const handleHideChat = useCallback(
    async (hide: boolean, currentPin: string | null) => {
      try {
        await withRetry(() =>
          Api_chatInfo.hideChat(conversationId, { userId, isHidden: hide, pin: currentPin })
        );
        setIsHidden(hide);
        setShowPinInput(false);
        setPin('');
        Alert.alert('Thành công', `Cuộc trò chuyện đã ${hide ? 'được ẩn' : 'được hiện'}!`);
      } catch (err: any) {
        console.error('Error toggling hide chat:', err);
        Alert.alert('Lỗi', `Cuộc trò chuyện ${hide ? 'ẩn' : 'hiện'} thất bại. Vui lòng thử lại.`);
      }
    },
    [conversationId, userId]
  );

  // Handle toggle switch change
  const handleToggle = useCallback(
    (checked: boolean) => {
      if (checked && !isHidden) {
        setShowPinInput(true);
      } else {
        handleHideChat(checked, null);
      }
    },
    [isHidden, handleHideChat]
  );

  // Handle PIN submission
  const handleSubmitPin = useCallback(() => {
    if (!/^\d{4}$/.test(pin)) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã PIN hợp lệ (4 chữ số).');
      return;
    }
    handleHideChat(true, pin);
  }, [pin, handleHideChat]);

  // Delete chat history
  const handleDeleteHistory = useCallback(async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa lịch sử trò chuyện này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await withRetry(() => Api_chatInfo.deleteHistory(conversationId, { userId }));
              Alert.alert('Thành công', 'Lịch sử trò chuyện đã được xóa!');
            } catch (err: any) {
              console.error('Error deleting chat history:', err);
              Alert.alert('Lỗi', 'Xóa lịch sử trò chuyện không thành công. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [conversationId, userId]);

  // Leave group functionality
  const handleLeaveGroup = useCallback(async () => {
    if (!isGroup) return;
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn rời khỏi nhóm này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời',
          style: 'destructive',
          onPress: async () => {
            try {
              await withRetry(() => Api_chatInfo.removeParticipant(conversationId, { userId }));
              setChatInfo(null); // Clear chat info to prevent further interactions
              Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm!');
              navigation.navigate('Main', { screen: 'ChatScreen' }); // Navigate to ChatScreen tab
            } catch (err: any) {
              console.error('Error leaving group:', err);
              Alert.alert('Lỗi', 'Rời nhóm không thành công. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [isGroup, conversationId, userId, setChatInfo, navigation]);

  // Disband group functionality
  const handleDisbandGroup = useCallback(async () => {
    if (!isGroup || !isAdmin) return;
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn giải tán nhóm này? Tất cả thành viên sẽ bị xóa và lịch sử trò chuyện sẽ bị mất.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Giải tán',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Disbanding group with conversationId:', conversationId);
              await withRetry(() => Api_chatInfo.disbandGroup(conversationId, { userId }));
              setChatInfo(null); // Clear chat info
              Alert.alert('Thành công', 'Nhóm đã được giải tán!');
              navigation.navigate('Main', { screen: 'ChatScreen' }); // Navigate to ChatScreen tab
            } catch (error) {
              console.error('Lỗi khi giải tán nhóm:', error);
              Alert.alert('Lỗi', 'Giải tán nhóm không thành công. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [isGroup, isAdmin, conversationId, userId, setChatInfo, navigation]);

  // Handle opening the transfer admin modal
  const handleOpenTransferAdminModal = useCallback(() => {
    setShowTransferAdminModal(true);
  }, []);

  // Handle closing the transfer admin modal
  const handleCloseTransferAdminModal = useCallback(() => {
    setShowTransferAdminModal(false);
    setNewAdminUserId('');
  }, []);

  // Handle transferring group admin
  const handleTransferAdmin = useCallback(async () => {
    if (!newAdminUserId) {
      Alert.alert('Lỗi', 'Vui lòng chọn một thành viên để chuyển quyền trưởng nhóm.');
      return;
    }
    try {
      const updatedConversation = await withRetry(() =>
        Api_chatInfo.transferGroupAdmin(conversationId, {
          requesterUserId: userId,
          newAdminUserId,
        })
      );
      setChatInfo(updatedConversation);
      setIsAdmin(false);
      setGroupMembers(updatedConversation.participants.filter((p) => p.userId !== userId));
      handleCloseTransferAdminModal();
      Alert.alert('Thành công', 'Quyền trưởng nhóm đã được chuyển!');
    } catch (err: any) {
      console.error('Lỗi khi chuyển quyền trưởng nhóm:', err);
      Alert.alert('Lỗi', 'Chuyển quyền trưởng nhóm không thành công. Vui lòng thử lại.');
      fetchChatInfo();
    }
  }, [conversationId, userId, newAdminUserId, setChatInfo, handleCloseTransferAdminModal, fetchChatInfo]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thiết lập bảo mật</Text>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thiết lập bảo mật</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchChatInfo}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thiết lập bảo mật</Text>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Ẩn cuộc trò chuyện</Text>
        <Switch
          value={isHidden}
          onValueChange={handleToggle}
          trackColor={{ false: '#ccc', true: '#1e90ff' }}
          thumbColor={'#fff'}
        />
      </View>

      {showPinInput && (
        <View style={styles.pinContainer}>
          <Text style={styles.pinLabel}>Nhập PIN (4 chữ số)</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={(text) => setPin(text.replace(/\D/g, ''))}
            maxLength={4}
            secureTextEntry
            placeholder="****"
            textAlign="center"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitPin}>
            <Text style={styles.submitButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.actionButton} onPress={handleDeleteHistory}>
        <Ionicons name="trash" size={16} color="#ff0000" style={styles.actionIcon} />
        <Text style={styles.actionText}>Xóa lịch sử trò chuyện</Text>
      </TouchableOpacity>

      {isGroup && (
        <TouchableOpacity style={styles.actionButton} onPress={handleLeaveGroup}>
          <Ionicons name="exit-outline" size={16} color="#ff0000" style={styles.actionIcon} />
          <Text style={styles.actionText}>Rời khỏi nhóm</Text>
        </TouchableOpacity>
      )}

      {isGroup && isAdmin && (
        <>
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenTransferAdminModal}>
            <Ionicons name="swap-horizontal-outline" size={16} color="#007bff" style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: '#007bff' }]}>Chuyển quyền trưởng nhóm</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDisbandGroup}>
            <Ionicons name="close-circle-outline" size={16} color="#ff0000" style={styles.actionIcon} />
            <Text style={styles.actionText}>Giải tán nhóm</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        isVisible={showTransferAdminModal}
        onBackdropPress={handleCloseTransferAdminModal}
        onBackButtonPress={handleCloseTransferAdminModal}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Chuyển quyền trưởng nhóm</Text>
          {loadingDetails ? (
            <Text style={styles.loadingText}>Đang tải thông tin thành viên...</Text>
          ) : errorDetails ? (
            <Text style={styles.errorText}>{errorDetails}</Text>
          ) : groupMembers.filter((member) => member.role === 'member').length > 0 ? (
            <View>
              <Text style={styles.modalLabel}>Chọn thành viên mới:</Text>
              {groupMembers
                .filter((member) => member.role === 'member')
                .map((member) => (
                  <TouchableOpacity
                    key={member.userId}
                    style={[
                      styles.modalOption,
                      newAdminUserId === member.userId && styles.modalOptionSelected,
                    ]}
                    onPress={() => setNewAdminUserId(member.userId)}
                  >
                    <View style={styles.memberInfo}>
                      {profileDetails[member.userId]?.avatar ? (
                        <Image
                          source={{ uri: profileDetails[member.userId].avatar }}
                          style={styles.memberAvatar}
                        />
                      ) : (
                        <Ionicons
                          name="person-circle-outline"
                          size={40}
                          color="#ccc"
                          style={styles.memberAvatar}
                        />
                      )}
                      <Text style={styles.memberName}>
                        {profileDetails[member.userId]?.name || 'Không xác định'}
                      </Text>
                    </View>
                    {newAdminUserId === member.userId && (
                      <Ionicons name="checkmark" size={18} color="#1e90ff" />
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          ) : (
            <Text style={styles.noMembersText}>Không có thành viên nào để chuyển quyền.</Text>
          )}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={handleCloseTransferAdminModal}>
              <Text style={styles.modalCancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, !newAdminUserId && styles.modalActionButtonDisabled]}
              onPress={handleTransferAdmin}
              disabled={!newAdminUserId}
            >
              <Text style={styles.modalActionButtonText}>Chuyển quyền</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 14,
  },
  pinContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 5,
  },
  actionText: {
    fontSize: 14,
    color: '#ff0000',
  },
  actionIcon: {
    marginRight: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff0000',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#1e90ff',
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionSelected: {
    backgroundColor: '#e0f7fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalCancelButton: {
    padding: 10,
    marginRight: 15,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalActionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  modalActionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalActionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  noMembersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
});

export default SecuritySettings;