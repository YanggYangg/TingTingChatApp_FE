import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomButton from "../../../components/button/CustomButton";

function Welcome() {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text>Welcome to TingTingChatApp</Text>
      </View>
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Đăng nhập"
          backgroundColor="#007AFF"
          onPress={() => navigation.navigate("Login")}
        />

        <CustomButton
          title="Tạo tài khoản mới"
          backgroundColor="#eee"
          textColor="#000"
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {},
  buttonContainer: {},
});

export default Welcome;
