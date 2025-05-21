import React, { useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { setChatInfoUpdate } from "../../../../../redux/slices/chatSlice";

const DEFAULT_GROUP_IMAGE =
  "https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A1o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=";

interface Participant {
  userId: string;
  role?: "admin" | "member";
  isHidden?: boolean;
  mute?: string | null;
  isPinned?: boolean;
}

interface UserGroup {
  _id: string;
  name: string;
  imageGroup?: string;
  participants?: Participant[];
}

interface AddToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGroups: UserGroup[];
  commonGroups: UserGroup[];
  socket: any;
  otherUserId: string;
  currentUserId: string;
  onMemberAdded: (group: UserGroup) => void;
  isLoadingGroups: boolean; // Thêm prop isLoadingGroups
}

const AddToGroupModal: React.FC<AddToGroupModalProps> = ({
  isOpen,
  onClose,
  userGroups,
  commonGroups,
  socket,
  otherUserId,
  currentUserId,
  onMemberAdded,
  isLoadingGroups,
}) => {
  const dispatch = useDispatch();

  const handleSelectGroup = useCallback(
    (group: UserGroup) => {
      if (!socket || !socket.connected) {
        Alert.alert("Lỗi", "Không thể kết nối đến server.");
        return;
      }

      if (!group._id || !otherUserId || !currentUserId) {
        console.warn("Thiếu thông tin bắt buộc:", {
          groupId: group._id,
          otherUserId,
          currentUserId,
        });
        Alert.alert("Lỗi", "Thiếu thông tin nhóm hoặc người dùng.");
        return;
      }

      const isAlreadyMember = commonGroups.some(
        (commonGroup) => commonGroup._id === group._id
      );
      if (isAlreadyMember) {
        Alert.alert(
          "Thông báo",
          `Người dùng đã là thành viên của nhóm ${group.name || "Nhóm không tên"}.`
        );
        return;
      }

      socket.emit(
        "addParticipant",
        {
          conversationId: group._id,
          userId: otherUserId,
          performerId: currentUserId,
          role: "member",
        },
        (response: any) => {
          if (response?.success) {
            onMemberAdded(group);
            dispatch(
              setChatInfoUpdate({
                _id: group._id,
                name: group.name,
                imageGroup: group.imageGroup || DEFAULT_GROUP_IMAGE,
                isGroup: true,
                participants: response.data?.participants || group.participants || [],
                updatedAt: new Date().toISOString(),
              })
            );
            Alert.alert(
              "Thành công",
              `Đã thêm thành viên vào nhóm ${group.name || "Nhóm không tên"}`
            );
          } else {
            Alert.alert(
              "Lỗi",
              `Thêm thành viên thất bại: ${response?.message || "Lỗi không xác định"}`
            );
          }
        }
      );
      onClose();
    },
    [socket, otherUserId, currentUserId, commonGroups, onMemberAdded, dispatch, onClose]
  );

  return (
    <Modal isVisible={isOpen} onBackdropPress={onClose} style={styles.modal}>
      <View style={styles.modalContainer}>
        <View style={styles.modalTitleContainer}>
          <Ionicons
            name="person-add-outline"
            size={24}
            color="#1e90ff"
            style={styles.modalTitleIcon}
          />
          <Text style={styles.modalTitle}>Thêm vào nhóm</Text>
        </View>
        {isLoadingGroups ? (
          <Text style={styles.noGroupsText}>Đang tải danh sách nhóm...</Text>
        ) : userGroups.length === 0 ? (
          <Text style={styles.noGroupsText}>Bạn chưa tham gia nhóm nào.</Text>
        ) : (
          <ScrollView style={styles.list}>
            {userGroups.map((group) => {
              const isCommonGroup = commonGroups.some(
                (commonGroup) => commonGroup._id === group._id
              );
              return (
                <TouchableOpacity
                  key={group._id}
                  style={[styles.groupItem, isCommonGroup && styles.groupItemDisabled]}
                  onPress={() => !isCommonGroup && handleSelectGroup(group)}
                  disabled={isCommonGroup}
                >
                  <Image
                    source={{ uri: group.imageGroup || DEFAULT_GROUP_IMAGE }}
                    style={styles.groupImage}
                  />
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>
                      {group.name || "Nhóm không tên"}
                    </Text>
                    {isCommonGroup && (
                      <View style={styles.joinedContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#1e90ff"
                          style={styles.joinedIcon}
                        />
                        <Text style={styles.joinedText}>Đã tham gia</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <TouchableOpacity onPress={onClose} style={styles.closeIconWrapper}>
          <Ionicons name="close-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "center",
    margin: 15,
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitleIcon: {
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2023",
  },
  list: {
    maxHeight: 350,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 5,
  },
  groupItemDisabled: {
    backgroundColor: "#f8f9fa",
    opacity: 0.6,
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  groupInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  joinedContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  joinedIcon: {
    marginRight: 5,
  },
  joinedText: {
    fontSize: 14,
    color: "#1e90ff",
    fontWeight: "500",
  },
  noGroupsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  closeIconWrapper: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AddToGroupModal;