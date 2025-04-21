import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

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
  isOpen: boolean;
  onClose: () => void;
  chatInfo: ChatInfoData;
}

const MemberListModal: React.FC<Props> = ({ isOpen, onClose, chatInfo }) => {
  if (!chatInfo?.participants) return null;

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>
          Thành viên ({chatInfo.participants.length || 0})
        </Text>
        <FlatList
          data={chatInfo.participants}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <Image
                source={{
                  uri:
                    item.avatar ||
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXq8MYeurVYm6Qhjyvzcgx99vXAlT-BGJ1ow&s',
                }}
                style={styles.avatar}
              />
              <Text style={styles.memberName}>{item.name || 'Không tên'}</Text>
            </View>
          )}
          style={styles.list}
        />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  list: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberName: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MemberListModal;