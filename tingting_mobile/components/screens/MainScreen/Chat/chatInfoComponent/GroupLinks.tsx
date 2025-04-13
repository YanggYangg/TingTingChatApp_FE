import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import StoragePage from './StoragePage';
import {Api_chatInfo} from '../../../../../apis/Api_chatInfo';

interface Link {
  title: string;
  url: string;
  date: string;
  sender: string;
}

interface Props {
  conversationId: string;
}

const GroupLinks: React.FC<Props> = ({ conversationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const fetchLinks = async () => {
      try {
        const response = await Api_chatInfo.getChatLinks(conversationId);
        const linkData = Array.isArray(response) ? response : response?.data;

        if (Array.isArray(linkData)) {
          const filteredLinks = linkData
            .filter((item) => item?.messageType === "link")
            .map((item) => ({
              title: item?.content || "Không có tiêu đề",
              url: item?.linkURL || "#",
              date: item?.createdAt?.split("T")[0] || "Không có ngày",
              sender: item?.userId || "Không rõ người gửi",
            }));

          // Sắp xếp link theo thời gian
          const sortedLinks = filteredLinks.sort((a, b) => {
            if (a.date && b.date) {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            } else {
              return 0;
            }
          });

          // Lấy 3 link đầu tiên
          setLinks(sortedLinks.slice(0, 3));
        } else {
          setLinks([]);
          console.error("Dữ liệu không hợp lệ:", response);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách link:", error);
        Alert.alert('Lỗi', 'Không thể tải danh sách link. Vui lòng thử lại.');
        setLinks([]);
      }
    };

    fetchLinks();
  }, [conversationId]);

  const handleOpenLink = (url: string) => {
    if (!url || url === "#") {
      Alert.alert("Lỗi", "Link không hợp lệ.");
      return;
    }

    Linking.openURL(url).catch((err) =>
      Alert.alert("Lỗi", "Không thể mở link: " + err.message)
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liên kết</Text>
      <View style={styles.linkList}>
        {links.length > 0 ? (
          links.map((link, index) => (
            <View key={index} style={styles.linkItem}>
              <View>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <TouchableOpacity onPress={() => handleOpenLink(link.url)}>
                  <Text style={styles.linkUrl}>{link.url}</Text>
                </TouchableOpacity>
              </View>
              <Ionicons name="link" size={20} color="#666" />
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>Chưa có link nào.</Text>
        )}
      </View>

      <TouchableOpacity style={styles.viewAllButton} onPress={() => setIsOpen(true)}>
        <Text style={styles.viewAllText}>Xem tất cả</Text>
      </TouchableOpacity>

      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          links={links}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
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
  placeholder: {
    fontSize: 14,
    color: '#666',
  },
});

export default GroupLinks;