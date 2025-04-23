import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Api_Profile } from "@/apis/api_profile";
import axios from "axios";

export default function ProfileScreen() {
  const navigation = useNavigation();

  // Get the user ID from the async-storage
  const [formData, setFormData] = useState({
    firstname: "",
    surname: "",
    day: "1",
    month: "1",
    year: "2025",
    gender: "female",
    phone: "",
    avatar: null,
    coverPhoto: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const token = await AsyncStorage.getItem("token");

        if (!userId || !token) {
          console.warn("Missing userId or token");
          return;
        }

        console.log("User ID:", userId);

        const response = await axios.get(
          `http://192.168.1.33:3001/api/v1/profile/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const user = response.data.data.user;
        console.log("User Data:", user);

        const date = new Date(user.dateOfBirth);
        const day = String(date.getDate());
        const month = String(date.getMonth() + 1);
        const year = String(date.getFullYear());

        setFormData({
          firstname: user.firstname || "",
          surname: user.surname || "",
          phone: user.phone || "",
          gender: user.gender || "female",
          avatar:
            user.avatar ||
            "https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg",
          coverPhoto:
            user.coverPhoto ||
            "https://pantravel.vn/wp-content/uploads/2023/11/ngon-nui-thieng-cua-nhat-ban.jpg",
          day,
          month,
          year,
        });
      } catch (error) {
        console.error("Lỗi khi lấy thông tin hồ sơ:", error.message);
      }
    };

    fetchProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Background Image */}
          <Image
            source={{
              uri:
                formData.coverPhoto ||
                "https://pantravel.vn/wp-content/uploads/2023/11/ngon-nui-thieng-cua-nhat-ban.jpg",
            }}
            style={styles.backgroundImage}
          />

          {/* Profile Picture */}
          <View style={styles.profilePictureContainer}>
            <Image
              source={{
                uri:
                  formData.avatar ||
                  "https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg",
              }}
              style={styles.profilePicture}
            />
          </View>

          {/* Name */}
          <Text style={styles.profileName}>
            {formData.firstname} {formData.surname}
          </Text>

          {/* Update Profile Button */}
          <TouchableOpacity
            style={styles.updateProfileButton}
            onPress={() => navigation.navigate("PersonalInfo", { formData })}
          >
            <Feather name="edit-2" size={16} color="#2196F3" />
            <Text style={styles.updateProfileText}>Cập nhật</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="people" size={24} color="#2196F3" />
            <Text style={styles.menuText}>Cài zStyle</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="images" size={24} color="#2196F3" />
            <Text style={styles.menuText}>Ảnh của tôi</Text>
            <Text style={styles.menuCount}>200</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="folder" size={24} color="#2196F3" />
            <Text style={styles.menuText}>Kho kỉ niệm</Text>
          </TouchableOpacity>
        </View>

        {/* Post Section */}
        <View style={styles.postSection}>
          <View style={styles.postInput}>
            <Text style={styles.postInputText}>Bạn đang nghĩ gì?</Text>
            <Ionicons name="image-outline" size={24} color="#8BC34A" />
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color="#9E9E9E" />
            <Text style={styles.privacyText}>
              Bạn bè của bạn sẽ không xem được các bài đăng dưới đây.{" "}
              <Text style={styles.privacyLink}>Thay đổi cài đặt</Text>
            </Text>
          </View>

          {/* Valentine's Day */}
          <View style={styles.eventSection}>
            <View style={styles.eventBadge}>
              <Ionicons name="heart" size={16} color="white" />
            </View>
            <Text style={styles.eventText}>14 tháng 2 - Lễ Tình Nhân</Text>
          </View>

          {/* ID Section */}
          <View style={styles.idSection}>
            <Text style={styles.idLabel}>ID</Text>
            <Text style={styles.idEmail}>chautinh0512@gmail.com</Text>
            <Text style={styles.idUsername}>Chautinh0512</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.likeButton}>
                <Ionicons name="heart-outline" size={24} color="#616161" />
                <Text style={styles.actionText}>Thích</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.commentButton}>
                <Ionicons name="chatbubble-outline" size={24} color="#616161" />
              </TouchableOpacity>

              <View style={styles.lockIcon}>
                <Ionicons name="lock-closed" size={20} color="#9E9E9E" />
              </View>

              <TouchableOpacity style={styles.moreButton}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={24}
                  color="#616161"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    paddingBottom: 20,
  },
  backgroundImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  profilePictureContainer: {
    marginTop: -50,
    borderWidth: 4,
    borderColor: "white",
    borderRadius: 75,
    overflow: "hidden",
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  updateProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  updateProfileText: {
    color: "#2196F3",
    marginLeft: 5,
    fontSize: 16,
  },
  menuSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
  },
  menuText: {
    marginLeft: 5,
    fontSize: 14,
  },
  menuCount: {
    marginLeft: 5,
    color: "#9E9E9E",
    fontSize: 14,
  },
  postSection: {
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    padding: 15,
  },
  postInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  postInputText: {
    color: "#9E9E9E",
    fontSize: 16,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  privacyText: {
    color: "#9E9E9E",
    fontSize: 14,
    marginLeft: 5,
    flex: 1,
  },
  privacyLink: {
    color: "#2196F3",
  },
  eventSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  eventBadge: {
    backgroundColor: "#FF4081",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  eventText: {
    fontSize: 16,
    color: "#FF4081",
  },
  idSection: {
    paddingVertical: 15,
  },
  idLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  idEmail: {
    fontSize: 16,
    color: "#2196F3",
    marginBottom: 5,
  },
  idUsername: {
    fontSize: 16,
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentButton: {},
  lockIcon: {},
  moreButton: {},
  actionText: {
    marginLeft: 5,
    color: "#616161",
  },
});
