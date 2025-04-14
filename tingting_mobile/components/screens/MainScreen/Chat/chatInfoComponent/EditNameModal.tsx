import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  initialName?: string;
}

const EditNameModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialName }) => {
  const [newName, setNewName] = useState(initialName || '');

  // Cập nhật newName khi initialName thay đổi
  useEffect(() => {
    setNewName(initialName || '');
  }, [initialName]);

  const handleSave = () => {
    if (!newName.trim()) {
      alert('Tên nhóm không được để trống.');
      return;
    }
    onSave(newName.trim());
  };

  if (!isOpen) return null;

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Sửa tên nhóm</Text>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName} // Sửa onChange thành onChangeText cho React Native
          placeholder="Nhập tên nhóm mới"
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
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
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ff0000',
    fontSize: 16,
  },
});

export default EditNameModal;