import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import StoragePage from './StoragePage';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

interface File {
  linkURL: string;
  content: string;
  createdAt: string;
}

interface Props {
  conversationId: string;
  userId: string;
}

const GroupFile: React.FC<Props> = ({ conversationId, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const fetchFiles = async () => {
    try {
      console.log("Gửi request đến API...");
      const response = await Api_chatInfo.getChatFiles(conversationId);
      console.log("Dữ liệu API trả về:", response);

      const fileData = Array.isArray(response) ? response : response?.data;

      if (Array.isArray(fileData)) {
        const sortedFiles = fileData.sort((a, b) => {
          return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || 0;
        });
        setFiles(sortedFiles.slice(0, 3));
      } else {
        setFiles([]);
        console.warn("API không trả về mảng hợp lệ");
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách file:", error);
      Alert.alert('Lỗi', 'Không thể tải danh sách file. Vui lòng thử lại.');
      setFiles([]);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    console.log("GRF userId", userId);
    fetchFiles();
  }, [conversationId]);

  const handleDownload = async (file: File) => {
    if (!file?.linkURL) {
      Alert.alert("Lỗi", "Không có link file để tải.");
      return;
    }

    const fileName = file.linkURL.split('/').pop() || file.content || 'downloaded_file';
    const fileUri = `${FileSystem.documentDirectory}/${fileName}`;

    try {
      const { uri } = await FileSystem.downloadAsync(file.linkURL, fileUri);
      Alert.alert("Thành công", `Tệp "${fileName}" đã được tải xuống.`);
      console.log("Tệp đã lưu tại:", uri);
      openFile(uri, fileName);
    } catch (downloadError: any) {
      console.error("Lỗi khi tải file:", downloadError.message || downloadError);
      Alert.alert("Lỗi", `Không thể tải xuống tệp "${fileName}". Vui lòng thử lại.`);
    }
  };

  const getMimeTypeFromExtension = (fileName: string): string | null => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'pdf':
        return 'application/pdf';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'mp4':
        return 'video/mp4';
      // Thêm các loại MIME khác nếu cần
      default:
        return 'application/octet-stream'; // Fallback
    }
  };

  const openFile = async (fileUri: string, fileName: string) => {
    if (Platform.OS === 'android') {
      try {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        if (contentUri) {
          const mimeType = getMimeTypeFromExtension(fileName);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: mimeType || 'application/octet-stream',
          });
        } else {
          Alert.alert("Lỗi", "Không thể tạo Content URI cho tệp.");
        }
      } catch (error: any) {
        console.error("Lỗi khi mở file trên Android:", error);
        Alert.alert("Lỗi", `Không thể mở tệp "${fileName}". Hãy kiểm tra xem bạn đã cài đặt ứng dụng phù hợp để mở tệp này chưa.`);
      }
    } else if (Platform.OS === 'ios') {
      Alert.alert(
        "Mở tệp",
        `Tệp "${fileName}" đã được tải xuống. Vui lòng kiểm tra ứng dụng "Tệp" của bạn để xem tệp.`,
        [{ text: "OK" }]
      );
      console.log("Tệp đã lưu tại (iOS):", fileUri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tệp tin</Text>
      <View style={styles.fileList}>
        {files.length > 0 ? (
          files.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <Ionicons name="document-outline" size={16} color="#1e90ff" style={{ marginRight: 10, paddingBottom: 4, paddingTop: 5 }} />
                <Text style={styles.fileName}>{file.content || "Không có tên"}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDownload(file)} style={styles.downloadButton}>
                <Ionicons name="download-outline" size={20} color="#1e90ff" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>Không có tệp nào.</Text>
        )}
      </View>
      <TouchableOpacity style={styles.viewAllButton} onPress={() => setIsOpen(true)}>
        <Text style={styles.viewAllText}>Xem tất cả</Text>
      </TouchableOpacity>

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          files={files}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          userId={userId}
          onDataUpdated={fetchFiles}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  fileList: {
    gap: 4,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  fileName: {
    fontSize: 12,
    color: '#1e90ff',
    flexShrink: 1,
    marginRight: 10,
    alignItems: 'center',
    paddingBottom: 10,
  },
  downloadButton: {
    padding: 2,
  },
  viewAllButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    borderRadius: 3,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 12,
    color: '#333',
  },
  placeholder: {
    fontSize: 12,
    color: '#666',
  },
});
export default GroupFile;