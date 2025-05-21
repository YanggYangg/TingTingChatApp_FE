import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/Ionicons";
import {
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import PostFeed from "./components/PostFeed";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "@/app/(tabs)";

type Props = StackScreenProps<RootStackParamList, "ProfileScreen">;

const ProfileScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation();

  const { profileId } = route.params;

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
  const [posts, setPosts] = useState([]);
  const loadProfileFromLocal = async () => {
    try {
      const response = await axios.get(
        `http://192.168.0.102:3001/api/v1/profile/${profileId}`
      );
      const profile = response.data.data.user;
      const date = new Date(profile.dateOfBirth);
      const day = date.getDate().toString();
      const month = (date.getMonth() + 1).toString();
      const year = date.getFullYear().toString();

      setFormData((prev) => ({
        ...prev,
        firstname: profile.firstname || "",
        surname: profile.surname || "",
        phone: profile.phone || "",
        avatar:
          profile.avatar ||
          "https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg",
        coverPhoto: profile.coverPhoto || null,
        gender: profile.gender || "female",
        day,
        month,
        year,
      }));
    } catch (error) {
      console.error("Error loading profile from localStorage:", error);
    }
  };

  const getPost = async () => {
    try {
      const response = await axios.get(
        `http://192.168.0.102:3006/api/v1/post/${profileId}`
      );
      console.log("Response data2:", response.data.data.post);
      if (response.status === 200) {
        setPosts(response.data.data.post);
      } else {
        Alert.alert("Error", "Failed to fetch posts.");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert("Error", "Failed to fetch posts.");
    }
  };
  useFocusEffect(
    useCallback(() => {
      loadProfileFromLocal();
      getPost();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        {/* <Text style={styles.title}>{title}</Text> */}

        <TouchableOpacity
          onPress={() => console.log("Info pressed")}
          style={styles.iconButton}
        >
          <Icon name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <Icon name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        {/* <Text style={styles.title}>{title}</Text> */}

        <TouchableOpacity
          onPress={() => console.log("Info pressed")}
          style={styles.iconButton}
        >
          <Icon name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Background Image */}

          <ImageBackground
            source={{
              uri:
                formData.coverPhoto ||
                "https://pantravel.vn/wp-content/uploads/2023/11/ngon-nui-thieng-cua-nhat-ban.jpg",
            }} // hoặc từ local như require("...")
            style={styles.backgroundImage}
          ></ImageBackground>

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
            onPress={() => navigation.navigate("PersonalInfo", { formData, profileId })}
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
          <TouchableOpacity
            style={styles.postInput}
            onPress={() => {
              navigation.navigate("CreatePostScreen");
            }}
          >
            <Text style={styles.postInputText}>Bạn đang nghĩ gì?</Text>
            <Ionicons name="image-outline" size={24} color="#8BC34A" />
          </TouchableOpacity>
        </View>

        <View>
          <PostFeed posts={posts} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
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
    paddingVertical: 5,
  },
  reactionButtons: {
    width: 180,
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    paddingVertical: 5,
  },
  likeButton: {
    width: 90,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    padding: 6,
  },
  commentButton: {
    width: 90,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    padding: 6,
  },
  lockIcon: {
    width: 70,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  actionText: {
    marginLeft: 5,
    color: "#616161",
  },
  moreButton: {},
});

export default ProfileScreen;
