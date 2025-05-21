import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import axios from "axios";

type RootStackParamList = {
  Main: undefined;
  MessageScreen: { userId?: string; username?: string };
  Login: undefined;
  PersonalInfo: {
    profileId: string;
    formData: {
      firstname: string;
      surname: string;
      day: string;
      month: string;
      year: string;
      gender: string;
      phone: string;
      avatar: string | null;
      coverPhoto: string | null;
    };
  };
};

type PersonalInfoRouteProp = RouteProp<RootStackParamList, "PersonalInfo">;

export default function PersonalInfoScreen() {
  const navigation =
    useNavigation<
      NativeStackScreenProps<RootStackParamList, "PersonalInfo">["navigation"]
    >();
  const route = useRoute<PersonalInfoRouteProp>();
  const { profileId } = route.params;
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

  const loadProfileById = async () => {
    try {
      const response = await axios.get(
        `http://192.168.1.15:3001/api/v1/profile/${profileId}`
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
  useFocusEffect(
    useCallback(() => {
      loadProfileById();
    }, [])
  );
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Picture and Name */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: formData.avatar || "https://example.com/default-avatar.png",
            }}
            style={styles.profilePicture}
          />
          <Text style={styles.profileName}>
            {" "}
            {formData.firstname} {formData.surname}
          </Text>
        </View>

        {/* Personal Info */}
        <View style={styles.infoSection}>
          {/* Gender */}
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Giới tính</Text>
            <Text style={styles.infoValue}>
              {" "}
              {formData.gender == "female" ? "Nữ" : "Nam"}
            </Text>
          </View>

          {/* Birthday */}
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Ngày sinh</Text>
            <Text style={styles.infoValue}>
              {" "}
              {formData.day}/{formData.month}/{formData.year}
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Điện thoại</Text>
            <View>
              <Text style={styles.infoValue}> {formData.phone}</Text>
              <Text style={styles.infoNote}>
                Số điện thoại chỉ hiển thị với người có lưu số bạn trong danh bạ
                máy
              </Text>
            </View>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("EditPersonalInfo", { formData })}
        >
          <Feather name="edit-2" size={18} color="#333" />
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
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
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#2196F3",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoSection: {
    backgroundColor: "white",
    marginTop: 10,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  infoLabel: {
    fontSize: 16,
    color: "#757575",
  },
  infoValue: {
    fontSize: 16,
    textAlign: "right",
  },
  infoNote: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 5,
    maxWidth: 200,
    textAlign: "right",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  editButtonText: {
    fontSize: 16,
    marginLeft: 10,
  },
});
