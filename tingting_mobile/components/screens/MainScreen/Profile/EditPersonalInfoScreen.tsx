"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Api_Profile } from "@/apis/api_profile";

// Thay đổi localhost thành IP thực tế của máy tính
const API_BASE_URL = "http://192.168.24.106:3001/api/v1";

export default function EditProfileScreen() {
  const navigation = useNavigation();
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
  const [profileImage, setProfileImage] = useState(
    "https://anhnail.com/wp-content/uploads/2024/10/Hinh-gai-xinh-k8-cute.jpg"
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdate, setBirthdate] = useState(new Date(2000, 0, 1));
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const loadProfileAndToken = async () => {
      try {
        // Lấy token trước
        const authToken = await AsyncStorage.getItem("token");
        if (authToken) {
          setToken(authToken);
        }

        // Sau đó lấy profile
        const storedProfile = await AsyncStorage.getItem("profile");
        if (!storedProfile) return;

        const profile = JSON.parse(storedProfile);
        console.log("Loaded profile:", profile);

        // Kiểm tra và xử lý dateOfBirth
        let date = new Date();
        if (profile.dateOfBirth) {
          try {
            date = new Date(profile.dateOfBirth);
            if (isNaN(date.getTime())) {
              // Nếu date không hợp lệ, sử dụng ngày mặc định
              date = new Date();
              console.log("Invalid date format, using default date");
            }
          } catch (error) {
            console.error("Error parsing date:", error);
            date = new Date();
          }
        }

        setBirthdate(date);
        setProfileImage(
          profile.avatar ||
            "https://anhnail.com/wp-content/uploads/2024/10/Hinh-gai-xinh-k8-cute.jpg"
        );

        setFormData((prev) => ({
          ...prev,
          firstname: profile.firstname || "",
          surname: profile.surname || "",
          phone: profile.phone || "",
          avatar: profile.avatar || null,
          coverPhoto: profile.coverPhoto || null,
          gender: profile.gender === "male" ? "Nam" : "Nữ",
          day: date.getDate().toString(),
          month: (date.getMonth() + 1).toString(),
          year: date.getFullYear().toString(),
        }));
      } catch (error) {
        console.error("Error loading profile from localStorage:", error);
        Alert.alert(
          "Lỗi",
          "Không thể tải thông tin người dùng. Vui lòng thử lại sau."
        );
      }
    };

    loadProfileAndToken();
  }, []);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Chúng tôi cần quyền truy cập ảnh.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Giảm chất lượng để giảm kích thước file
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        console.log("Selected image:", result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Có lỗi khi chọn ảnh.");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setBirthdate(selectedDate);

      // Update formData with new date values
      setFormData((prev) => ({
        ...prev,
        day: selectedDate.getDate().toString(),
        month: (selectedDate.getMonth() + 1).toString(),
        year: selectedDate.getFullYear().toString(),
      }));
    }
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Kiểm tra token
      if (!token) {
        Alert.alert("Lỗi", "Phiên làm việc đã hết. Vui lòng đăng nhập lại.");
        return;
      }

      let avatarUrl = formData.avatar;

      // Nếu có ảnh mới và là ảnh từ thiết bị
      if (profileImage && profileImage.startsWith("file://")) {
        const uploadForm = new FormData();

        const filename = profileImage.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : "image/jpeg";

        uploadForm.append("avatar", {
          uri: profileImage,
          name: filename || "avatar.jpg",
          type,
        });

        console.log("Sending request to:", `${API_BASE_URL}/profile/upload`);
        const uploadRes = await axios.put(
          `${API_BASE_URL}/profile/upload`,
          uploadForm,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
            timeout: 10000,
          }
        );

        console.log("Upload response:", uploadRes.data);

        avatarUrl = uploadRes.data?.data?.fileUrl || avatarUrl;
      } else {
        console.log("Không có ảnh mới, bỏ qua upload avatar.");
      }

      // Chuẩn bị data gửi lên updateProfile
      const dateOfBirth = new Date(
        Number.parseInt(formData.year),
        Number.parseInt(formData.month) - 1,
        Number.parseInt(formData.day)
      ).toISOString();

      const updatedForm = {
        ...formData,
        avatar: avatarUrl,
        dateOfBirth,
        gender: formData.gender === "Nam" ? "male" : "female",
      };

      if (!updatedForm.phone) delete updatedForm.phone; // Xóa nếu không có

      const userId = await AsyncStorage.getItem("userId");
      const response = await Api_Profile.updateProfile(userId, updatedForm);

      if (response.data) {
        await AsyncStorage.removeItem("profile");
        await AsyncStorage.setItem(
          "profile",
          JSON.stringify(response.data.profile)
        );
        console.log("Cập nhật thành công:", response.data.profile);
      }

      Alert.alert("Đã lưu", "Thông tin cá nhân đã được cập nhật.");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error.response || error);

      let errorMessage = "Không thể cập nhật thông tin. Vui lòng thử lại sau.";

      if (error.response) {
        errorMessage = `Lỗi máy chủ: ${error.response.status}. ${
          error.response.data?.message || ""
        }`;
      } else if (error.request) {
        errorMessage =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
      }

      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
      </View>

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.profileImageContainer}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <Feather name="camera" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Tên */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Họ:</Text>
          <TextInput
            style={styles.textInput}
            value={formData.surname}
            onChangeText={(text) => updateField("surname", text)}
            placeholder="Nhập họ"
          />
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tên:</Text>
          <TextInput
            style={styles.textInput}
            value={formData.firstname}
            onChangeText={(text) => updateField("firstname", text)}
            placeholder="Nhập tên"
          />
        </View>

        {/* Ngày sinh */}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Ngày sinh:</Text>
          <Text style={styles.infoValue}>
            {birthdate.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </Text>
          <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)}>
            <Feather name="edit-2" size={20} color="#757575" />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={birthdate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.doneButtonText}>Xong</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Giới tính */}
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderOption,
              formData.gender === "Nam" && styles.genderSelected,
            ]}
            onPress={() => updateField("gender", "Nam")}
          >
            <View style={styles.radioOuter}>
              {formData.gender === "Nam" && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.genderText}>Nam</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderOption,
              formData.gender === "Nữ" && styles.genderSelected,
            ]}
            onPress={() => updateField("gender", "Nữ")}
          >
            <View style={styles.radioOuter}>
              {formData.gender === "Nữ" && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.genderText}>Nữ</Text>
          </TouchableOpacity>
        </View>

        {/* Nút lưu */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>
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
    padding: 20,
  },
  profileImageContainer: {
    alignSelf: "center",
    marginBottom: 30,
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  infoValue: {
    fontSize: 18,
    flex: 1,
  },
  textInput: {
    fontSize: 18,
    flex: 1,
    padding: 0,
  },
  genderContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 30,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 30,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2196F3",
  },
  genderText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  datePickerContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  doneButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "500",
    width: 80,
  },
});
