"use client";

import type React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  StatusBar,
  Alert,
} from "react-native";
import { Edit, Trash2, Eye, X } from "lucide-react-native";
import axios from "axios";

type PostOption = {
  id: string;
  title: string;
  icon: React.ReactNode;
  action: () => void;
};

const PostOptions = ({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) => {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const postId = route.params?.postId;

  const handleEditPrivacy = () => {
    navigation.navigate("PrivacySettings", { postId });
  };

  const handleEditPost = () => {
    // Navigate to edit post screen
    console.log("Navigate to edit post screen");
  };

  const handleDeletePost = () => {
    setDeleteModalVisible(true);
  };

  const confirmDeletePost = async () => {
    try {
      if (!postId) {
        console.error("Missing postId");
        return;
      }

      const res = await axios.delete(
        `http://192.168.1.171:3006/api/v1/post/${postId}`
      );

      
      setDeleteModalVisible(false);
      if (res.data.success === true) {
       Alert.alert("Xóa bài đăng thành công");
      } else {
        Alert.alert("Xóa bài đăng không thành công");
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const postOptions: PostOption[] = [
    {
      id: "edit_privacy",
      title: "Chỉnh sửa quyền xem",
      icon: <Eye size={22} color="#555" />,
      action: handleEditPrivacy,
    },
    {
      id: "edit_post",
      title: "Chỉnh sửa bài đăng",
      icon: <Edit size={22} color="#555" />,
      action: handleEditPost,
    },
    {
      id: "delete_post",
      title: "Xóa bài đăng",
      icon: <Trash2 size={22} color="#ff3b30" />,
      action: handleDeletePost,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0088ff" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <X color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tùy chọn bài đăng</Text>
      </View>

      <View style={styles.optionsContainer}>
        {postOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              option.id === "delete_post" && styles.deleteOption,
            ]}
            onPress={option.action}
          >
            <View style={styles.iconContainer}>{option.icon}</View>
            <Text
              style={[
                styles.optionTitle,
                option.id === "delete_post" && styles.deleteText,
              ]}
            >
              {option.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Xóa bài đăng?</Text>
            <Text style={styles.modalDescription}>
              Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không
              thể hoàn tác.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDeletePost}
              >
                <Text style={styles.deleteButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#0088ff",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  optionsContainer: {
    backgroundColor: "#fff",
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 40,
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  deleteText: {
    color: "#ff3b30",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default PostOptions;
