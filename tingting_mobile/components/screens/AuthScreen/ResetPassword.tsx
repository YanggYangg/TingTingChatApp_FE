import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { Api_Auth } from "../../../apis/api_auth";

const ResetPassword: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { phoneNumber } = route.params || {};

  const handleConfirm = async () => {
    const data = {phone: phoneNumber, newPassword };
    // Simple client-side validation
    if (!newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mật khẩu.");
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 32) {
      Alert.alert("Lỗi", "Mật khẩu phải từ 6 đến 32 ký tự!");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const response = await Api_Auth.updateNewPassword(data);
      if (response.success === true) {
        //chuyển trang vào login
        Alert.alert("Đổi mật khẩu thành công", "Bạn có thể đăng nhập với mật khẩu mới.");
        navigation.replace("Login");
      }
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
        <Text style={styles.headerText}>Xác nhận mật khẩu</Text>
      </View>

      {/* Body */}
      <View style={styles.bodyContainer}>
        <CustomTextInput
          placeholder="Nhập mật khẩu mới"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <CustomTextInput
          placeholder="Xác nhận mật khẩu mới"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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

export default ResetPassword;
