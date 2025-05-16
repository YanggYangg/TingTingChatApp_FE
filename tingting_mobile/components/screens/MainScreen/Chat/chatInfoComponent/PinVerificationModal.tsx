import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";

type PinVerificationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  userId: string | null;
  socket: any;
  onVerified: () => void;
};

const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  userId,
  socket,
  onVerified,
}) => {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!socket || !isOpen) return;

    const handlePinVerified = (data) => {
      if (data.conversationId === conversationId && data.userId === userId) {
        if (data.success) {
          onVerified();
        } else {
          Alert.alert("Lỗi", "PIN không đúng, vui lòng thử lại!");
          setPin("");
        }
      }
    };

    socket.on("pinVerified", handlePinVerified);

    return () => {
      socket.off("pinVerified", handlePinVerified);
    };
  }, [socket, conversationId, userId, isOpen, onVerified]);

  const handleVerifyPin = () => {
    if (!pin.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập PIN!");
      return;
    }

    socket.emit("verifyPin", {
      conversationId,
      userId,
      pin,
    });
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nhập mã PIN</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="Nhập PIN"
            secureTextEntry
            keyboardType="numeric"
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleVerifyPin}>
              <Text style={styles.buttonText}>Xác thực</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Hủy</Text>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    backgroundColor: "#3b82f6",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#888",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default PinVerificationModal;