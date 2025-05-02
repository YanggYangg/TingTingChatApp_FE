import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Alert } from 'react-native';
import { updateNotification, onError, offError } from '../../../../../services/sockets/events/chatInfo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  userId: string;
  onMuteSuccess: (muted: boolean) => void;
  socket?: any;
}

const MuteNotificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  conversationId,
  userId,
  onMuteSuccess,
  socket,
}) => {
  const [selectedMuteTime, setSelectedMuteTime] = useState('1h');

  const handleConfirmMute = () => {
    if (!socket || !conversationId || !userId) {
      Alert.alert('Lỗi', 'Thiếu thông tin kết nối hoặc cuộc trò chuyện.');
      return;
    }

    console.log('Gửi updateNotification với mute:', selectedMuteTime);
    updateNotification(socket, { conversationId, mute: selectedMuteTime });
    onClose();
    if (onMuteSuccess) {
      onMuteSuccess(true);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleError = (error: string) => {
      console.error('Lỗi khi cập nhật thông báo:', error);
      Alert.alert('Lỗi', 'Không thể tắt thông báo. Vui lòng thử lại.');
    };

    onError(socket, handleError);

    return () => {
      offError(socket);
    };
  }, [socket]);

  useEffect(() => {
    console.log('Trạng thái modal:', isOpen);
  }, [isOpen]);

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Xác nhận</Text>
        <Text style={styles.modalText}>Bạn có chắc muốn tắt thông báo hội thoại này?</Text>
        <View style={styles.options}>
          {[
            { value: '1h', label: 'Trong 1 giờ' },
            { value: '4h', label: 'Trong 4 giờ' },
            { value: '8am', label: 'Cho đến 8:00 AM' },
            { value: 'forever', label: 'Cho đến khi được mở lại' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.option}
              onPress={() => setSelectedMuteTime(option.value)}
            >
              <View style={styles.radio}>
                {selectedMuteTime === option.value && <View style={styles.radioInner} />}
              </View>
              <Text>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmMute}>
            <Text style={styles.confirmText}>Đồng ý</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 15,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1e90ff',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MuteNotificationModal;