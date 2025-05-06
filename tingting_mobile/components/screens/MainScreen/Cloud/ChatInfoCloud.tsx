import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import GroupMediaGallery from "./GroupMediaGallery";
import GroupFile from "./GroupFile";
import GroupLinks from "./GroupLinks";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatInfoCloud: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  // Get userid local storage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        console.log("User ID:", userId);
      } catch (error) {
        console.error("Error retrieving user ID:", error);
      }
    };
    getUserId();
  }, [userId]);

  const cloudChat = {
    id: "my-cloud",
    name: "Cloud của tôi",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTis1SYXE25_el_qQD8Prx-_pFRfsYoqc2Dmw&s",
    type: "cloud",
  };

  // Mock data for media, files, and links (replace with actual data from API)
  const chatInfo = {
    files: [
      {
        id: "file1",
        name: "document.pdf",
        size: "1.2MB",
        uploadedAt: "04/05/2025",
      },
    ],
    links: ["https://example.com/meeting", "https://x.com/post123"],
    media: [
      { id: "media1", type: "image", url: "https://via.placeholder.com/150" },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin hội thoại</Text>
        <TouchableOpacity>
          {/* <Ionicons name="ellipsis-vertical" size={24} color="#fff" /> */}
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView style={styles.content}>
        {/* Chat Info Header */}
        <View style={styles.chatInfoHeader}>
          <Image
            source={{ uri: cloudChat.avatar }}
            style={styles.avatar}
            resizeMode="cover"
          />
          <Text style={styles.chatName}>{cloudChat.name}</Text>
          <Text style={styles.description}>
            Lưu trữ và truy cập nhanh những nội dung quan trọng của bạn ngay
            trên Zalo
          </Text>
        </View>

        {/* Media, Files, Links Sections */}
        <GroupMediaGallery userId={userId} />
        <GroupFile userId={userId} />
        <GroupLinks userId={userId} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0099FF",
    padding: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  chatInfoHeader: {
    alignItems: "center",
    padding: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default ChatInfoCloud;
