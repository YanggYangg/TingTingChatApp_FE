import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { Api_Auth } from "../../../apis/api_auth";

const ForgotPassword: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [phone, setphone] = useState("");
  const [email, setEmail] = useState("");

  const handleConfirm = async () => {
    if (!phone || !email) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ số điện thoại và email.");
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

    try {
      const data = { phone, email };
      const response = await Api_Auth.forgotPassword(data);
      if (response.success === true) {
        console.log("Thông tin xác nhận:", { phone, email });
        Alert.alert("Thành công", "Thông tin đã được gửi. Vui lòng kiểm tra.");
        //chuyển trang và truyền phone , email
        navigation.navigate("EnterCodeForForgotPassword", {
          phone: phone,
          email: email,
        });
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
        <Text style={styles.headerText}>Quên mật khẩu</Text>
      </View>

      {/* Body */}
      <View style={styles.bodyContainer}>
        <CustomTextInput
          placeholder="Nhập số điện thoại của bạn"
          value={phone}
          onChangeText={setphone}
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
