import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Định nghĩa interface cho props
interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  userId: string;
  socket: any; // Có thể định nghĩa interface cụ thể cho socket nếu cần
  onVerified: () => void;
}

const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  userId,
  socket,
  onVerified,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false); // State để theo dõi trạng thái hiển thị PIN

  // Xử lý xác thực PIN
  const handleVerifyPin = () => {
    // Ghi chú: Kiểm tra định dạng PIN và gửi yêu cầu xác thực qua socket
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setErrorMessage('Mã PIN phải là 4 chữ số!');
      return;
    }
    setErrorMessage('');

    setIsProcessing(true);
    socket.emit('verifyPin', { conversationId, userId, pin }, (response: any) => {
      setIsProcessing(false);
      if (response.success) {
        // Ghi chú: Cập nhật trạng thái chatInfo để bỏ isHidden
        socket.emit('updateChatInfo', {
          conversationId,
          userId,
          isHidden: false, // Tạm thời bỏ ẩn sau khi xác thực
        });
        onVerified();
      } else {
        setErrorMessage(response.message || 'Mã PIN không đúng!');
        setPin('');
      }
    });
  };

  // Xử lý hiển thị/ẩn PIN
  const toggleShowPin = () => {
    // Ghi chú: Chuyển đổi trạng thái hiển thị PIN
    setShowPin(!showPin);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="lock-closed" size={24} color="#3b82f6" />
              <Text style={styles.headerText}>Xác thực PIN</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Thông báo */}
          <Text style={styles.message}>
            Để xem cuộc trò chuyện này, vui lòng nhập mã PIN.
          </Text>

          {/* Input PIN với nút hiển thị/ẩn */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errorMessage ? styles.inputError : styles.inputNormal,
              ]}
              value={pin}
              onChangeText={(text) => setPin(text.replace(/\D/g, ''))}
              placeholder="••••"
              placeholderTextColor="#9ca3af"
              maxLength={4}
              secureTextEntry={!showPin} // Thay đổi dựa trên showPin
              editable={!isProcessing}
              textAlign="center"
              keyboardType="numeric"
            />
            <TouchableOpacity
              onPress={toggleShowPin}
              style={styles.showPinButton}
              disabled={isProcessing}
            >
              <Ionicons
                name={showPin ? 'eye' : 'eye-off'}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {/* Nút hành động */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleVerifyPin}
              style={[
                styles.button,
                isProcessing ? styles.confirmButtonDisabled : styles.confirmButton,
              ]}
              disabled={isProcessing}
            >
              <Text style={styles.buttonText}>
                {isProcessing ? 'Đang xác thực...' : 'Xác nhận'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Nền mờ
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  inputNormal: {
    borderColor: '#d1d5db',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  showPinButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  confirmButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PinVerificationModal;