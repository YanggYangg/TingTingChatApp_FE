import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { Api_Auth } from "@/apis/api_auth";

const EnterotpForForgotPassword: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { phone, email } = route.params; // Lấy thông tin từ route params
  const [otp, setotp] = useState("");

  const handleVerifyotp = async () => {
    if (!otp) {
      Alert.alert("Lỗi", "Vui lòng nhập mã xác nhận.");
      return;
    }
    const patternOTP = /^\d{6}$/; // Giả sử mã OTP là 6 chữ số
    if (!patternOTP.test(otp)) {
      Alert.alert("Lỗi", "Mã xác nhận không hợp lệ!");
      return;
    }

    try {
      const data = { otp, email };
      const response = await Api_Auth.verifyOTP(data);
      if (response.success === true) {
        navigation.navigate("ResetPassword", { phone, email });
      }
    } catch (error) {
      Alert.alert("Lỗi", "Mã xác nhận không đúng.");
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
        <Text style={styles.headerText}>Nhập mã xác nhận</Text>
      </View>

      {/* Body */}
      <View style={styles.bodyContainer}>
        <Text style={styles.instruction}>
          Mã xác nhận đã được gửi đến email hoặc số điện thoại của bạn.
        </Text>

        <CustomTextInput
          placeholder="Nhập mã xác nhận"
          value={otp}
          onChangeText={setotp}
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonWrapper}>
          <CustomButton
            title="Xác nhận"
            backgroundColor="#007AFF"
            onPress={handleVerifyotp}
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
  instruction: {
    fontSize: 16,
    marginBottom: 16,
    color: "#333",
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

export default EnterotpForForgotPassword;
