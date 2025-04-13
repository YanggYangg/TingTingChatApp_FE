import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StoragePage from './StoragePage';

// Định dạng dữ liệu gốc từ GroupLinks
interface Link {
  title: string;
  url: string;
  date: string;
  sender: string;
}

// Định dạng dữ liệu gốc từ GroupFile
interface File {
  linkURL: string;
  content: string;
  createdAt: string;
}

// Định dạng dữ liệu chuẩn hóa cho StoragePage
interface Media {
  src: string;
  name: string;
  type: 'image' | 'video' | 'file' | 'link';
  date?: string;
  sender?: string;
}

interface Props {
  conversationId: string;
}

const StorageContainer: React.FC<Props> = ({ conversationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<Media | null>(null);

  // Dữ liệu mock cho links
  const mockLinks: Link[] = [
    {
      title: 'Link 1',
      url: 'https://example.com/link1',
      date: '2025-04-10',
      sender: '6601a1b2c3d4e5f678901238',
    },
    {
      title: 'Link 2',
      url: 'https://example.com/link2',
      date: '2025-04-09',
      sender: '6601a1b2c3d4e5f678901239',
    },
  ];

  // Dữ liệu mock cho files
  const mockFiles: File[] = [
    {
      linkURL: 'https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx',
      content: 'File1.pdf',
      createdAt: '2025-04-10T10:00:00Z',
    },
    {
      linkURL: 'https://storetingting.s3.ap-southeast-2.amazonaws.com/CauHoi+Java.docx',
      content: 'File2.doc',
      createdAt: '2025-04-09T10:00:00Z',
    },
  ];

  useEffect(() => {
    if (!conversationId) return;

    const fetchLinks = () => {
      const sortedLinks = mockLinks.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setLinks(sortedLinks.slice(0, 3));
    };

    const fetchFiles = () => {
      const sortedFiles = mockFiles.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setFiles(sortedFiles.slice(0, 3));
    };

    fetchLinks();
    fetchFiles();
  }, [conversationId]);

  // Chuẩn hóa dữ liệu từ Link và File thành Media
  const standardizedLinks: Media[] = links.map((link) => ({
    src: link.url,
    name: link.title,
    type: 'link' as const,
    date: link.date,
    sender: link.sender,
  }));

  const standardizedFiles: Media[] = files.map((file) => ({
    src: file.linkURL,
    name: file.content,
    type: 'file' as const,
    date: file.createdAt.split('T')[0], // Chuẩn hóa định dạng ngày
    sender: 'Không xác định', // File không có sender, gán mặc định
  }));

  const handleDownload = (file: Media) => {
    if (!file.src) {
      Alert.alert('Lỗi', 'Không có link file để tải.');
      return;
    }

    Linking.openURL(file.src).catch((err) =>
      Alert.alert('Lỗi', 'Không thể tải file: ' + err.message)
    );
  };

  return (
    <View style={styles.container}>
      {/* Hiển thị danh sách Links */}
      <View style={styles.section}>
        <Text style={styles.title}>Liên kết</Text>
        <View style={styles.linkList}>
          {standardizedLinks.length > 0 ? (
            standardizedLinks.map((link, index) => (
              <View key={index} style={styles.linkItem}>
                <View>
                  <Text style={styles.linkTitle}>{link.name}</Text>
                  <TouchableOpacity onPress={() => Linking.openURL(link.src)}>
                    <Text style={styles.linkUrl}>{link.src}</Text>
                  </TouchableOpacity>
                </View>
                <Ionicons name="link" size={20} color="#666" />
              </View>
            ))
          ) : (
            <Text style={styles.placeholder}>Chưa có link nào.</Text>
          )}
        </View>
      </View>

      {/* Hiển thị danh sách Files */}
      <View style={styles.section}>
        <Text style={styles.title}>Tệp tin</Text>
        <View style={styles.fileList}>
          {standardizedFiles.length > 0 ? (
            standardizedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(file.src)}
                  style={styles.fileLink}
                >
                  <Text style={styles.fileName}>{file.name || 'Không có tên'}</Text>
                </TouchableOpacity>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => setPreviewFile(file)}>
                    <Ionicons name="folder-open" size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDownload(file)}>
                    <Ionicons
                      name="download"
                      size={18}
                      color="#666"
                      style={styles.icon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.placeholder}>Không có tệp nào.</Text>
          )}
        </View>
      </View>

      {/* Nút "Xem tất cả" */}
      {(standardizedLinks.length > 0 || standardizedFiles.length > 0) && (
        <TouchableOpacity style={styles.viewAllButton} onPress={() => setIsOpen(true)}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      )}

      {/* Gọi StoragePage một lần với dữ liệu kết hợp */}
      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          data={{
            images: [], // Không có images trong trường hợp này
            files: standardizedFiles,
            links: standardizedLinks,
          }}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}

      {/* Preview Modal cho Files */}
      {previewFile && (
        <View style={styles.previewModal}>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>
              {previewFile.name || 'Xem nội dung'}
            </Text>
            <Text style={styles.previewText}>Mở file: {previewFile.src}</Text>
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
  section: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  linkList: {
    gap: 5,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: 12,
    color: '#1e90ff',
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
  icon: {
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

export default StorageContainer;