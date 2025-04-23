import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Api_FriendRequest } from '../../../../../apis/api_friendRequest';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';
import { Api_Profile } from '../../../../../apis/api_profile';

interface Contact {
  id: string;
  name: string;
  avatar: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onGroupCreated: (group: any) => void;
  currentConversationParticipants?: string[];
}

const CreateGroupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userId,
  onGroupCreated,
  currentConversationParticipants = [],
}) => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [defaultMembers, setDefaultMembers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!isOpen || !userId) {
      setContacts([]);
      setDefaultMembers([]);
      setSelectedContacts([]);
      setSearchQuery('');
      setError('');
      setRetryCount(0);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch current user's profile
        const userResponse = await Api_Profile.getProfile(userId);
        const userData = userResponse?.data?.user;
        if (!userData) {
          throw new Error('Không thể tải thông tin người dùng.');
        }

        // Fetch friends list
        const friendsResponse = await Api_FriendRequest.getFriendsList(userId);
        console.log('API response.data tạo nhóm:', friendsResponse);
        const friendsList = Array.isArray(friendsResponse.data.data) ? friendsResponse.data.data : [];

        const formattedContacts = friendsList
          .filter((friend) => friend._id !== userId && !currentConversationParticipants.includes(friend._id))
          .map((friend) => ({
            id: friend._id,
            name: friend.name || 'Không tên',
            avatar: friend.avatar || 'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
          }));

        // Fetch profiles for conversation participants
        const defaultMembersList: Contact[] = [
          {
            id: userId,
            name: userData.name || `${userData.firstname} ${userData.surname}`.trim() || 'Bạn',
            avatar: userData.avatar || 'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
          },
        ];

        for (const participantId of currentConversationParticipants) {
          if (participantId !== userId) {
            try {
              const participantResponse = await Api_Profile.getProfile(participantId);
              const participantData = participantResponse?.data?.user;
              defaultMembersList.push({
                id: participantId,
                name: participantData?.name || `${participantData?.firstname} ${participantData?.surname}`.trim() || 'Không xác định',
                avatar: participantData?.avatar || 'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
              });
            } catch (err) {
              console.error(`Lỗi khi lấy thông tin người dùng ${participantId}:`, err);
              defaultMembersList.push({
                id: participantId,
                name: 'Không xác định',
                avatar: 'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
              });
            }
          }
        }

        setDefaultMembers(defaultMembersList);
        setContacts(formattedContacts);
        setRetryCount(0);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => fetchData(), 2000); // Retry after 2 seconds
        } else {
          setError('Không thể tải danh sách bạn bè hoặc thông tin người dùng do lỗi mạng. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, userId, currentConversationParticipants, retryCount]);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSelect = (contact: Contact) => {
    if (selectedContacts.some((c) => c.id === contact.id)) {
      setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id));
    } else {
      setSelectedContacts((prev) => [...prev, contact]);
    }
  };

  const handleRemoveSelectedContact = (contact: Contact) => {
    setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id));
  };

  const handleCreateGroup = async () => {
    // Include default members (current user + conversation participants) and selected contacts
    const allParticipants = [...defaultMembers, ...selectedContacts];

    if (allParticipants.length < 3) {
      setError('Nhóm phải có ít nhất 3 thành viên (bao gồm bạn và người trong cuộc trò chuyện).');
      return;
    }

    const actualGroupName = groupName.trim() === '' ? 'Nhóm không tên' : groupName.trim();

    setCreateLoading(true);
    setError('');
    setSuccessMessage(null);

    try {
      const participants = allParticipants.map((contact) => ({
        userId: contact.id,
        role: contact.id === userId ? 'admin' : 'member',
      }));

      const groupData = {
        name: actualGroupName,
        participants,
        isGroup: true,
        imageGroup:
          'https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A0o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=',
        mute: null,
        isHidden: false,
        isPinned: false,
        pin: null,
      };

      console.log('Group data:', groupData);
      const response = await Api_chatInfo.createConversation(groupData);
      if (response && response.success) {
        setGroupName('');
        setSelectedContacts([]);
        onGroupCreated(response.data.data);
        setSuccessMessage('Tạo nhóm thành công!');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2000);
      } else {
        throw new Error(response?.message || 'Không thể tạo nhóm.');
      }
    } catch (err) {
      console.error('Lỗi khi tạo nhóm:', err);
      setError(err.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
    } finally {
      setCreateLoading(false);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => handleContactSelect(item)}>
      <View style={styles.checkbox}>
        {selectedContacts.some((c) => c.id === item.id) && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </View>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <Text style={styles.contactName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderSelectedContact = ({ item }: { item: Contact }) => (
    <View style={styles.selectedContact}>
      <Text style={styles.selectedContactName}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleRemoveSelectedContact(item)}>
        <Ionicons name="close" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderDefaultMember = ({ item }: { item: Contact }) => (
    <View style={styles.selectedContact}>
      <Text style={styles.selectedContactName}>
        {item.id === userId ? `${item.name} (Bạn)` : item.name}
      </Text>
      <Text style={styles.defaultTag}>Bắt buộc</Text>
    </View>
  );

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose} style={styles.modal}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tạo nhóm</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="camera-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            placeholder="Nhập tên nhóm (tùy chọn)..."
            style={styles.input}
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            placeholder="Tìm kiếm bạn bè..."
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.contacts}>
            <Text style={styles.sectionTitle}>Danh sách bạn bè</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#1e90ff" style={styles.loader} />
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => setRetryCount(0)}>
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : filteredContacts.length === 0 ? (
              <Text style={styles.noResult}>Không tìm thấy bạn bè nào.</Text>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                renderItem={renderContact}
                style={styles.contactList}
              />
            )}
          </View>

          <View style={styles.selected}>
            <Text style={styles.sectionTitle}>Thành viên mặc định</Text>
            <FlatList
              data={defaultMembers}
              keyExtractor={(item) => item.id}
              renderItem={renderDefaultMember}
              style={styles.selectedList}
            />
            <Text style={styles.sectionTitle}>
              Đã chọn ({selectedContacts.length}/100)
            </Text>
            <FlatList
              data={selectedContacts}
              keyExtractor={(item) => item.id}
              renderItem={renderSelectedContact}
              style={styles.selectedList}
            />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {successMessage && <Text style={styles.success}>{successMessage}</Text>}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.createButton,
              (createLoading || defaultMembers.length + selectedContacts.length < 3) &&
                styles.disabledButton,
            ]}
            onPress={handleCreateGroup}
            disabled={createLoading || defaultMembers.length + selectedContacts.length < 3}
          >
            <Text style={styles.createButtonText}>
              {createLoading ? 'Đang tạo...' : 'Tạo nhóm'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  icon: {
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    padding: 10,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contacts: {
    flex: 1,
    marginRight: 10,
  },
  selected: {
    width: 150,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  contactList: {
    maxHeight: 200,
  },
  selectedList: {
    maxHeight: 200,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#1e90ff',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  contactName: {
    fontSize: 14,
  },
  selectedContact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 5,
    marginBottom: 5,
  },
  selectedContactName: {
    flex: 1,
    fontSize: 12,
  },
  defaultTag: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  noResult: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  loader: {
    marginVertical: 20,
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginVertical: 10,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  retryButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default CreateGroupModal;