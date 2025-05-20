import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Api_Profile } from "../../../../../apis/api_profile";
import { Api_Conversation } from "../../../../../apis/api_conversation";
import { useDispatch } from "react-redux";
import { setSelectedMessage } from "../../../../../redux/slices/chatSlice";
import { useSocket } from "../../../../../contexts/SocketContext";
import Icon from "react-native-vector-icons/Feather"; // Thêm thư viện icon

const DEFAULT_AVATAR =
  "https://encrypted-tbn0.gstatic.com/images?q=tbngcQDPQFLjc7cTCBIW5tyYcZGlMkWfvQptRw-k1lF5XyVoor51KoaIx6gWCy-rh4J1kVlE0k&usqp=CAU";
const DEFAULT_COVER_PHOTO =
  "https://inkythuatso.com/uploads/thumbnails/800/2022/04/anh-bia-zalo-canh-dep-thien-nhien-024637306-20-09-22-39.jpg";

interface UserProfile {
  _id: string;
  firstname: string;
  surname: string;
  avatar: string | null;
  coverPhoto: string | null;
  phone: string;
  dateOfBirth: string;
  gender: string;
  email: string;
}

const ProfileScreen2: React.FC<{ currentUserId?: string }> = ({ currentUserId: propCurrentUserId }) => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userId: contextUserId } = useSocket();
  const { userId } = route.params as { userId: string };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const finalCurrentUserId = propCurrentUserId || contextUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await Api_Profile.getProfile(userId);
        setProfile(response?.data?.user || null);
      } catch (error) {
        console.error("Error fetching profile:", error);
        Alert.alert("Lỗi", "Không thể tải thông tin hồ sơ.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleMemberClick = async (memberId: string) => {
    if (!finalCurrentUserId) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng hiện tại. Vui lòng đăng nhập lại.");
      return;
    }

    if (memberId === finalCurrentUserId) {
      Alert.alert("Thông báo", "Bạn không thể trò chuyện với chính mình!");
      return;
    }

    try {
      const res = await Api_Conversation.getOrCreateConversation(finalCurrentUserId, memberId);
      if (res?.conversationId) {
        const messageData = {
          id: res.conversationId,
          isGroup: false,
          participants: [
            { userId: finalCurrentUserId },
            { userId: memberId },
          ],
        };
        dispatch(setSelectedMessage(messageData));
        navigation.navigate("MessageScreen", {
          message: messageData,
          conversationId: res.conversationId,
        });
      } else {
        const errorMessage =
          typeof res?.message === "string" ? res.message : "Không thể lấy hoặc tạo hội thoại.";
        Alert.alert("Lỗi", errorMessage);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      const errorMessage =
        typeof error === "string" ? error : error?.message || "Lỗi khi bắt đầu trò chuyện.";
      Alert.alert("Lỗi", errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.textGray}>Đang tải thông tin hồ sơ...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.textRed}>Không thể tải thông tin hồ sơ.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: profile.coverPhoto || DEFAULT_COVER_PHOTO }}
          style={styles.coverPhoto}
        />
        <View style={styles.coverOverlay} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={20} color="#007bff" />
        </TouchableOpacity>
      </View>
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: profile.avatar || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{`${profile.firstname} ${profile.surname}`}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.buttonBlue}
            activeOpacity={0.7}
            onPress={() => handleMemberClick(profile._id)}
          >
            <Text style={styles.buttonText}>Nhắn tin</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoText}>{profile.email}</Text>

            <Text style={styles.infoLabel}>Giới tính</Text>
            <Text style={styles.infoText}>{profile.gender}</Text>

            <Text style={styles.infoLabel}>Ngày sinh</Text>
            <Text style={styles.infoText}>{formatDate(profile.dateOfBirth)}</Text>

            <Text style={styles.infoLabel}>Điện thoại</Text>
            <Text style={styles.infoText}>{profile.phone}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Softer gray for cleaner look
  },
  coverContainer: {
    position: "relative",
  },
  coverPhoto: {
    width: "100%",
    height: 260, // Slightly reduced for balance
    resizeMode: "cover",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)", // Lighter overlay for better contrast
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 12, // Smaller padding for icon-only button
    borderRadius: 50, // Circular button
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileContainer: {
    padding: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderRadius: 30, // Softer corners
    marginHorizontal: 15,
    marginTop: -60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginTop: -65,
    borderWidth: 5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  name: {
    fontSize: 24, // Reduced from 28
    fontWeight: "700",
    color: "#1a1a1a",
    marginVertical: 12,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonRow: {
    flexDirection: "row",
    marginVertical: 15,
    justifyContent: "center",
  },
  buttonBlue: {
    backgroundColor: "#007bff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25, // Softer button corners
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15, // Reduced from 17
    fontWeight: "600",
  },
  infoSection: {
    width: "100%",
    paddingHorizontal: 10,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20, // Softer corners
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.05)", // Subtle border for modern look
  },
  infoLabel: {
    fontWeight: "600",
    color: "#007bff",
    fontSize: 15, // Reduced from 17
    marginTop: 12,
  },
  infoText: {
    fontSize: 14, // Reduced from 16
    color: "#333",
    marginBottom: 6,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  textGray: {
    color: "#666",
    fontSize: 15, // Reduced from 17
    textAlign: "center",
    marginTop: 10,
  },
  textRed: {
    color: "#dc3545",
    fontSize: 16, // Reduced from 18
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007bff",
    padding: 12, // Smaller padding for icon-only button
    borderRadius: 50, // Circular button
    marginTop: 15,
  },
});

export default ProfileScreen2;