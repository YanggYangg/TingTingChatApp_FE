import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Image,
} from "react-native";
import {
  FontAwesome5,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Api_chatInfo } from "../../../../../apis/Api_chatInfo";
import { Api_Profile } from "../../../../../apis/api_profile";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (conversationIds: string[], content?: string) => void;
  messageToForward?: string;
  userId?: string;
  messageId?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
  messageToForward,
  userId,
  messageId,
}) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConversations, setFilteredConversations] = useState([]);

  useEffect(() => {
    console.log("ShareModal opened: with userId", userId);
    if (!isOpen || !userId) return;

    const fetchConversations = async () => {
      setLoading(true);
      setError(null);

      if (!userId) {
        setError("Không có userId để lấy danh sách cuộc trò chuyện.");
        setLoading(false);
        return;
      }

      try {
        const response = await Api_chatInfo.getConversationById(userId);
        console.log("Full response from getAllConversations:", response);
        setConversations(response || []);
        console.log("Fetched conversations:", response);

        const userIds = new Set();
        response.forEach((conv) => {
          if (!conv.isGroup) {
            const otherParticipant = conv.participants.find(
              (p) => p.userId !== userId
            );
            if (otherParticipant) {
              userIds.add(otherParticipant.userId);
            }
          }
        });

        const userPromises = Array.from(userIds).map(async (id) => {
          try {
            const userResponse = await Api_Profile.getProfile(id);
            console.log("Fetched user profile:", userResponse);
            return {
              id,
              firstname:
                userResponse?.data?.user?.firstname +
                " " +
                userResponse?.data?.user?.surname,
            };
          } catch (err) {
            console.error(`Error fetching profile for user ${id}:`, err);
            return { id, firstname: "Người dùng không xác định" };
          }
        });

        const users = await Promise.all(userPromises);
        const userMap = users.reduce((acc, user) => {
          acc[user.id] = user.firstname;
          return acc;
        }, {});
        setUserCache(userMap);
      } catch (err: any) {
        console.error("Error fetching conversations:", err);
        setError(
          err?.response?.data?.message ||
            "Không thể tải danh sách cuộc trò chuyện. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isOpen, userId]);

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  useEffect(() => {
    const filtered = conversations.filter((conv) => {
      const name = getConversationName(conv).toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
    setFilteredConversations(filtered);
  }, [conversations, searchTerm, userCache, userId]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleRemoveSelectedConversation = (conversationId: string) => {
    setSelectedConversations((prev) => prev.filter((id) => id !== conversationId));
  };

  const handleShare = async () => {
    if (selectedConversations.length === 0) {
      alert("Vui lòng chọn ít nhất một cuộc trò chuyện để chia sẻ.");
      return;
    }

    if (!userId) {
      setError("Không có userId để chuyển tiếp tin nhắn.");
      return;
    }

    if (!messageId) {
      setError("Không có messageId để chuyển tiếp tin nhắn.");
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

      console.log("Forwarding message with data:", data);

      const response = await Api_chatInfo.forwardMessage(data);
      console.log("Forwarded messages:", response);
      alert("Chuyển tiếp tin nhắn thành công!");
      onShare(selectedConversations, content);
      onClose();
    } catch (err: any) {
      console.error("Error forwarding message:", err);
      setError(
        err?.response?.data?.message ||
          "Không thể chuyển tiếp tin nhắn. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const getConversationName = (conversation: any): string => {
    if (conversation.name) {
      return conversation.name;
    }
    if (!conversation.isGroup && conversation.participants) {
      const otherParticipant = conversation.participants.find(
        (p: any) => p.userId !== userId
      );
      return userCache[otherParticipant?.userId] || "Người dùng không xác định";
    }
    return "Cuộc trò chuyện không có tên";
  };

  const getConversationImage = (conversation: any): string | null => {
    if (conversation.imageGroup) {
      return conversation.imageGroup;
    }
    if (!conversation.isGroup && conversation.participants) {
      return null;
    }
    return null;
  };

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      key={item._id}
      style={[
        styles.conversationItem,
        selectedConversations.includes(item._id) && styles.selectedConversation,
      ]}
      onPress={() => handleSelectConversation(item._id)}
    >
      <View style={styles.avatarContainer}>
        {getConversationImage(item) ? (
          <Image
            source={{ uri: getConversationImage(item) as string }}
            style={styles.avatar}
          />
        ) : item.isGroup ? (
          <FontAwesome5 name="users" size={24} color="#777" />
        ) : (
          <Feather name="user" size={24} color="#777" />
        )}
        {selectedConversations.includes(item._id) && (
          <View style={styles.checkIconContainer}>
            <Ionicons name="checkmark-circle" size={20} color="green" />
          </View>
        )}
      </View>
      <Text style={styles.conversationName}>{getConversationName(item)}</Text>
    </TouchableOpacity>
  );

  const renderSelectedItem = ({ item }: { item: string }) => {
    const conversation = conversations.find((c: any) => c._id === item);
    if (!conversation) return null;
    return (
      <View style={styles.selectedItem}>
        <View style={styles.avatarContainerSmall}>
          {getConversationImage(conversation) ? (
            <Image
              source={{ uri: getConversationImage(conversation) as string }}
              style={styles.avatarSmall}
            />
          ) : conversation.isGroup ? (
            <FontAwesome5 name="users" size={18} color="#777" />
          ) : (
            <Feather name="user" size={18} color="#777" />
          )}
        </View>
        <Text style={styles.selectedName}>
          {getConversationName(conversation)}
        </Text>
        <TouchableOpacity onPress={() => handleRemoveSelectedConversation(item)}>
          <MaterialIcons name="delete-outline" size={20} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chia sẻ</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="gray" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChangeText={handleSearch}
            />
          </View>

          <View style={styles.listsContainer}>
            <View style={styles.leftColumn}>
              <Text style={styles.listTitle}>Chọn</Text>
              {loading ? (
                <Text style={styles.loadingText}>Đang tải...</Text>
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : filteredConversations.length === 0 ? (
                <Text style={styles.emptyText}>
                  Không có cuộc trò chuyện nào phù hợp.
                </Text>
              ) : (
                <FlatList
                  data={filteredConversations}
                  keyExtractor={(item: any) => item._id}
                  renderItem={renderConversationItem}
                  style={styles.conversationList}
                />
              )}
            </View>

            <View style={styles.rightColumn}>
              <Text style={styles.listTitle}>Đã chọn</Text>
              {selectedConversations.length === 0 ? (
                <Text style={styles.emptySelection}>Chưa chọn.</Text>
              ) : (
                <FlatList
                  data={selectedConversations}
                  keyExtractor={(item) => item}
                  renderItem={renderSelectedItem}
                  style={styles.selectedList}
                />
              )}
            </View>
          </View>

          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Thêm ghi chú (tùy chọn)</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              placeholder="Nhập tin nhắn..."
              value={content}
              onChangeText={(text) => setContent(text)}
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.shareButton,
                loading || selectedConversations.length === 0
                  ? styles.disabledButton
                  : {},
              ]}
              onPress={handleShare}
              disabled={loading || selectedConversations.length === 0}
            >
              <Text style={styles.shareButtonText}>
                {loading ? "Đang chia sẻ..." : "Chia sẻ"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  listsContainer: {
    flexDirection: "row",
    height: 250,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 5,
    marginBottom: 15,
    overflow: "hidden",
  },
  leftColumn: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  rightColumn: {
    flex: 1,
    padding: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "semibold",
    color: "#555",
    marginBottom: 5,
  },
  conversationList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  selectedConversation: {
    backgroundColor: "#f0f8ff",
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ddd",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  conversationName: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  checkIconContainer: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "white",
    borderRadius: 10,
  },
  selectedList: {
    flex: 1,
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    marginBottom: 5,
  },
  avatarContainerSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ddd",
    marginRight: 8,
  },
  avatarSmall: {
    width: "100%",
    height: "100%",
  },
  selectedName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  noteContainer: {
    marginBottom: 15,
  },
  noteLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  noteInput: {
    height: 60,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  cancelButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#555",
    fontSize: 16,
  },
  shareButton: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  shareButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  loadingText: {
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 10,
  },
  emptySelection: {
    color: "#777",
  },
});

export default ShareModal;