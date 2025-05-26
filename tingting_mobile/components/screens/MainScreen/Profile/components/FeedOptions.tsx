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
import { EyeOff, Trash2, Flag, X } from "lucide-react-native";
import axios from "axios";

type PostOption = {
  id: string;
  title: string;
  icon: React.ReactNode;
  action: () => void;
};

const FeedOptions = ({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) => {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const postId = route.params?.postId;
  const profileId = route.params?.profileId;

  const handleDeletePost = () => {
    setDeleteModalVisible(true);
  };
  const handleReportPost = () => {
    setReportModalVisible(true);
  };

  // Hàm ẩn bài đăng
  const confirmDeletePost = async () => {
    try {
      if (!postId || !profileId) {
        console.error("Missing postId or profileId");
        return;
      }

      const res = await axios.post(
        `http://192.168.223.71:3006/api/v1/post/hide`,
        {
          postId,
          profileId,
          reason: "manual", // hoặc lý do khác nếu có
        }
      );

      setDeleteModalVisible(false);
      console.log("Response from hide post:", res.data);

      if (res.status === 200) {
        Alert.alert("Ẩn bài đăng thành công");
      } else {
        Alert.alert("Ẩn bài đăng không thành công");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error hiding post:", error);
      Alert.alert("Đã xảy ra lỗi khi ẩn bài đăng");
    }
  };

  // Hàm báo cáo bài đăng
  const confirmReportPost = async () => {
    try {
      if (!postId || !profileId) {
        console.error("Missing postId or profileId");
        return;
      }

      const res = await axios.post(
        `http://192.168.223.71:3006/api/v1/post/hide`, // Đảm bảo backend có route này
        {
          postId,
          profileId,
          reason: "report", // hoặc cho người dùng chọn lý do
        }
      );

      setDeleteModalVisible(false);

      if (res.status === 200) {
        Alert.alert("Báo cáo bài đăng thành công");
      } else {
        Alert.alert("Báo cáo bài đăng không thành công");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error reporting post:", error);
      Alert.alert("Đã xảy ra lỗi khi báo cáo bài đăng");
    }
  };

  const postOptions: PostOption[] = [
    {
      id: "delete_post",
      title: "Ẩn bài đăng",
      icon: <EyeOff size={22} color="#ff3b30" />,
      action: handleDeletePost,
    },
    {
      id: "report_post",
      title: "Báo cáo bài đăng",
      icon: <Flag size={22} />,
      action: handleReportPost,
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
                <Text style={styles.deleteButtonText}>Ẩn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Report Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Báo cáo bài đăng?</Text>
            <Text style={styles.modalDescription}>
              Bạn có chắc chắn muốn báo cáo bài đăng này không? Hành động này
              không thể hoàn tác.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setReportModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmReportPost}
              >
                <Text style={styles.deleteButtonText}>Báo cáo</Text>
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

export default FeedOptions;
