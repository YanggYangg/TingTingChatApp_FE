import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomButton from "../../../components/button/CustomButton";

const Welcome: React.FC<{ navigation: any }> = ({ navigation }) => {
  const navigate = useNavigation();
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.text}>Welcome to {'\n'} TingTingChatApp</Text>
        <Image source={require('../../../assets/images/TingTing_Chat.png')} style={styles.image} />
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Đăng nhập"
          backgroundColor="#007AFF"
          onPress={() => navigation.navigate("Login")}
        />

        <CustomButton
          title="Tạo tài khoản mới"
          backgroundColor="#ddd"
          textColor="#000"
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#007AFF",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  image:{
    width: 300,
    height: 300,
    borderRadius: 100,
    marginBottom: 20,
  },
  buttonContainer: {
    padding: 20,
    justifyContent: "center",
    //cho nằm xuống đáy
  },
});

export default Welcome;
