import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import Modal from 'react-native-modal';

interface File {
  linkURL: string;
  content: string;
  createdAt: string;
}

interface Link {
  title: string;
  url: string;
  date: string;
  sender: string;
}

interface Props {
  conversationId: string;
  files?: File[];
  links?: Link[];
  onClose: () => void;
}

const StoragePage: React.FC<Props> = ({ conversationId, files, links, onClose }) => {
  const data = files || links || [];
  const mockFiles = [
    {
      linkURL: "https://example.com/file1.pdf",
      content: "File1.pdf",
      createdAt: "2025-04-10T10:00:00Z",
    },
    {
      linkURL: "https://example.com/file2.doc",
      content: "File2.doc",
      createdAt: "2025-04-09T10:00:00Z",
    },
    {
      linkURL: "https://example.com/file3.xlsx",
      content: "File3.xlsx",
      createdAt: "2025-04-08T10:00:00Z",
    },
  ];
  const mockLinks = [
    {
      title: "Link 1",
      url: "https://example.com/link1",
      date: "2025-04-10",
      sender: "6601a1b2c3d4e5f678901238",
    },
    {
      title: "Link 2",
      url: "https://example.com/link2",
      date: "2025-04-09",
      sender: "6601a1b2c3d4e5f678901239",
    },
    {
      title: "Link 3",
      url: "https://example.com/link3",
      date: "2025-04-08",
      sender: "6601a1b2c3d4e5f678901240",
    },
  ];
  const handleDownload = (file: File) => {
    if (!file?.linkURL) {
      Alert.alert("Lỗi", "Không có link file để tải.");
      return;
    }

    Linking.openURL(file.linkURL).catch((err) =>
      Alert.alert("Lỗi", "Không thể tải file: " + err.message)
    );
  };

  const handleOpenLink = (link: Link) => {
    if (!link?.url) {
      Alert.alert("Lỗi", "Không có URL để mở.");
      return;
    }

    Linking.openURL(link.url).catch((err) =>
      Alert.alert("Lỗi", "Không thể mở link: " + err.message)
    );
  };

  const renderItem = ({ item }: { item: File | Link }) => {
    if (files) {
      // Hiển thị tệp
      const file = item as File;
      return (
        <View style={styles.itemContainer}>
          <TouchableOpacity
            onPress={() => Linking.openURL(file.linkURL)}
            style={styles.itemContent}
          >
            <Text style={styles.itemName}>{file.content || "Không có tên"}</Text>
            <Text style={styles.itemDate}>
              {new Date(file.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDownload(file)}>
            <Ionicons name="download" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      );
    } else {
      // Hiển thị liên kết
      const link = item as Link;
      return (
        <View style={styles.itemContainer}>
          <View style={styles.itemContent}>
            <Text style={styles.itemName}>{link.title}</Text>
            <TouchableOpacity onPress={() => handleOpenLink(link)}>
              <Text style={styles.itemLink}>{link.url}</Text>
            </TouchableOpacity>
            <Text style={styles.itemDate}>{link.date}</Text>
          </View>
          <Ionicons name="link" size={18} color="#666" />
        </View>
      );
    }
  };

  return (
    <Modal isVisible={true} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>
          Danh sách đầy đủ ({data.length})
        </Text>
        {data.length > 0 ? (
          <FlatList
            data={data}
            keyExtractor={(item, index) =>
              files
                ? `${item.linkURL}-${index}`
                : `${item.url}-${index}`
            }
            renderItem={renderItem}
            style={styles.list}
          />
        ) : (
          <Text style={styles.placeholder}>Không có dữ liệu</Text>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  list: {
    maxHeight: 400,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemLink: {
    fontSize: 12,
    color: '#1e90ff',
    marginVertical: 2,
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  placeholder: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default StoragePage;