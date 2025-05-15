import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';

interface CommonGroup {
  _id: string;
  name: string;
  imageGroup?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  commonGroups: CommonGroup[];
  userId: string;
  otherUserId: string;
  socket: any;
  onGroupSelect?: (group: CommonGroup) => void;
}

const CommonGroupsModal: React.FC<Props> = ({ isOpen, onClose, commonGroups, userId, otherUserId, socket, onGroupSelect }) => {
  const navigation = useNavigation();

  const handleGroupSelect = (group: CommonGroup) => {
    if (onGroupSelect) {
      onGroupSelect(group);
    } else {
      navigation.navigate('ChatScreen', { conversationId: group._id });
    }
    onClose();
  };

  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={onClose}
      style={styles.modal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalTitleContainer}>
          <Ionicons name="chatbubbles-outline" size={20} color="#333" style={styles.modalTitleIcon} />
          <Text style={styles.modalTitle}>Nhóm chung ({commonGroups.length})</Text>
        </View>
        {commonGroups.length === 0 ? (
          <Text style={styles.noGroupsText}>Không có nhóm chung nào.</Text>
        ) : (
          <FlatList
            data={commonGroups}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.groupItem}
                onPress={() => handleGroupSelect(item)}
              >
                <Image
                  source={{
                    uri: item.imageGroup || 'https://via.placeholder.com/40',
                  }}
                  style={styles.groupImage}
                />
                <Text style={styles.groupName}>{item.name || 'Nhóm không tên'}</Text>
              </TouchableOpacity>
            )}
            style={styles.list}
          />
        )}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeIconWrapper}
        >
          <Ionicons name="close-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleIcon: {
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  list: {
    maxHeight: 300,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  groupImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  groupName: {
    fontSize: 14,
    color: '#333',
  },
  noGroupsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  closeIconWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  },
});

export default CommonGroupsModal;