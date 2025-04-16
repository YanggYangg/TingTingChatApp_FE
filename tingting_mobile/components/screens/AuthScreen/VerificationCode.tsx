"use client"

import type React from "react"
import { useState, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native"
import CustomButton from "@/components/button/CustomButton"
import { Ionicons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Api_Auth } from "../../../apis/api_auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Main: undefined
  Login: undefined
  VerificationCode: { phoneNumber: string }
}

type VerificationCodeProps = NativeStackScreenProps<RootStackParamList, "VerificationCode">

const VerificationCode: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { phoneNumber = "(+84) 372 374 650" } = route.params || {}
  const [verificationCode, setVerificationCode] = useState<string[]>(Array(6).fill(""))
  const inputRefs = useRef<Array<TextInput | null>>(Array(6).fill(null))
  const {
    firstname,
    surname,
    day,
    month,
    year,
    gender,
    email,
    password,
  } = route.params || {}

  

  const handleCodeChange = (text: string, index: number) => {
    if (text.length <= 1) {
      const newCode = [...verificationCode]
      newCode[index] = text
      setVerificationCode(newCode)

      // Move to next input if current input is filled
      if (text.length === 1 && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.nativeEvent.key === "Backspace" && index > 0 && !verificationCode[index]) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleContinue = async () => {
    const code = verificationCode.join("")
    if (code.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ mã xác thực")
      return
    }

    // TODO: Verify the code with your API
    console.log("Verification code:", code)

    // Simulate API call
    const data = { phone: phoneNumber, otp: code };
    try {
      if (firstname) {
        const data = {
          phone: phoneNumber,
          otp: code,
          firstname,
          surname,
          day,
          month,
          year,
          gender,
          email,
          password,
        };
        console.log("Data = ", data);

        const response = await Api_Auth.create_account(data);
        Alert.alert("Đăng kí thành công");
        navigation.replace("Login")
        
       
      } else {
        const response = await Api_Auth.generate_token(data);
        await AsyncStorage.setItem("token", response.data.token);
        await AsyncStorage.setItem("userId", response.data.user.userId);
        console.log("Response = ", response.data);
        console.log("Token = ", response.data.token);
        console.log("UserId = ", response.data.user.userId);
        
        // Navigate to next screen on success
        navigation.replace("Main")
            
      }
    } catch (err) {
      Alert.alert("Lỗi", "Mã xác thực không đúng hoặc đã hết hạn!");
      
    }


    
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={28} color="#fff" style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Nhập mã xác thực</Text>
        </View>

        <View style={styles.bodyContainer}>
          <Text style={styles.warningText}>Vui lòng không chia sẻ mã xác thực để tránh mất tài khoản</Text>

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={40} color="#1E90FF" />
            </View>
          </View>

          <Text style={styles.phoneNumber}>{phoneNumber}</Text>

          <Text style={styles.instructionText}>Soạn tin nhắn nhận mã xác thực và điền vào bên dưới</Text>

          <View style={styles.codeInputContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.codeInput}
                value={verificationCode[index]}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity style={styles.guideLink}>
            <Text style={styles.guideLinkText}>Hướng dẫn nhận mã</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <CustomButton title="Tiếp tục" backgroundColor="#B8D0E0" textColor="#000" onPress={handleContinue} />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

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
    alignItems: "center",
  },
  warningText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
    color: "#333",
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  phoneNumber: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  codeInput: {
    width: 40,
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
    fontSize: 20,
    fontWeight: "bold",
  },
  guideLink: {
    marginBottom: 40,
  },
  guideLinkText: {
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 20,
  },
})

export default VerificationCode
