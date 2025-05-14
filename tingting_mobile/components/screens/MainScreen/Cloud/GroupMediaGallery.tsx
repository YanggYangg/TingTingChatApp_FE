import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import axios from "axios";

interface Message {
  messageId: string;
  fileUrls?: string[];
  filenames?: string[];
  thumbnailUrls?: string[];
  timestamp: string;
}

interface Media {
  id: string;
  src: string;
  name: string;
  type: string;
}

interface Props {
  userId: string;
}

const GroupMediaGallery: React.FC<Props> = ({ userId }) => {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://192.168.26.115:3000/api/messages/user/${userId}`
        );
        const messages: Message[] = response.data.sort(
          (a: Message, b: Message) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const mediaMessages = messages
          .filter((msg) =>
            msg.fileUrls?.some((url) =>
              /\.(jpg|jpeg|png|gif|mp4|webm)$/i.test(url)
            )
          )
          .map((msg) => ({
            id: msg.messageId,
            src: msg.thumbnailUrls?.[0] || msg.fileUrls?.[0] || "",
            name: msg.filenames?.[0] || msg.content || "Không có tên",
            type: /\.(jpg|jpeg|png|gif)$/i.test(msg.fileUrls?.[0])
              ? "image"
              : "video",
          }));
        setMedia(mediaMessages);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách media:", err);
        setError("Không thể tải danh sách media. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ảnh/Video</Text>
      <View style={styles.mediaGrid}>
        {loading ? (
          <Text style={styles.placeholder}>Đang tải...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : media.length > 0 ? (
          media.slice(0, 8).map((item, index) => (
            <TouchableOpacity key={index} style={styles.mediaItem}>
              {item.type === "image" ? (
                <Image
                  source={{ uri: item.src }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={{ uri: item.src }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              )}
              <Text style={styles.mediaName}>{item.name}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.placeholder}>Chưa có media nào.</Text>
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
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  mediaItem: {
    width: "22%",
    alignItems: "center",
  },
  mediaImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  mediaName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
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

export default GroupMediaGallery;
