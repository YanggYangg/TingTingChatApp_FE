import React, { useState, useEffect } from 'react';
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

  // Lấy thông tin cuộc trò chuyện để xác định trạng thái isGroup và isHidden
  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await Api_chatInfo.getChatInfo(conversationId);

        // Kiểm tra dữ liệu trả về từ API
        if (!response || !response._id) {
          throw new Error('Dữ liệu trả về không hợp lệ.');
        }

        setIsGroup(response.isGroup);
        const participant = response.participants.find((p: Participant) => p.userId === userId);
        setIsHidden(participant ? participant.isHidden : false);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin cuộc trò chuyện:', error);
        setError('Không thể tải thông tin bảo mật. Vui lòng thử lại.');
        Alert.alert('Lỗi', 'Không thể tải thông tin bảo mật. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId && userId) {
      fetchChatInfo();
    }
  }, [conversationId, userId]);

  // Xử lý bật/tắt ẩn trò chuyện
  const handleToggle = async (checked: boolean) => {
    if (checked && !isHidden) {
      setShowPinInput(true); // Hiển thị form PIN khi ẩn lần đầu
    } else {
      await handleHideChat(checked, null); // Hiện lại không cần PIN
    }
  };

  // Gọi API để ẩn/hiện trò chuyện
  const handleHideChat = async (hide: boolean, pin: string | null) => {
    console.log('Ân/hiện trò chuyện:với userId:', userId, 'và pin:', pin);
    try {
      await Api_chatInfo.hideChat(conversationId, { userId, isHidden: hide, pin });
      setIsHidden(hide);
      setShowPinInput(false);
      setPin('');
      Alert.alert('Thành công', hide ? 'Đã ẩn trò chuyện!' : 'Đã hiện trò chuyện!');
    } catch (error) {
      console.error('Lỗi khi ẩn/hiện trò chuyện:', error);
      Alert.alert('Lỗi', 'Không thể ẩn/hiện trò chuyện. Vui lòng thử lại.');
    }
  };

  // Xử lý nhập mã PIN và xác nhận
  const handleSubmitPin = () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      Alert.alert('Lỗi', 'Mã PIN phải có đúng 4 chữ số!');
      return;
    }
    handleHideChat(true, pin);
  };

  // Xóa lịch sử trò chuyện
  const handleDeleteHistory = async () => {
    try {
      await Api_chatInfo.deleteHistory(conversationId, { userId });
      Alert.alert('Thành công', 'Đã xóa lịch sử trò chuyện!');
    } catch (error) {
      console.error('Lỗi khi xóa lịch sử trò chuyện:', error);
      Alert.alert('Lỗi', 'Không thể xóa lịch sử trò chuyện. Vui lòng thử lại.');
    }
  };

  // Rời nhóm
  const handleLeaveGroup = async () => {
    if (!isGroup) return;

    if (!userId) {
      console.error('userId không tồn tại!');
      Alert.alert('Lỗi', 'Không xác định được người dùng.');
      return;
    }

    try {
      await Api_chatInfo.removeParticipant(conversationId, { userId });
      setChatInfo((prevChatInfo) => ({
        ...prevChatInfo,
        participants: prevChatInfo?.participants?.filter((p) => p.userId !== userId) || [],
      }));
      Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm!');
    } catch (error) {
      console.error('Lỗi khi rời nhóm:', error);
      Alert.alert('Lỗi', 'Không thể rời nhóm. Vui lòng thử lại.');
    }
  };

  // Hiển thị khi đang tải
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thiết lập bảo mật</Text>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  // Hiển thị khi có lỗi
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thiết lập bảo mật</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => useEffect(() => {}, [])}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thiết lập bảo mật</Text>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>Ẩn trò chuyện</Text>
        <Switch
          value={isHidden}
          onValueChange={handleToggle}
          trackColor={{ false: '#ccc', true: '#1e90ff' }}
          thumbColor={'#fff'}
        />
      </View>

      {showPinInput && (
        <View style={styles.pinContainer}>
          <Text style={styles.pinLabel}>Nhập mã PIN (4 chữ số)</Text>
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
          <Text style={styles.actionText}>Rời nhóm</Text>
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