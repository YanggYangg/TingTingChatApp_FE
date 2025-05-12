import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import CustomButton from "../../../components/button/CustomButton";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Api_Auth } from "@/apis/api_auth";

type RootStackParamList = {
  Main: undefined;
  MessageScreen: { userId?: string; username?: string };
  Welcome: undefined;
};

type WelcomeProps = NativeStackScreenProps<RootStackParamList, "Welcome">;

const Welcome: React.FC<{ navigation: any }> = ({ navigation }) => {
  const handleLogin = async () => {
    console.log("handleLogin");
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("Token from AsyncStorage:", token); // Log the token value
      if (!token) {
        navigation.navigate("Login");
        return;
      }
      const response = await Api_Auth.validateToken(token);
      console.log("Token validation response:", response); // Log the response data
      if (response.success === true) {
        navigation.navigate("Main");
      }
    } catch (error) {
      console.error("Error validating token:", error);
      navigation.navigate("Login");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.text}>Welcome to {"\n"} TingTingChatApp</Text>
        <Image
          source={require("../../../assets/images/TingTing_Chat.png")}
          style={styles.image}
        />
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Đăng nhập"
          backgroundColor="#007AFF"
          onPress={() => handleLogin()}
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
  image: {
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
