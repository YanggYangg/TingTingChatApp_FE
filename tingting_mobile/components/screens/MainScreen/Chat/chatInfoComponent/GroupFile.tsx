import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import StoragePage from './StoragePage';

interface File {
  linkURL: string;
  content: string;
  createdAt: string;
}

interface Props {
  conversationId: string;
}


const GroupFile: React.FC<Props> = ({ conversationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const mockFiles = [
    {
      linkURL: "https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx",
      content: "File1.pdf",
      createdAt: "2025-04-10T10:00:00Z",
    },
    {
      linkURL: "https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx",
      content: "File2.doc",
      createdAt: "2025-04-09T10:00:00Z",
    },
  ];
  useEffect(() => {
    if (!conversationId) return;

    const fetchFiles = () => {
      const sortedFiles = mockFiles.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setFiles(sortedFiles.slice(0, 3));
    };

    fetchFiles();
  }, [conversationId]);

  const handleDownload = (file: File) => {
    if (!file?.linkURL) {
      Alert.alert("Lỗi", "Không có link file để tải.");
      return;
    }

    Linking.openURL(file.linkURL).catch((err) =>
      Alert.alert("Lỗi", "Không thể tải file: " + err.message)
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tệp tin</Text>
      <View style={styles.fileList}>
        {files.length > 0 ? (
          files.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <TouchableOpacity
                onPress={() => Linking.openURL(file.linkURL)}
                style={styles.fileLink}
              >
                <Text style={styles.fileName}>{file.content || "Không có tên"}</Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => setPreviewFile(file)}>
                  <Ionicons name="folder-open" size={18} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDownload(file)}>
                  <Ionicons name="download" size={18} color="#666" style={styles.Ionicons} />
                </TouchableOpacity>
              </View>
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
        />
      )}

      {previewFile && (
        <View style={styles.previewModal}>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>{previewFile.content || "Xem nội dung"}</Text>
            <Text style={styles.previewText}>Mở file: {previewFile.linkURL}</Text>
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => handleDownload(previewFile)}
              >
                <Text style={styles.previewButtonText}>Tải xuống</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPreviewFile(null)}>
                <Text style={styles.closeButton}>✖</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    marginBottom: 5,
  },
  fileList: {
    gap: 5,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  fileLink: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: '#1e90ff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  Ionicons: {
    marginLeft: 10,
  },
  viewAllButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#333',
  },
  previewModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    width: '90%',
    height: '50%',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  previewButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
  },
});

export default GroupFile;