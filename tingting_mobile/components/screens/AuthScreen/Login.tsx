import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";

function Login() {
  const navigation = useNavigation();

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
        <Text style={styles.headerText}>Đăng nhập</Text>
      </View>

      {/* Body */}
      <View style={styles.bodyContainer}>
        <CustomTextInput placeholder="Nhập số điện thoại của bạn" />
        <CustomTextInput placeholder="Nhập mật khẩu của bạn" secureTextEntry={true} />
      </View>

      {/* Button */}
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Đăng nhập"
          backgroundColor="#007AFF"
          onPress={() => console.log("Login")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#1E90FF',
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
  },
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
});

export default Login;
