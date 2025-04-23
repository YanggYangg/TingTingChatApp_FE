import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';
import { Api_Profile } from '../../../../../apis/api_profile';

const { width, height } = Dimensions.get('window');

const ShareModal = ({ isOpen, onClose, onShare, userId, messageId }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchConversations = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await Api_chatInfo.getConversationById(userId);
        setConversations(response || []);

        const userIds = new Set();
        response.forEach((conv) => {
          if (!conv.isGroup) {
            const otherParticipant = conv.participants.find((p) => p.userId !== userId);
            if (otherParticipant) userIds.add(otherParticipant.userId);
          }
        });

        const userPromises = Array.from(userIds).map(async (id) => {
          try {
            const userResponse = await Api_Profile.getProfile(id);
            return {
              id,
              firstname: `${userResponse?.data?.user?.firstname} ${userResponse?.data?.user?.surname}`,
            };
          } catch (err) {
            return { id, firstname: 'Người dùng không xác định' };
          }
        });

        const users = await Promise.all(userPromises);
        const userMap = users.reduce((acc, user) => {
          acc[user.id] = user.firstname;
          return acc;
        }, {});
        setUserCache(userMap);
      } catch (err) {
        setError('Không thể tải danh sách cuộc trò chuyện.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isOpen, userId]);

  const handleSearch = useCallback((text) => {
    setSearchTerm(text);
  }, []);

  useEffect(() => {
    const filtered = conversations.filter((conv) => {
      const name = getConversationName(conv).toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
    setFilteredConversations(filtered);
  }, [conversations, searchTerm, userCache, userId]);

  const handleSelectConversation = (conversationId) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleRemoveSelectedConversation = (conversationId) => {
    setSelectedConversations((prev) => prev.filter((id) => id !== conversationId));
  };

  const handleShare = async () => {
    if (selectedConversations.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một cuộc trò chuyện.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = {
        messageId: [messageId],
        targetConversationIds: selectedConversations,
        userId,
        content: content.trim() || undefined,
      };

      await Api_chatInfo.forwardMessage(data);
      Alert.alert('Thành công', 'Chuyển tiếp tin nhắn thành công!');
      onShare(selectedConversations, content);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể chuyển tiếp tin nhắn.');
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể chuyển tiếp tin nhắn.');
    } finally {
      setLoading(false);
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.name) return conversation.name;
    if (!conversation.isGroup && conversation.participants) {
      const otherParticipant = conversation.participants.find((p) => p.userId !== userId);
      return userCache[otherParticipant?.userId] || 'Người dùng không xác định';
    }
    return 'Cuộc trò chuyện không có tên';
  };

  const getConversationImage = (conversation) => {
    if (conversation.imageGroup) return conversation.imageGroup;
    return null;
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Chia sẻ</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Icon name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={16} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChangeText={handleSearch}
                autoCapitalize="none"
              />
            </View>

            {/* Selected Conversations */}
            {selectedConversations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Đã chọn</Text>
                <View style={styles.selectedContainer}>
                  {selectedConversations.map((convId) => {
                    const conversation = conversations.find((c) => c._id === convId);
                    if (!conversation) return null;
                    return (
                      <View key={convId} style={styles.selectedItem}>
                        <View style={styles.avatar}>
                          {getConversationImage(conversation) ? (
                            <Image
                              source={{ uri: getConversationImage(conversation) }}
                              style={styles.avatarImage}
                            />
                          ) : conversation.isGroup ? (
                            <Icon name="users" size={16} color="#666" />
                          ) : (
                            <Icon name="user" size={16} color="#666" />
                          )}
                        </View>
                        <Text style={styles.selectedText} numberOfLines={1}>
                          {getConversationName(conversation)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveSelectedConversation(convId)}
                          style={styles.removeButton}
                        >
                          <Icon name="trash" size={14} color="#e53e3e" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Conversation List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chọn cuộc trò chuyện</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#4f46e5" style={styles.loader} />
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : filteredConversations.length === 0 ? (
                <Text style={styles.emptyText}>Không có cuộc trò chuyện nào phù hợp.</Text>
              ) : (
                <View>
                  {filteredConversations.map((conversation) => (
                    <TouchableOpacity
                      key={conversation._id}
                      style={[
                        styles.conversationItem,
                        selectedConversations.includes(conversation._id) && styles.selectedConversation,
                      ]}
                      onPress={() => handleSelectConversation(conversation._id)}
                    >
                      <View style={styles.avatar}>
                        {getConversationImage(conversation) ? (
                          <Image
                            source={{ uri: getConversationImage(conversation) }}
                            style={styles.avatarImage}
                          />
                        ) : conversation.isGroup ? (
                          <Icon name="users" size={20} color="#666" />
                        ) : (
                          <Icon name="user" size={20} color="#666" />
                        )}
                        {selectedConversations.includes(conversation._id) && (
                          <View style={styles.checkIcon}>
                            <Icon name="check" size={12} color="#fff" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.conversationText} numberOfLines={1}>
                        {getConversationName(conversation)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.noteLabel}>Thêm ghi chú (tùy chọn)</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={2}
              placeholder="Nhập tin nhắn..."
              value={content}
              onChangeText={setContent}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.shareButton,
                  (loading || selectedConversations.length === 0) && styles.disabledButton,
                ]}
                onPress={handleShare}
                disabled={loading || selectedConversations.length === 0}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Đang chia sẻ...' : 'Chia sẻ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  body: {
    flex: 1,
    padding: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    color: '#111',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 6,
    maxWidth: width * 0.4,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    marginRight: 6,
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 12,
    color: '#111',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedConversation: {
    backgroundColor: '#e0e7ff',
  },
  conversationText: {
    fontSize: 14,
    color: '#111',
    flex: 1,
  },
  checkIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 12,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  noteLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#111',
    marginBottom: 12,
    minHeight: 60,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  shareButton: {
    backgroundColor: '#4f46e5',
  },
  disabledButton: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default ShareModal;