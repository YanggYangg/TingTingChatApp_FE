import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  // Fetch chat information on component mount
  useEffect(() => {
    const fetchChatInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await Api_chatInfo.getChatInfo(conversationId);
        if (!response || !response._id) {
          throw new Error('Không tìm thấy thông tin cuộc trò chuyện');
        }
        setIsGroup(response.isGroup);
        const participant = response.participants.find((p: Participant) => p.userId === userId);
        setIsHidden(participant?.isHidden || false);
      } catch (err: any) {
        console.error('Error fetching chat information:', err);
        setError('Failed to load security settings. Please try again.');
        Alert.alert('Lỗi', 'Không thể tải cài đặt bảo mật. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId && userId) {
      fetchChatInfo();
    }
  }, [conversationId, userId]);

  // Function to handle hiding/unhiding chat
  const handleHideChat = useCallback(async (hide: boolean, currentPin: string | null) => {
    console.log(`Toggling hide chat for user ${userId} in conversation ${conversationId} to ${hide} with PIN: ${currentPin}`);
    try {
      await Api_chatInfo.hideChat(conversationId, { userId, isHidden: hide, pin: currentPin });
      setIsHidden(hide);
      setShowPinInput(false);
      setPin('');
      Alert.alert('Thành công', `Cuộc trò chuyện đã ${hide ? 'được ẩn' : 'được hiện'}!`);
    } catch (err: any) {
      console.error('Error toggling hide chat:', err);
      Alert.alert('Lỗi', `Cuộc trò chuyện ${hide ? 'ẩn' : 'hiện'} thất bại. Vui lòng thử lại.`);
    }
  }, [conversationId, userId]);

  // Handle toggle switch change
  const handleToggle = useCallback((checked: boolean) => {
    if (checked && !isHidden) {
      setShowPinInput(true);
    } else {
      handleHideChat(checked, null);
    }
  }, [isHidden, handleHideChat]);

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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Api_chatInfo.deleteHistory(conversationId, { userId });
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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await Api_chatInfo.removeParticipant(conversationId, { userId });
              setChatInfo((prevChatInfo) => ({
                ...prevChatInfo,
                participants: prevChatInfo?.participants?.filter((p) => p.userId !== userId) || [],
              }));
              Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm!');
            } catch (err: any) {
              console.error('Error leaving group:', err);
              Alert.alert('Lỗi', 'Rời nhóm không thành công. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [isGroup, conversationId, userId, setChatInfo]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thiết lập bảo mật</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thiết lập bảo mật</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => useEffect(() => {}, [])}>
          <Text style={styles.retryText}>Retry</Text>
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
    marginTop: 5,
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
    marginTop: 5,
  },
  actionText: {
    color: '#ff0000',
    fontSize: 14,
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
});

export default SecuritySettings;