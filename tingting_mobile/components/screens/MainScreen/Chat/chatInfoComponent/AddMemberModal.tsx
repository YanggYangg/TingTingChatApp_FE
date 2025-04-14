import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  onMemberAdded: () => void; // Sửa để không truyền member trực tiếp mà gọi callback
}

const AddMemberModal: React.FC<Props> = ({
  isOpen,
  onClose,
  conversationId,
  onMemberAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Lấy danh sách thành viên khả dụng
  useEffect(() => {
    const fetchAvailableMembers = async () => {
      if (!conversationId || !isOpen) return;

      try {
        setError('');
        const response = await Api_chatInfo.getAvailableMembers(conversationId);
        const members = Array.isArray(response) ? response : response?.data?.members || [];
        setAvailableMembers(members);
      } catch (error) {
        console.error('Lỗi khi lấy thành viên khả dụng:', error);
        setError('Không thể tải danh sách thành viên.');
      }
    };

    fetchAvailableMembers();
  }, [isOpen, conversationId]);

  const filteredMembers = availableMembers.filter((member) => {
    const fullName = `${member.lastName} ${member.firstName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleAdd = async (member: Member) => {
    try {
      // Giả định API để thêm thành viên
      await Api_chatInfo.addParticipant(conversationId, { memberId: member.id });
      setAvailableMembers((prev) => prev.filter((m) => m.id !== member.id));
      setSuccessMessage('Thêm thành viên thành công!');
      onMemberAdded(); // Gọi callback để cập nhật danh sách thành viên
    } catch (error) {
      console.error('Lỗi khi thêm thành viên:', error);
      setError('Không thể thêm thành viên. Vui lòng thử lại.');
    }
  };

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Thêm thành viên</Text>

        <TextInput
          placeholder="Nhập tên, số điện thoại..."
          style={styles.input}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

        <ScrollView style={{ maxHeight: 300 }}>
          {filteredMembers.length === 0 ? (
            <Text style={styles.noResult}>Không tìm thấy thành viên nào</Text>
          ) : (
            filteredMembers.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <Image source={{ uri: member.avatar }} style={styles.avatar} />
                <Text style={styles.memberName}>
                  {member.lastName} {member.firstName}
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAdd(member)}
                >
                  <Text style={styles.addButtonText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  memberName: {
    flex: 1,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  cancelButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: '#ff0000',
    fontSize: 16,
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  noResult: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
});

export default AddMemberModal;