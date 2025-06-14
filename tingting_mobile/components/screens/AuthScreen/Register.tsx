import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Api_Auth } from "../../../apis/api_auth";

import {
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

type RootStackParamList = {
  Main: undefined;
  MessageScreen: { userId?: string; username?: string };
  Register: undefined;
  VerificationCode: {
    phoneNumber: string;
    firstname: string;
    surname: string;
    day: string;
    month: string;
    year: string;
    gender: string;
    email: string;
    password: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Register">;

function Register() {
  const navigation = useNavigation<NavigationProp>();

  const [firstname, setFirstname] = useState("");
  const [surname, setSurname] = useState("");
  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("1");
  const [year, setYear] = useState("2000");
  const [selectedGender, setSelectedGender] = useState("Nam");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSelected = (gender: string) => selectedGender === gender;

  const handleRegister = async () => {
    if (!firstname || !surname || !email || !phone || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const patternName = /^[A-Za-z]{1,30}$/;
    if (!patternName.test(firstname)) {
      Alert.alert("Lỗi", "Tên không hợp lệ!");
      return;
    }
    if (!patternName.test(surname)) {
      Alert.alert("Lỗi", "Họ không hợp lệ!");
      return;
    }

    const patternPhone = /0\d{9,10}/;
    if (!patternPhone.test(phone)) {
      Alert.alert("Lỗi", "Số điện thoại không hợp lệ!");
      return;
    }

    const patternEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!patternEmail.test(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ!");
      return;
    }

    if (password.length < 6 || password.length > 32) {
      Alert.alert("Lỗi", "Mật khẩu phải từ 6 đến 32 ký tự!");
      return;
    }

    const currentYear = new Date().getFullYear();
    if (parseInt(year) > currentYear) {
      Alert.alert("Lỗi", "Năm sinh không hợp lệ!");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu không khớp!");
      return;
    }

    const data = {
      firstname,
      surname,
      day,
      month,
      year,
      gender: selectedGender,
      email,
      phone,
      password,
    };

    try {
      const response = await Api_Auth.signUp(data);
      // console.log("Đăng ký thành công, user ID:", response.data.user._id);
      // Alert.alert("Thành công", "Đăng ký thành công!");

      navigation.navigate("VerificationCode", {
        phoneNumber: phone,
        firstname,
        surname,
        day,
        month,
        year,
        gender: selectedGender,
        email,
        password,
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert("Lỗi", error.response?.data?.message || "Đã xảy ra lỗi!");
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color="#fff"
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Đăng ký</Text>
      </View>

      <ScrollView contentContainerStyle={styles.bodyContainer}>
        <Text style={styles.txt01}>Tạo một tài khoản mới</Text>
        <Text style={styles.txt02}>Thật nhanh chóng và dễ dàng</Text>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <CustomTextInput
              placeholder="Tên"
              value={firstname}
              onChangeText={setFirstname}
            />
          </View>
          <View style={styles.halfInput}>
            <CustomTextInput
              placeholder="Họ"
              value={surname}
              onChangeText={setSurname}
            />
          </View>
        </View>

        <Text style={styles.label}>Ngày sinh của bạn?</Text>
        <View style={styles.row}>
          <Picker
            selectedValue={day}
            style={styles.thirdInput}
            onValueChange={(itemValue) => setDay(itemValue)}
          >
            {[...Array(31).keys()].map((d) => (
              <Picker.Item label={`${d + 1}`} value={`${d + 1}`} key={d + 1} />
            ))}
          </Picker>
          <Picker
            selectedValue={month}
            style={styles.thirdInput}
            onValueChange={(itemValue) => setMonth(itemValue)}
          >
            {[...Array(12).keys()].map((m) => (
              <Picker.Item label={`${m + 1}`} value={`${m + 1}`} key={m + 1} />
            ))}
          </Picker>
          <Picker
            selectedValue={year}
            style={styles.thirdInput}
            onValueChange={(itemValue) => setYear(itemValue)}
          >
            {Array.from({ length: 100 }, (_, i) => 2025 - i).map((y) => (
              <Picker.Item label={`${y}`} value={`${y}`} key={y} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.row}>
          {["Nữ", "Nam", "Khác"].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.radioButton,
                isSelected(gender) && styles.radioButtonSelected,
              ]}
              onPress={() => setSelectedGender(gender)}
            >
              <Text
                style={
                  isSelected(gender)
                    ? styles.radioTextSelected
                    : styles.radioText
                }
              >
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CustomTextInput
          placeholder="Địa chỉ email"
          value={email}
          onChangeText={setEmail}
        />
        <CustomTextInput
          placeholder="Số điện thoại di động"
          value={phone}
          onChangeText={setPhone}
        />
        <CustomTextInput
          placeholder="Nhập mật khẩu mới"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <CustomTextInput
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <CustomButton title="Đăng ký" onPress={handleRegister} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backIcon: { marginRight: 12 },
  headerText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  bodyContainer: { padding: 16 },
  txt01: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 4,
  },
  txt02: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  halfInput: { width: "48%" },
  thirdInput: {
    width: "32%",
    backgroundColor: "#f5f5f5",
  },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  radioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    marginHorizontal: 4,
    backgroundColor: "#fff",
  },
  radioButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#E0F0FF",
  },
  radioText: { color: "#000" },
  radioTextSelected: { color: "#007AFF", fontWeight: "bold" },
});

export default Register;
