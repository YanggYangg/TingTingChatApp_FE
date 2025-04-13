import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

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
  const mockChatInfo = {
    _id: "67e2d6bef1ea6ac96f10bf91",
    isGroup: true,
    participants: [
      {
        userId: "6601a1b2c3d4e5f678901238",
        name: "Nguyễn Văn A",
        avatar: "https://example.com/avatar1.jpg",
        isHidden: false,
      },
      {
        userId: "6601a1b2c3d4e5f678901239",
        name: "Trần Thị B",
        avatar: "https://example.com/avatar2.jpg",
        isHidden: true,
      },
    ],
  };
  useEffect(() => {
    const fetchChatInfo = () => {
      const response = mockChatInfo;
      setIsGroup(response.isGroup);
      const participant = response.participants.find((p) => p.userId === userId);
      setIsHidden(participant ? participant.isHidden : false);
    };
    fetchChatInfo();
  }, [conversationId, userId]);

  const handleToggle = async (checked: boolean) => {
    if (checked && !isHidden) {
      setShowPinInput(true);
    } else {
      await handleHideChat(checked, null);
    }
  };

  const handleHideChat = async (hide: boolean, pin: string | null) => {
    setIsHidden(hide);
    setShowPinInput(false);
    setPin('');
    Alert.alert("Thông báo", hide ? "Đã ẩn trò chuyện!" : "Đã hiện trò chuyện!");
  };

  const handleSubmitPin = () => {
    if (pin.length === 4) {
      handleHideChat(true, pin);
    } else {
      Alert.alert("Lỗi", "Mã PIN phải có 4 chữ số!");
    }
  };

  const handleDeleteHistory = async () => {
    Alert.alert("Thông báo", "Đã ẩn lịch sử trò chuyện khỏi tài khoản của bạn!");
  };

  const handleLeaveGroup = async () => {
    if (!isGroup) return;

    if (!userId) {
      Alert.alert("Lỗi", "userId không tồn tại!");
      return;
    }

    setChatInfo((prevChatInfo) => ({
      ...prevChatInfo!,
      participants: prevChatInfo?.participants?.filter((p) => p.userId !== userId) || [],
    }));
    Alert.alert("Thông báo", "Bạn đã rời khỏi nhóm!");
  };

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
  }
  
});

export default SecuritySettings;