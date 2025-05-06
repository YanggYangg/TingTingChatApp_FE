import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import axios from "axios";

interface Message {
  messageId: string;
  fileUrls?: string[];
  filenames?: string[];
  content?: string;
  timestamp: string;
}

interface Item {
  id: string;
  url: string;
  date: string;
  name: string;
  type: string;
}

interface Props {
  conversationId: string;
  userId: string;
  onClose: () => void;
}

const StoragePage: React.FC<Props> = ({ conversationId, userId, onClose }) => {
  const [data, setData] = useState<{
    images: Item[];
    files: Item[];
    links: Item[];
  }>({
    images: [],
    files: [],
    links: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationId || conversationId !== "my-cloud" || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:3000/api/messages/user/${userId}`
        );
        const messages: Message[] = response.data.sort(
          (a: Message, b: Message) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const formattedData = {
          images: [],
          files: [],
          links: [],
        };

        messages.forEach((msg) => {
          const item = {
            id: msg.messageId,
            url: msg.fileUrls?.[0] || msg.content || "",
            date: new Date(msg.timestamp).toISOString().split("T")[0],
            name: msg.filenames?.[0] || msg.content || "Không có tên",
            type: "file",
          };

          if (msg.fileUrls?.[0]) {
            if (/\.(jpg|jpeg|png|gif|mp4|webm)$/i.test(msg.fileUrls[0])) {
              item.type = "image";
              formattedData.images.push(item);
            } else {
              formattedData.files.push(item);
            }
          } else if (
            msg.content?.match(/^(https?:\/\/[^\s]+)/) &&
            (!msg.fileUrls || msg.fileUrls.length === 0)
          ) {
            item.type = "link";
            item.url = msg.content.match(/^(https?:\/\/[^\s]+)/)[0];
            formattedData.links.push(item);
          }
        });

        setData(formattedData);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu lưu trữ:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [conversationId, userId]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>Đóng</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Kho lưu trữ</Text>
      <ScrollView>
        {loading ? (
          <Text style={styles.placeholder}>Đang tải...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            {data.images.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Ảnh/Video</Text>
                {data.images.map((item) => (
                  <Text key={item.id} style={styles.item}>
                    {item.name} - {item.date}
                  </Text>
                ))}
              </View>
            )}
            {data.files.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Files</Text>
                {data.files.map((item) => (
                  <Text key={item.id} style={styles.item}>
                    {item.name} - {item.date}
                  </Text>
                ))}
              </View>
            )}
            {data.links.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Links</Text>
                {data.links.map((item) => (
                  <Text key={item.id} style={styles.item}>
                    {item.name} - {item.date}
                  </Text>
                ))}
              </View>
            )}
            {data.images.length === 0 &&
              data.files.length === 0 &&
              data.links.length === 0 && (
                <Text style={styles.placeholder}>Không có dữ liệu</Text>
              )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 5,
  },
  closeText: {
    fontSize: 16,
    color: "#1e90ff",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
  item: {
    fontSize: 14,
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  placeholder: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});

export default StoragePage;
