import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { Api_Auth } from "../../../apis/api_auth"; // Đường dẫn đến Api_Auth của bạn

const Login: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [phone, setphone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
  

    if (password.length < 6 || password.length > 32) {
      Alert.alert("Lỗi", "Mật khẩu phải từ 6 đến 32 ký tự!");
      return;
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
        <Text style={styles.headerText}>Đăng nhập</Text>
      </View>

      <View style={styles.bodyContainer}>
        <CustomTextInput
          placeholder="Nhập số điện thoại của bạn"
          value={phone}
          onChangeText={setphone}
        />
        <CustomTextInput
          placeholder="Nhập mật khẩu của bạn"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.forgetPass}>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={{ color: "#007AFF", textAlign: "right" }}>
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#007AFF",
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
