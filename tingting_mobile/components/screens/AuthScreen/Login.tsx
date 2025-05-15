import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { Api_Auth } from "../../../apis/api_auth"; // Đường dẫn đến Api_Auth của bạn

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

type RootStackParamList = {
  Main: undefined;
  MessageScreen: { userId?: string; username?: string };
  Login: undefined;
};

type LoginProps = NativeStackScreenProps<RootStackParamList, "Login">;

const Login: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [phone, setphone] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    const patternPhone = /0\d{9,10}/;
    if (!patternPhone.test(phone)) {
      Alert.alert("Lỗi", "Số điện thoại không hợp lệ!");
      return;
    }

    if (password.length < 6 || password.length > 32) {
      Alert.alert("Lỗi", "Mật khẩu phải từ 6 đến 32 ký tự!");
      return;
    }

    try {
      const response = await Api_Auth.login({ phone, password });
      // if (response.success === true && response.login === true) {
      //   await AsyncStorage.setItem("token", response.token);
      //   navigation.replace("Main");
      // }
      if (response.success === true) {
        navigation.navigate("VerificationCode", { phoneNumber: phone });
      // } else {
      //   Alert.alert("Lỗi 1", response.message || "Đăng nhập thất bại");
      // }
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Đã có lỗi xảy ra");
    }
  };
  
  // const handleValidateToken = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem("token");
  //     if (!token) return;
  //     const res = await axios.post(
  //       "http://192.168.1.17:3002/api/v1/auth/validate-token",
  //       { phone },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     navigation.replace("Main");
  //   } catch (error: any) {
  //     navigation.navigate("VerificationCode", { phoneNumber: phone });
  //   }
  // };
  // const handleValidateToken = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem("token");
  //     if (!token) return;
  //     const res = await axios.post(
  //       "http://192.168.1.17:3002/api/v1/auth/validate-token",
  //       { phone },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     navigation.replace("Main");
  //   } catch (error: any) {
  //     navigation.navigate("VerificationCode", { phoneNumber: phone });
  //   }
  // };

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



// ==== nhi 

// import React, { useState } from "react";
// import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
// import CustomTextInput from "../../textfield/CustomTextInput";
// import CustomButton from "@/components/button/CustomButton";
// import { Ionicons } from "@expo/vector-icons";
// import { Api_Auth } from "../../../apis/api_auth";
// import { NativeStackScreenProps } from "@react-navigation/native-stack";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// type RootStackParamList = {
//   Main: undefined;
//   MessageScreen: { userId?: string; username?: string };
//   Login: undefined;
// };

// type LoginProps = NativeStackScreenProps<RootStackParamList, "Login">;

// const Login: React.FC<{ navigation: any }> = ({ navigation }) => {
//   const [phone, setphone] = useState("");
//   const [password, setPassword] = useState("");

//   const handleLogin = async () => {
//     if (!phone || !password) {
//       Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
//       return;
//     }
//     const patternPhone = /0\d{9,10}/;
//     if (!patternPhone.test(phone)) {
//       Alert.alert("Lỗi", "Số điện thoại không hợp lệ!");
//       return;
//     }
//     if (password.length < 6 || password.length > 32) {
//       Alert.alert("Lỗi", "Mật khẩu phải từ 6 đến 32 ký tự!");
//       return;
//     }

//     try {
//       const response = await Api_Auth.login({ phone, password });
//       if (response.success === true) {
//         // Store token, userId, phone, and profile in AsyncStorage
//         await AsyncStorage.setItem("token", response.data.token);
//         await AsyncStorage.setItem("phone", phone);
//         await AsyncStorage.setItem("userId", response.data.user.userId);
//         await AsyncStorage.setItem("profile", JSON.stringify(response.data.profile.data.user));
//         console.log("Login response:", response.data);
//         console.log("Token stored:", response.data.token);
//         console.log("UserId stored:", response.data.user.userId);
//         console.log("Profile stored:", response.data.profile.data.user);
//         // Navigate directly to Main
//         navigation.replace("Main");
//       } else {
//         Alert.alert("Lỗi", response.message || "Đăng nhập thất bại");
//       }
//     } catch (error: any) {
//       Alert.alert("Lỗi", error.response?.data?.message || "Đã có lỗi xảy ra");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.headerContainer}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons
//             name="arrow-back-outline"
//             size={28}
//             color="#fff"
//             style={styles.backIcon}
//           />
//         </TouchableOpacity>
//         <Text style={styles.headerText}>Đăng nhập</Text>
//       </View>

//       <View style={styles.bodyContainer}>
//         <CustomTextInput
//           placeholder="Nhập số điện thoại của bạn"
//           value={phone}
//           onChangeText={setphone}
//         />
//         <CustomTextInput
//           placeholder="Nhập mật khẩu của bạn"
//           secureTextEntry={true}
//           value={password}
//           onChangeText={setPassword}
//         />
//       </View>

//       <View style={styles.forgetPass}>
//         <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
//           <Text style={{ color: "#007AFF", textAlign: "right" }}>
//             Quên mật khẩu?
//           </Text>
//         </TouchableOpacity>
//       </View>
//       <View style={styles.buttonContainer}>
//         <CustomButton
//           title="Đăng nhập"
//           backgroundColor="#007AFF"
//           onPress={handleLogin}
//         />
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   headerContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#007AFF",
//     paddingTop: 10,
//     paddingBottom: 20,
//     paddingHorizontal: 16,
//   },
//   backIcon: {
//     marginRight: 12,
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#fff",
//   },
//   bodyContainer: {
//     padding: 16,
//     marginTop: 25,
//   },
//   forgetPass: {
//     paddingHorizontal: 16,
//     marginTop: 10,
//     marginBottom: 10,
//     alignItems: "flex-end",
//   },
//   buttonContainer: {
//     paddingHorizontal: 16,
//     marginTop: 20,
//   },
// });

// export default Login;
