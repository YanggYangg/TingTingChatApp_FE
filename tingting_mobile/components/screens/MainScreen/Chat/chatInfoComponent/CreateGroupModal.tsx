import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Api_FriendRequest } from '../../../../../apis/api_friendRequest';
import { Api_Profile } from '../../../../../apis/api_profile';
import {
  onError,
  offError,
} from '../../../../../services/sockets/events/chatInfo';

// Define types
interface Contact {
  id: string;
  name: string;
  avatar: string;
}

interface GroupData {
  name: string;
  participants: { userId: string; role: 'admin' | 'member' }[];
  isGroup: boolean;
  imageGroup: string;
  mute: null;
  isHidden: boolean;
  isPinned: boolean;
  pin: null;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (data: any) => void;
  userId: string;
  socket: any; // Replace with proper Socket.IO type if available
  currentConversationParticipants?: string[];
}

const { width } = Dimensions.get('window');

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
  userId,
  socket,
  currentConversationParticipants = [],
}) => {
  const [groupName, setGroupName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [defaultMembers, setDefaultMembers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;

  // Optimize handleContactSelect with useCallback
  const handleContactSelect = useCallback((contact: Contact) => {
    setSelectedContacts((prevContacts) => {
      if (prevContacts.some((c) => c.id === contact.id)) {
        return prevContacts.filter((c) => c.id !== contact.id);
      }
      return [...prevContacts, contact];
    });
  }, []);

  // Handle removing a selected contact
  const handleRemoveSelectedContact = useCallback((contactToRemove: Contact) => {
    setSelectedContacts((prevContacts) =>
      prevContacts.filter((contact) => contact.id !== contactToRemove.id)
    );
  }, []);

  // Fetch friends list and default members when modal opens
  useEffect(() => {
    if (!isOpen || !userId) {
      setContacts([]);
      setDefaultMembers([]);
      setSelectedContacts([]);
      setSearchQuery('');
      setGroupName('');
      setError(null);
      setRetryCount(0);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Debug logging
        console.log('Current conversation participants:', currentConversationParticipants);

        // Fetch current user's profile
        const userResponse = await Api_Profile.getProfile(userId);
        const userData = userResponse?.data?.user;
        if (!userData) {
          throw new Error('Không thể tải thông tin người dùng.');
        }

        // Fetch friends list
        const friendsResponse = await Api_FriendRequest.getFriendsList(userId);
        const friendsList = Array.isArray(friendsResponse.data)
          ? friendsResponse.data
          : [];

        const formattedContacts: Contact[] = friendsList
          .filter((friend: any) => friend._id !== userId)
          .map((friend: any) => ({
            id: friend._id,
            name:
              friend.name ||
              `${friend.firstname || ''} ${friend.surname || ''}`.trim() ||
              'Không tên',
            avatar:
              friend.avatar ||
              'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
          }));

        // Create default members list (only current user)
        const defaultMembersList: Contact[] = [
          {
            id: userId,
            name:
              userData.name ||
              `${userData.firstname || ''} ${userData.surname || ''}`.trim() ||
              'Bạn',
            avatar:
              userData.avatar ||
              'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
          },
        ];

        // Add participants from currentConversationParticipants to selectedContacts
        const autoSelectedContacts: Contact[] = [];
        for (const participantId of currentConversationParticipants) {
          if (participantId !== userId) {
            try {
              const participantResponse = await Api_Profile.getProfile(participantId);
              const participantData = participantResponse?.data?.user;
              const participantContact: Contact = {
                id: participantId,
                name:
                  participantData?.name ||
                  `${participantData?.firstname || ''} ${
                    participantData?.surname || ''
                  }`.trim() ||
                  'Không xác định',
                avatar:
                  participantData?.avatar ||
                  'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
              };
              autoSelectedContacts.push(participantContact);
            } catch (err) {
              console.error(`Lỗi khi lấy thông tin người dùng ${participantId}:`, err);
              autoSelectedContacts.push({
                id: participantId,
                name: 'Không xác định',
                avatar: 'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
              });
            }
          }
        }

        console.log('Default members:', defaultMembersList);
        console.log('Auto-selected contacts:', autoSelectedContacts);
        console.log('Formatted contacts:', formattedContacts);

        setDefaultMembers(defaultMembersList);
        setContacts(formattedContacts);
        setSelectedContacts(autoSelectedContacts);
        setRetryCount(0);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => fetchData(), 2000);
        } else {
          setError('Không thể tải danh sách bạn bè. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, userId, currentConversationParticipants, retryCount]);

  // Listen for Socket.IO errors
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleSocketError = (error: any) => {
      console.log('Socket error received:', error);
      setError(error.message || 'Có lỗi xảy ra khi tạo nhóm.');
      setCreateLoading(false);
    };

    onError(socket, handleSocketError);

    return () => {
      offError(socket);
    };
  }, [socket, isOpen]);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create group using Socket.IO
  const handleCreateGroup = async () => {
    const allParticipants = [...defaultMembers, ...selectedContacts];

    if (allParticipants.length < 3) {
      setError('Nhóm phải có ít nhất 3 thành viên (bao gồm bạn).');
      return;
    }

    if (!socket) {
      setError('Không có kết nối với server. Vui lòng thử lại.');
      setCreateLoading(false);
      return;
    }

    setCreateLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Generate default group name if not provided
    let actualGroupName = groupName.trim();
    if (!actualGroupName) {
      try {
        const creatorProfile = await Api_Profile.getProfile(userId);
        const creatorName = creatorProfile?.data?.user
          ? `${creatorProfile.data.user.firstname || ''} ${
              creatorProfile.data.user.surname || ''
            }`.trim()
          : 'Bạn';
        const memberNames = [
          creatorName,
          ...allParticipants
            .filter((contact) => contact.id !== userId)
            .map((contact) => contact.name),
        ];
        actualGroupName = memberNames.join(', ');
        if (actualGroupName.length > 100) {
          actualGroupName = actualGroupName.substring(0, 97) + '...';
        }
      } catch (err) {
        console.error('Lỗi khi lấy profile người tạo:', err);
        actualGroupName = 'Nhóm không tên';
      }
    }

    const groupData: GroupData = {
      name: actualGroupName,
      participants: allParticipants.map((contact) => ({
        userId: contact.id,
        role: contact.id === userId ? 'admin' : 'member',
      })),
      isGroup: true,
      imageGroup:
       "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A1o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=",
      mute: null,
      isHidden: false,
      isPinned: false,
      pin: null,
    };

    const timeout = setTimeout(() => {
      setError('Tạo nhóm thất bại: Server không phản hồi.');
      setCreateLoading(false);
    }, 5000);

    socket.emit('createConversation', groupData, (response: any) => {
      clearTimeout(timeout);
      console.log('Create conversation response:', response);
      try {
        if (response && response.success) {
          // if (typeof window.showToast === 'function') {
          //   // window.showToast('Tạo nhóm thành công!', 'success');
          // } else {
          //   console.warn('window.showToast is not defined, falling back to alert');
          //   // alert('Tạo nhóm thành công!');
          // }

          setGroupName('');
          setSelectedContacts([]);
          if (onGroupCreated) {
            onGroupCreated(response.data);
          }
          // setSuccessMessage('Tạo nhóm thành công!');
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
          }, 1500);
        } else {
          setError(response?.message || 'Không thể tạo nhóm.');
        }
      } catch (err) {
        console.error('Error in socket callback:', err);
        setError('Lỗi không xác định khi tạo nhóm.');
      } finally {
        setCreateLoading(false);
      }
    });
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactSelect(item)}
    >
      <View style={styles.checkbox}>
        {selectedContacts.some((c) => c.id === item.id) && (
          <Ionicons name="checkmark" size={16} color="#3B82F6" />
        )}
      </View>
      <Image
        source={{ uri: item.avatar }}
        style={styles.avatar}
        resizeMode="cover"
      />
      <Text style={styles.contactName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderSelectedContactItem = ({ item }: { item: Contact }) => (
    <View style={styles.selectedContactItem}>
      <Text style={styles.selectedContactName}>
        {currentConversationParticipants.includes(item.id) ? `${item.name} ` : item.name}
      </Text>
      <TouchableOpacity onPress={() => handleRemoveSelectedContact(item)}>
        <Ionicons name="close" size={16} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  const renderDefaultMemberItem = ({ item }: { item: Contact }) => (
    <View style={styles.selectedContactItem}>
      <Text style={styles.selectedContactName}>
        {item.id === userId ? `${item.name} (Bạn)` : item.name}
      </Text>
    </View>
  );

  if (!isOpen) {
    return null;
  }

  const allParticipants = [...defaultMembers, ...selectedContacts];

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tạo nhóm</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Group Name Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="camera-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập tên nhóm (tùy chọn)..."
                placeholderTextColor="#9CA3AF"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            {/* Search Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tìm kiếm bạn bè..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Contacts and Selected Members */}
            <View style={styles.listsContainer}>
              {/* Friends List */}
              <View style={styles.friendsList}>
                <Text style={styles.listTitle}>Danh sách bạn bè</Text>
                {loading && <ActivityIndicator size="small" color="#3B82F6" />}
                {error && <Text style={styles.errorText}>{error}</Text>}
                {!loading && !error && filteredContacts.length === 0 && (
                  <Text style={styles.emptyText}>Không tìm thấy bạn bè.</Text>
                )}
                {!loading && filteredContacts.length > 0 && (
                  <FlatList
                    data={filteredContacts}
                    renderItem={renderContactItem}
                    keyExtractor={(item) => item.id}
                    style={styles.flatList}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>

              {/* Selected Members List */}
              <View style={styles.selectedList}>
                <Text style={styles.listTitle}>
                  Thành viên ({allParticipants.length}/100)
                </Text>
                <FlatList
                  data={[...defaultMembers, ...selectedContacts]}
                  renderItem={({ item }) =>
                    defaultMembers.some((m) => m.id === item.id)
                      ? renderDefaultMemberItem({ item })
                      : renderSelectedContactItem({ item })
                  }
                  keyExtractor={(item) => item.id}
                  style={styles.flatList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>

            {/* Error/Success Messages */}
            {error && <Text style={styles.errorText}>{error}</Text>}
            {successMessage && <Text style={styles.successText}>{successMessage}</Text>}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                (createLoading || allParticipants.length < 3) && styles.createButtonDisabled,
              ]}
              onPress={handleCreateGroup}
              disabled={createLoading || allParticipants.length < 3}
            >
              <Text style={styles.createButtonText}>
                {createLoading ? 'Đang tạo...' : 'Tạo nhóm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  listsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  friendsList: {
    flex: 1,
    maxHeight: 200,
    marginRight: 8,
  },
  selectedList: {
    width: 140,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  flatList: {
    flexGrow: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  contactName: {
    fontSize: 14,
    color: '#1F2937',
  },
  selectedContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  selectedContactName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
  },
  successText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  createButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    marginLeft: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  createButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default CreateGroupModal;