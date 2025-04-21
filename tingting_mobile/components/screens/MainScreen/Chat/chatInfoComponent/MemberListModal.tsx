import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import { Api_Profile } from '../../../../../apis/api_profile';

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

interface MemberDetails {
  [userId: string]: {
    name: string;
    avatar: string | null;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatInfo: ChatInfoData;
}

const MemberListModal: React.FC<Props> = ({ isOpen, onClose, chatInfo }) => {
  const [memberDetails, setMemberDetails] = useState<MemberDetails>({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!chatInfo?.participants) {
        setErrorDetails('Không có thông tin thành viên.');
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      setErrorDetails(null);
      const details: MemberDetails = {};

      try {
        const fetchPromises = chatInfo.participants.map(async (member) => {
          try {
            const response = await Api_Profile.getProfile(member.userId);
            if (response?.data?.user) {
              details[member.userId] = {
                name: `${response.data.user.firstname} ${response.data.user.surname}`.trim() || 'Không tên',
                avatar: response.data.user.avatar,
              };
            } else {
              details[member.userId] = {
                name: 'Không tìm thấy',
                avatar: null,
              };
            }
          } catch (error) {
            console.error(`Lỗi khi lấy thông tin người dùng ${member.userId}:`, error);
            details[member.userId] = {
              name: 'Lỗi tải',
              avatar: null,
            };
          }
        });

        await Promise.all(fetchPromises);
        setMemberDetails(details);
        setLoadingDetails(false);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thành viên:', error);
        setErrorDetails('Không thể tải thông tin thành viên. Vui lòng thử lại.');
        setLoadingDetails(false);
      }
    };

    if (isOpen && chatInfo) {
      fetchMemberDetails();
    } else {
      setMemberDetails({}); // Clear details when modal is closed
      setLoadingDetails(true);
      setErrorDetails(null);
    }
  }, [isOpen, chatInfo]);

  if (!chatInfo?.participants) {
    return null;
  }

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose} style={styles.modal}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>
          Thành viên ({chatInfo.participants.length || 0})
        </Text>

        {loadingDetails ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e90ff" />
            <Text style={styles.loadingText}>Đang tải thông tin thành viên...</Text>
          </View>
        ) : errorDetails ? (
          <Text style={styles.errorText}>{errorDetails}</Text>
        ) : (
          <FlatList
            data={chatInfo.participants}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <View style={styles.memberItem}>
                <Image
                  source={{
                    uri:
                      memberDetails[item.userId]?.avatar ||
                      'https://encrypted-tbn0.gstatic.com/images?q=tbnpng&s',
                  }}
                  style={styles.avatar}
                />
                <Text style={styles.memberName}>
                  {memberDetails[item.userId]?.name || 'Không tên'}
                </Text>
              </View>
            )}
            style={styles.list}
          />
        )}

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Đóng</Text>
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
    padding: 15,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  list: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberName: {
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
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