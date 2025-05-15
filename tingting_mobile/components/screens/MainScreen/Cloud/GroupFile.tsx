import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import axios from "axios";

interface Message {
  messageId: string;
  fileUrls?: string[];
  filenames?: string[];
  timestamp: string;
}

interface File {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  linkURL: string;
}

interface Props {
  userId: string;
}

const GroupFile: React.FC<Props> = ({ userId }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://192.168.26.108:3000/api/messages/user/${userId}`
        );
        const messages: Message[] = response.data.sort(
          (a: Message, b: Message) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        console.log("Messages:", response);

        const fileMessages = messages
          .filter((msg) => {
            return (
              msg.fileUrls &&
              msg.filenames &&
              !msg.fileUrls.some((url) =>
                /\.(jpg|jpeg|png|gif|mp4|webm)$/i.test(url)
              )
            );
          })
          .map((msg) => ({
            id: msg.messageId,
            name: msg.filenames?.[0] || "Không có tên",
            size: "N/A", // Có thể thêm logic lấy size từ API nếu có
            uploadedAt: new Date(msg.timestamp).toISOString(),
            linkURL: msg.fileUrls?.[0] || "",
          }));
        setFiles(fileMessages);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách file:", err);
        setError("Không thể tải danh sách file. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [userId]);

  const getMimeTypeFromExtension = (fileName: string): string | null => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "doc":
        return "application/msword";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "pdf":
        return "application/pdf";
      case "ppt":
        return "application/vnd.ms-powerpoint";
      case "pptx":
        return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      case "xls":
        return "application/vnd.ms-excel";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "mp4":
        return "video/mp4";
      default:
        return "application/octet-stream";
    }
  };

  const openFile = async (fileUri: string, fileName: string) => {
    if (Platform.OS === "android") {
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        if (contentUri) {
          const mimeType = getMimeTypeFromExtension(fileName);
          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
              type: mimeType || "application/octet-stream",
            }
          );
        }
      } catch (error) {
        Alert.alert("Lỗi", "Không thể mở file: ");
      }
    } else {
      Alert.alert("Lỗi", "Chức năng chỉ hỗ trợ trên Android.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tệp tin</Text>
      <View style={styles.fileList}>
        {loading ? (
          <Text style={styles.placeholder}>Đang tải...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : files.length > 0 ? (
          files.map((file, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fileItem}
              // onPress={() => openFile(file.linkURL, file.name)}
            >
              <Text style={styles.fileName}>{file.name}</Text>
              <Ionicons name="folder-open" size={20} color="#666" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.placeholder}>Chưa có tệp nào.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  fileList: {
    gap: 5,
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
  },
  placeholder: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 14,
    color: "red",
  },
});

export default GroupFile;
