import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Api_Profile } from '../../../../../apis/api_profile';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import {
  getChatInfo,
  onChatInfo,
  offChatInfo,
  hideChat,
  deleteAllChatHistory,
  transferGroupAdmin,
  disbandGroup,
  leaveGroup,
  onError,
  offError,
  onChatInfoUpdated,
  offChatInfoUpdated,
} from '../../../../../services/sockets/events/chatInfo';
import { joinConversation } from '../../../../../services/sockets/events/conversation';

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
  userRoleInGroup: string | null;
  chatInfo: ChatInfoData | null;
  socket: any;
}

const SecuritySettings: React.FC<Props> = ({
  conversationId,
  userId,
  setChatInfo,
  userRoleInGroup,
  chatInfo,
  socket,
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(userRoleInGroup === 'admin');
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [groupMembers, setGroupMembers] = useState<Participant[]>([]);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isDisbanding, setIsDisbanding] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const navigation = useNavigation();

  // Fetch chat information
  const fetchChatInfo = useCallback(() => {
    if (!socket || !conversationId) {
      setError('Thiếu kết nối hoặc thông tin cuộc trò chuyện.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log('SecuritySettings: Gửi yêu cầu getChatInfo', { conversationId });
    getChatInfo(socket, { conversationId }, (response) => {
      console.log('SecuritySettings: Phản hồi từ getChatInfo', response);
      if (response.success && response.data) {
        const data = response.data;
        setIsGroup(data.isGroup);
        setGroupMembers(data.participants.filter((p) => p.userId !== userId));
        const participant = data.participants.find((p: Participant) => p.userId === userId);
        setIsHidden(participant?.isHidden || false);
        setIsAdmin(participant?.role === 'admin');
        setChatInfo(data);
        console.log('SecuritySettings: Đã cập nhật chatInfo', data);
        setLoading(false);
      } else {
        setError(response.message || 'Không thể lấy thông tin cuộc trò chuyện.');
        Alert.alert('Lỗi', response.message || 'Không thể lấy thông tin cuộc trò chuyện.');
        setLoading(false);
      }
    });
  }, [socket, conversationId, userId, setChatInfo]);

  // Fetch profile details for group members
  const fetchProfileDetails = useCallback(async (members: Participant[]) => {
    setLoadingDetails(true);
    setErrorDetails(null);
    const details: ProfileDetails = {};
    const fetchPromises = members.map(async (member) => {
      try {
        const response = await Api_Profile.getProfile(member.userId);
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

  // Initialize socket listeners and fetch chat info
  useEffect(() => {
    if (!socket || !conversationId || !userId) {
      console.warn('SecuritySettings: Thiếu socket, conversationId hoặc userId', {
        socket,
        conversationId,
        userId,
      });
      setError('Thiếu kết nối hoặc thông tin cuộc trò chuyện.');
      setLoading(false);
      return;
    }

    // Check socket connection
    if (!socket.connected) {
      console.warn('SecuritySettings: Socket chưa kết nối', { socketId: socket.id });
      socket.connect();
    }

    // Join socket room
    console.log('SecuritySettings: Tham gia phòng socket', { conversationId, socketId: socket.id });
    joinConversation(socket, conversationId);

    fetchChatInfo();

    onChatInfo(socket, (data) => {
      console.log('SecuritySettings: Nhận onChatInfo', data);
      setIsGroup(data.isGroup);
      setGroupMembers(data.participants.filter((p) => p.userId !== userId));
      const participant = data.participants.find((p) => p.userId === userId);
      setIsHidden(participant?.isHidden || false);
      setIsAdmin(participant?.role === 'admin');
      setChatInfo(data);
      console.log('SecuritySettings: Đã cập nhật chatInfo từ onChatInfo', data);
    });

    onChatInfoUpdated(socket, (updatedInfo) => {
      console.log('SecuritySettings: Nhận onChatInfoUpdated', JSON.stringify(updatedInfo, null, 2));
      setIsGroup(updatedInfo.isGroup);
      setGroupMembers(updatedInfo.participants.filter((p) => p.userId !== userId));
      const participant = updatedInfo.participants.find((p) => p.userId === userId);
      console.log('SecuritySettings: Participant role', { userId, role: participant?.role });
      setIsHidden(participant?.isHidden || false);
      setIsAdmin(participant?.role === 'admin');
      setChatInfo(updatedInfo);
      console.log('SecuritySettings: Đã cập nhật chatInfo từ onChatInfoUpdated', updatedInfo);
      if (participant?.role === 'admin') {
        // Alert.alert('Thông báo', 'Bạn đã được chuyển quyền trưởng nhóm!');
        fetchChatInfo();
      }
    });

    onError(socket, (error) => {
      console.error('SecuritySettings: Lỗi từ server:', error);
      Alert.alert('Lỗi', error.message || 'Lỗi hệ thống.');
    });

    return () => {
      console.log('SecuritySettings: Gỡ sự kiện socket');
      offChatInfo(socket);
      offChatInfoUpdated(socket);
      offError(socket);
    };
  }, [socket, conversationId, userId, fetchChatInfo, setChatInfo]);

  useEffect(() => {
    if (groupMembers.length > 0) {
      fetchProfileDetails(groupMembers);
    }
  }, [groupMembers, fetchProfileDetails]);

  // Handle hiding/unhiding chat
const handleHideChat = useCallback(
  async (hide: boolean, currentPin: string | null) => {
    if (isProcessing) {
      console.log('SecuritySettings: Đang xử lý, bỏ qua hideChat');
      return;
    }
    setIsProcessing(true);
    try {
      console.log('SecuritySettings: Gửi yêu cầu hideChat', { conversationId, isHidden: hide, pin: currentPin });
      hideChat(socket, { conversationId, isHidden: hide, pin: currentPin }, (response) => {
        console.log('SecuritySettings: Phản hồi từ hideChat', response);
        if (response.success) {
          setIsHidden(hide);
          setShowPinInput(false);
          setPin('');
          Alert.alert('Thành công', `Cuộc trò chuyện đã ${hide ? 'được ẩn' : 'được hiện'}!`);
          
          if (hide) {
            // Khi ẩn cuộc trò chuyện, xóa chatInfo và điều hướng về ChatScreen
            setChatInfo(null);
            navigation.navigate('Main', { screen: 'ChatScreen', params: { refresh: true } });
          }
        } else {
          Alert.alert('Lỗi', `Cuộc trò chuyện ${hide ? 'ẩn' : 'hiện'} thất bại: ${response.message}`);
        }
        setIsProcessing(false);
      });
    } catch (error) {
      console.error('SecuritySettings: Lỗi khi ẩn/hiện trò chuyện:', error);
      Alert.alert('Lỗi', 'Lỗi khi ẩn/hiện trò chuyện. Vui lòng thử lại.');
      setIsProcessing(false);
    }
  },
  [socket, conversationId, isProcessing, setChatInfo, navigation]
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

  // Delete chat history for all users
  const handleDeleteHistory = useCallback(() => {
    if (isProcessing) {
      console.log('SecuritySettings: Đang xử lý, bỏ qua deleteAllChatHistory');
      return;
    }
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này cho tất cả người dùng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setIsProcessing(true);
            console.log('SecuritySettings: Gửi yêu cầu deleteAllChatHistory', { conversationId, userId });
            if (!socket.connected) {
              Alert.alert('Lỗi', 'Không thể kết nối đến server. Vui lòng thử lại.');
              setIsProcessing(false);
              return;
            }
            deleteAllChatHistory(socket, { conversationId }, (response) => {
              console.log('SecuritySettings: Phản hồi từ deleteAllChatHistory', response);
              if (response?.success) {
                Alert.alert('Thành công', 'Toàn bộ lịch sử trò chuyện đã được xóa!');
                setChatInfo(null);
                navigation.navigate('Main', { screen: 'MessageScreen', params: { refresh: true } });
              } else {
                Alert.alert('Lỗi', `Xóa lịch sử thất bại: ${response?.message || 'Lỗi không xác định'}`);
              }
              setIsProcessing(false);
            });
          },
        },
      ],
      { cancelable: false }
    );
  }, [socket, conversationId, userId, isProcessing, setChatInfo, navigation]);

  // Leave group functionality
  const handleLeaveGroup = useCallback(() => {
    if (!isGroup) return;
    if (isAdmin && groupMembers.length === 0) {
      Alert.alert('Lỗi', 'Bạn là thành viên duy nhất. Vui lòng giải tán nhóm.');
      return;
    }
    if (isAdmin) {
      setShowTransferAdminModal(true);
    } else {
      setShowLeaveConfirm(true);
    }
  }, [isGroup, isAdmin, groupMembers]);

  const confirmLeaveGroup = useCallback(() => {
    if (isProcessing) {
      console.log('SecuritySettings: Đang xử lý, bỏ qua confirmLeaveGroup');
      return;
    }
    setIsLeaving(true);
    setIsProcessing(true);
    console.log('SecuritySettings: Gửi yêu cầu leaveGroup', { conversationId, userId });
    leaveGroup(socket, { conversationId, userId }, (response) => {
      console.log('SecuritySettings: Phản hồi từ leaveGroup', response);
      if (response.success) {
        setChatInfo(null);
        Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm!');
        navigation.navigate('Main', { screen: 'MessageScreen' });
      } else {
        Alert.alert('Lỗi', `Rời nhóm thất bại: ${response.message}`);
      }
      setIsLeaving(false);
      setShowLeaveConfirm(false);
      setIsProcessing(false);
    });
  }, [socket, conversationId, userId, setChatInfo, navigation, isProcessing]);

  // Transfer admin and leave group
  const handleTransferAdminAndLeave = useCallback(() => {
    if (!newAdminUserId) {
      Alert.alert('Lỗi', 'Vui lòng chọn một thành viên để chuyển quyền.');
      return;
    }
    if (isProcessing) {
      console.log('SecuritySettings: Đang xử lý, bỏ qua handleTransferAdminAndLeave');
      return;
    }
    setIsLeaving(true);
    setIsProcessing(true);
    console.log('SecuritySettings: Gửi yêu cầu transferGroupAdmin', { conversationId, userId: newAdminUserId });
    transferGroupAdmin(socket, { conversationId, userId: newAdminUserId }, (response) => {
      console.log('SecuritySettings: Phản hồi từ transferGroupAdmin', response);
      if (response.success) {
  
        fetchChatInfo();
        console.log('SecuritySettings: Gửi yêu cầu leaveGroup', { conversationId, userId });
        leaveGroup(socket, { conversationId, userId }, (leaveResponse) => {
          console.log('SecuritySettings: Phản hồi từ leaveGroup', leaveResponse);
          if (leaveResponse.success) {
            setChatInfo(null);
            Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm!');
            navigation.navigate('Main', { screen: 'MessageScreen' });
          } else {
            Alert.alert('Lỗi', `Rời nhóm thất bại: ${leaveResponse.message}`);
          }
          setIsLeaving(false);
          setShowTransferAdminModal(false);
          setNewAdminUserId('');
          setIsProcessing(false);
        });
      } else {
        Alert.alert('Lỗi', `Chuyển quyền thất bại: ${response.message}`);
        fetchChatInfo();
        setIsLeaving(false);
        setShowTransferAdminModal(false);
        setNewAdminUserId('');
        setIsProcessing(false);
      }
    });
  }, [socket, conversationId, userId, newAdminUserId, setChatInfo, navigation, isProcessing, fetchChatInfo]);

  // Disband group functionality
  const handleDisbandGroup = useCallback(() => {
    if (!isGroup || !isAdmin) return;
    setShowDisbandConfirm(true);
  }, [isGroup, isAdmin]);

  const confirmDisbandGroup = useCallback(() => {
    if (isProcessing) {
      console.log('SecuritySettings: Đang xử lý, bỏ qua confirmDisbandGroup');
      return;
    }
    setIsDisbanding(true);
    setIsProcessing(true);
    console.log('SecuritySettings: Gửi yêu cầu disbandGroup', { conversationId });
    disbandGroup(socket, { conversationId }, (response) => {
      console.log('SecuritySettings: Phản hồi từ disbandGroup', response);
      if (response.success) {
        setChatInfo(null);
      
        console.log('SecuritySettings: Đã xóa chatInfo và điều hướng đến MessageScreen');
        navigation.navigate('Main', { screen: 'MessageScreen' });
      } else {
        Alert.alert('Lỗi', `Giải tán nhóm thất bại: ${response.message}`);
      }
      setIsDisbanding(false);
      setShowDisbandConfirm(false);
      setIsProcessing(false);
    });
  }, [socket, conversationId, setChatInfo, navigation, isProcessing]);

  // Handle transferring group admin
  const handleTransferAdmin = useCallback(() => {
    if (!newAdminUserId) {
      Alert.alert('Lỗi', 'Vui lòng chọn một thành viên để chuyển quyền.');
      return;
    }
    if (isProcessing) {
      console.log('SecuritySettings: Đang xử lý, bỏ qua handleTransferAdmin');
      return;
    }
    setIsProcessing(true);
    console.log('SecuritySettings: Gửi yêu cầu transferGroupAdmin', { conversationId, userId: newAdminUserId });
    transferGroupAdmin(socket, { conversationId, userId: newAdminUserId }, (response) => {
      console.log('SecuritySettings: Phản hồi từ transferGroupAdmin', response);
      if (response.success) {
        setIsAdmin(false);
       
        fetchChatInfo();
        setTimeout(() => {
          fetchChatInfo();
        }, 2000);
      } else {
        Alert.alert('Lỗi', `Chuyển quyền thất bại: ${response.message}`);
        fetchChatInfo();
      }
      setShowTransferAdminModal(false);
      setNewAdminUserId('');
      setIsProcessing(false);
    });
  }, [socket, conversationId, newAdminUserId, fetchChatInfo, isProcessing]);

  // Handle closing the transfer admin modal
  const handleCloseTransferAdminModal = useCallback(() => {
    setShowTransferAdminModal(false);
    setNewAdminUserId('');
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Ionicons name="shield-outline" size={20} color="#000" style={styles.titleIcon} />
          <Text style={styles.title}>Thiết lập bảo mật</Text>
        </View>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Ionicons name="shield-outline" size={20} color="#000" style={styles.titleIcon} />
          <Text style={styles.title}>Thiết lập bảo mật</Text>
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchChatInfo}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Ionicons name="shield-outline" size={20} color="#000" style={styles.titleIcon} />
        <Text style={styles.title}>Thiết lập bảo mật</Text>
      </View>

      <View style={styles.toggleContainer}>
        <View style={styles.toggleLabelContainer}>
          <Ionicons name="lock-closed-outline" size={16} color="#000" style={styles.toggleIcon} />
          <Text style={styles.toggleLabel}>Ẩn cuộc trò chuyện</Text>
        </View>
        <Switch
          value={isHidden}
          onValueChange={handleToggle}
          trackColor={{ false: '#ccc', true: '#1e90ff' }}
          thumbColor={'#fff'}
          disabled={isProcessing}
        />
      </View>

      {showPinInput && (
        <View style={styles.pinContainer}>
          <View style={styles.pinLabelContainer}>
            <Ionicons name="key-outline" size={16} color="#000" style={styles.pinIcon} />
            <Text style={styles.pinLabel}>Nhập PIN (4 chữ số)</Text>
          </View>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={(text) => setPin(text.replace(/\D/g, ''))}
            maxLength={4}
            secureTextEntry
            placeholder="****"
            placeholderTextColor="#666"
            textAlign="center"
            keyboardType="numeric"
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
            onPress={handleSubmitPin}
            disabled={isProcessing}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={styles.submitIcon} />
            <Text style={styles.submitButtonText}>{isProcessing ? 'Đang xử lý...' : 'Xác nhận'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleDeleteHistory}
        disabled={isProcessing}
      >
        <Ionicons name="trash-outline" size={16} color="#ff0000" style={styles.actionIcon} />
        <Text style={[styles.actionText, { color: '#ff0000' }]}>Xóa toàn bộ lịch sử trò chuyện</Text>
      </TouchableOpacity>

      {isGroup && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLeaveGroup}
          disabled={isLeaving || isProcessing}
        >
          <Ionicons name="exit-outline" size={16} color="#ff0000" style={styles.actionIcon} />
          <Text style={[styles.actionText, { color: '#ff0000' }]}>{isLeaving ? 'Đang rời nhóm...' : 'Rời khỏi nhóm'}</Text>
        </TouchableOpacity>
      )}

      {isGroup && isAdmin && (
        <>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowTransferAdminModal(true)}
            disabled={isProcessing}
          >
            <Ionicons name="swap-horizontal-outline" size={16} color="#007bff" style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: '#007bff' }]}>Chuyển quyền trưởng nhóm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDisbandGroup}
            disabled={isDisbanding || isProcessing}
          >
            <Ionicons name="close-circle-outline" size={16} color="#ff0000" style={styles.actionIcon} />
            <Text style={[styles.actionText, { color: '#ff0000' }]}>{isDisbanding ? 'Đang giải tán...' : 'Giải tán nhóm'}</Text>
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
          <View style={styles.modalTitleContainer}>
            <Ionicons name="swap-horizontal-outline" size={20} color="#000" style={styles.modalTitleIcon} />
            <Text style={styles.modalTitle}>
              {isLeaving ? 'Chuyển quyền trước khi rời nhóm' : 'Chuyển quyền trưởng nhóm'}
            </Text>
          </View>
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
                    disabled={isProcessing}
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
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handleCloseTransferAdminModal}
              disabled={isProcessing}
            >
              <Ionicons name="close-outline" size={16} color="#666" style={styles.modalButtonIcon} />
              <Text style={styles.modalCancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, !newAdminUserId && styles.modalActionButtonDisabled]}
              onPress={isLeaving ? handleTransferAdminAndLeave : handleTransferAdmin}
              disabled={!newAdminUserId || isProcessing}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={styles.modalButtonIcon} />
              <Text style={styles.modalActionButtonText}>
                {isLeaving ? 'Chuyển quyền và rời nhóm' : 'Chuyển quyền'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        isVisible={showDisbandConfirm}
        onBackdropPress={() => setShowDisbandConfirm(false)}
        onBackButtonPress={() => setShowDisbandConfirm(false)}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalTitleContainer}>
            <Ionicons name="close-circle-outline" size={20} color="#000" style={styles.modalTitleIcon} />
            <Text style={styles.modalTitle}>Xác nhận giải tán nhóm</Text>
          </View>
          <Text style={styles.modalText}>
            Bạn có chắc chắn muốn giải tán nhóm này không? Tất cả thành viên sẽ bị xóa và lịch sử trò chuyện sẽ bị mất.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowDisbandConfirm(false)}
              disabled={isProcessing}
            >
              <Ionicons name="close-outline" size={16} color="#666" style={styles.modalButtonIcon} />
              <Text style={styles.modalCancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, isDisbanding && styles.modalActionButtonDisabled]}
              onPress={confirmDisbandGroup}
              disabled={isDisbanding || isProcessing}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={styles.modalButtonIcon} />
              <Text style={styles.modalActionButtonText}>
                {isDisbanding ? 'Đang giải tán...' : 'Giải tán'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        isVisible={showLeaveConfirm}
        onBackdropPress={() => setShowLeaveConfirm(false)}
        onBackButtonPress={() => setShowLeaveConfirm(false)}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalTitleContainer}>
            <Ionicons name="exit-outline" size={20} color="#000" style={styles.modalTitleIcon} />
            <Text style={styles.modalTitle}>Xác nhận rời nhóm</Text>
          </View>
          <Text style={styles.modalText}>
            Bạn có chắc chắn muốn rời khỏi nhóm này không? Bạn sẽ không thể truy cập nhóm sau khi rời.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLeaveConfirm(false)}
              disabled={isProcessing}
            >
              <Ionicons name="close-outline" size={16} color="#666" style={styles.modalButtonIcon} />
              <Text style={styles.modalCancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, isLeaving && styles.modalActionButtonDisabled]}
              onPress={confirmLeaveGroup}
              disabled={isLeaving || isProcessing}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={styles.modalButtonIcon} />
              <Text style={styles.modalActionButtonText}>
                {isLeaving ? 'Đang rời...' : 'Rời nhóm'}
              </Text>
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
    padding: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    marginRight: 8,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#000',
  },
  pinContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  pinLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  pinIcon: {
    marginRight: 8,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    borderRadius: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitIcon: {
    marginRight: 8,
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
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
    color: '#000',
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitleIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  modalText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    color: '#000',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginRight: 15,
  },
  modalButtonIcon: {
    marginRight: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#000',
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
    color: '#000',
  },
});

export default SecuritySettings;