import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

interface Message {
  messageId: string;
  content: string;
  fileUrls?: string[];
  timestamp: string;
}

interface Link {
  id: string;
  title: string;
  linkURL: string;
}

interface Props {
  userId: string;
}

const GroupLinks: React.FC<Props> = ({ userId }) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://192.168.1.49:3000/api/messages/user/${userId}`
        );
        const messages: Message[] = response.data.sort(
          (a: Message, b: Message) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const linkMessages = messages
          .filter((msg) => {
            return (
              msg.content?.match(/^(https?:\/\/[^\s]+)/) &&
              (!msg.fileUrls || msg.fileUrls.length === 0)
            );
          })
          .map((msg) => ({
            id: msg.messageId,
            title: msg.content || "Không có tiêu đề",
            linkURL: msg.content.match(/^(https?:\/\/[^\s]+)/)[0],
          }));
        setLinks(linkMessages);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách liên kết:", err);
        setError("Không thể tải danh sách liên kết. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [userId]);

  const handleOpenLink = (linkURL: string) => {
    if (!linkURL || linkURL === "#") {
      Alert.alert("Lỗi", "Link không hợp lệ.");
      return;
    }

    Linking.openURL(linkURL).catch((err) =>
      Alert.alert("Lỗi", "Không thể mở link: " + err.message)
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liên kết</Text>
      <View style={styles.linkList}>
        {loading ? (
          <Text style={styles.placeholder}>Đang tải...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : links.length > 0 ? (
          links.map((link, index) => (
            <View key={index} style={styles.linkItem}>
              <TouchableOpacity onPress={() => handleOpenLink(link.linkURL)}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkUrl}>{link.linkURL}</Text>
              </TouchableOpacity>
              <Ionicons name="link" size={20} color="#666" />
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>Chưa có link nào.</Text>
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
  linkList: {
    gap: 5,
  },
  linkItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  linkUrl: {
    fontSize: 12,
    color: "#1e90ff",
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

export default GroupLinks;
