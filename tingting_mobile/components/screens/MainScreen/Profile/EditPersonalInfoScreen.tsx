import { useState } from "react"
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
} from "react-native"
import { Feather } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useNavigation } from "@react-navigation/native"

export default function EditProfileScreen() {
  const navigation = useNavigation()

  const [name, setName] = useState("Nguyễn Văn A")
  const [birthdate, setBirthdate] = useState(new Date(2000, 0, 1))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [gender, setGender] = useState("Nam")
  const [profileImage, setProfileImage] = useState(
    "https://anhnail.com/wp-content/uploads/2024/10/Hinh-gai-xinh-k8-cute.jpg"
  )
  const [editingName, setEditingName] = useState(false)

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Chúng tôi cần quyền truy cập ảnh.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      })

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri)
      }
    } catch (error) {
      console.log("Error picking image:", error)
      Alert.alert("Error", "Có lỗi khi chọn ảnh.")
    }
  }

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setBirthdate(selectedDate)
    }
    if (Platform.OS === "android") {
      setShowDatePicker(false)
    }
  }

  const toggleEditName = () => setEditingName(!editingName)

  const handleSave = () => {
    const payload = {
      name,
      birthdate: birthdate.toISOString(),
      gender,
      avatar: profileImage,
    }

    console.log("Saving user info:", payload)
    Alert.alert("Đã lưu", "Thông tin cá nhân đã được cập nhật.")
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
          {editingName ? (
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          ) : (
            <Text style={styles.infoValue}>{name}</Text>
          )}
          <TouchableOpacity onPress={toggleEditName}>
            <Feather name={editingName ? "x" : "edit-2"} size={20} color="#757575" />
          </TouchableOpacity>
        </View>

        {/* Ngày sinh */}
        <View style={styles.infoItem}>
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
              <TouchableOpacity style={styles.doneButton} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.doneButtonText}>Xong</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Giới tính */}
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderOption, gender === "Nam" && styles.genderSelected]}
            onPress={() => setGender("Nam")}
          >
            <View style={styles.radioOuter}>
              {gender === "Nam" && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.genderText}>Nam</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genderOption, gender === "Nữ" && styles.genderSelected]}
            onPress={() => setGender("Nữ")}
          >
            <View style={styles.radioOuter}>
              {gender === "Nữ" && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.genderText}>Nữ</Text>
          </TouchableOpacity>
        </View>

        {/* Nút lưu */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Lưu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
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
})
