import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const Login: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!phoneNumber || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // Sau này gọi API login ở đây
    console.log("Logging in with:", { phoneNumber, password });

    // Ví dụ: gọi BE và điều hướng khi thành công
    // loginAPI(phoneNumber, password)
    //   .then(res => navigation.navigate("Home"))
    //   .catch(err => Alert.alert("Lỗi", "Đăng nhập thất bại"));
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
        <Text style={styles.headerText}>Đăng nhập</Text>
      </View>

<<<<<<< HEAD
=======
      {/* Form */}
>>>>>>> 323497703f3ad89f51bf0aaaf6b5d93afe087f56
      <View style={styles.bodyContainer}>
        <CustomTextInput
          placeholder="Nhập số điện thoại của bạn"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <CustomTextInput
          placeholder="Nhập mật khẩu của bạn"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
      </View>

<<<<<<< HEAD
=======
      {/* Quên mật khẩu */}
      <View style={styles.forgetPass}>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={{ color: "#007AFF", textAlign: "right" }}>
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Nút đăng nhập */}
>>>>>>> 323497703f3ad89f51bf0aaaf6b5d93afe087f56
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Đăng nhập"
          backgroundColor="#007AFF"
          onPress={handleLogin}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
<<<<<<< HEAD
    backgroundColor: '#007AFF',
=======
    backgroundColor: "#007AFF",
>>>>>>> 323497703f3ad89f51bf0aaaf6b5d93afe087f56
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backIcon: {
    marginRight: 12,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  bodyContainer: {
    padding: 16,
    marginTop: 25,
  },
  forgetPass: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    alignItems: "flex-end",
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
});

export default Login;
