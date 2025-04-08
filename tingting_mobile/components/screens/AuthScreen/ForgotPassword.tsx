import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Ionicons } from "@expo/vector-icons";

const ForgotPassword: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  const handleConfirm = async () => {
    // Validate input
    // if (!phoneNumber || !email) {
    //   Alert.alert("Lỗi", "Vui lòng nhập đầy đủ số điện thoại và email.");
    //   return;
    // }

    try {
      // Gọi API gửi mã OTP hoặc email xác nhận
      // const response = await fetch("https://your-api/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ phoneNumber, email }),
      // });
      // const data = await response.json();

      console.log("Thông tin xác nhận:", { phoneNumber, email });
      Alert.alert("Thành công", "Thông tin đã được gửi. Vui lòng kiểm tra.");
      navigation.navigate("EnterCodeForForgotPassword");
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi. Vui lòng thử lại sau.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back-outline"
            size={28}
            color="#fff"
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Quên mật khẩu</Text>
      </View>

      {/* Body */}
      <View style={styles.bodyContainer}>
        <CustomTextInput
          placeholder="Nhập số điện thoại của bạn"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <CustomTextInput
          placeholder="Nhập email"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <CustomButton
            title="Xác nhận"
            backgroundColor="#007AFF"
            onPress={handleConfirm}
          />
        </View>
        <View style={[styles.buttonWrapper, styles.leftMargin]}>
          <CustomButton
            title="Quay lại"
            backgroundColor="#e4e7ec"
            onPress={() => navigation.goBack()}
          />
        </View>
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
    backgroundColor: "#1E90FF",
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  buttonWrapper: {
    flex: 1,
  },
  leftMargin: {
    marginLeft: 12,
  },
});

export default ForgotPassword;
