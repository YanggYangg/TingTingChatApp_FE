import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import CustomTextInput from "../../textfield/CustomTextInput";
import CustomButton from "@/components/button/CustomButton";

function UpdateProfile() {
  const navigation = useNavigation();

  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("1");
  const [year, setYear] = useState("2000");
  const [selectedGender, setSelectedGender] = useState("");

  const isSelected = (gender: string) => selectedGender === gender;

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
        <Text style={styles.headerText}>Đăng ký</Text>
      </View>

      <View style={styles.bodyContainer}>
        <Text style={styles.txt01}>Tạo một tài khoản mới</Text>
        <Text style={styles.txt02}>Thật nhanh chóng và dễ dàng</Text>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <CustomTextInput placeholder="Tên" />
          </View>
          <View style={styles.halfInput}>
            <CustomTextInput placeholder="Họ" />
          </View>
        </View>

        <Text style={styles.label}>Ngày sinh của bạn?</Text>
        <View style={styles.row}>
          <Picker
            selectedValue={day}
            style={styles.thirdInput}
            onValueChange={(itemValue) => setDay(itemValue)}
          >
            {[...Array(31).keys()].map((d) => (
              <Picker.Item label={`${d + 1}`} value={`${d + 1}`} key={d + 1} />
            ))}
          </Picker>

          <Picker
            selectedValue={month}
            style={styles.thirdInput}
            onValueChange={(itemValue) => setMonth(itemValue)}
          >
            {[...Array(12).keys()].map((m) => (
              <Picker.Item label={`${m + 1}`} value={`${m + 1}`} key={m + 1} />
            ))}
          </Picker>

          <Picker
            selectedValue={year}
            style={styles.thirdInput}
            onValueChange={(itemValue) => setYear(itemValue)}
          >
            {Array.from({ length: 100 }, (_, i) => 2025 - i).map((y) => (
              <Picker.Item label={`${y}`} value={`${y}`} key={y} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.row}>
          {["Nữ", "Nam", "Khác"].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.radioButton,
                isSelected(gender) && styles.radioButtonSelected,
              ]}
              onPress={() => setSelectedGender(gender)}
            >
              <Text
                style={
                  isSelected(gender)
                    ? styles.radioTextSelected
                    : styles.radioText
                }
              >
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <CustomTextInput 
        placeholder="Địa chỉ email" />
        <CustomTextInput 
        placeholder="Số điện thoại di động" />
        <CustomTextInput 
        placeholder="Nhập mật khẩu mới" secureTextEntry />
        <CustomTextInput 
        placeholder="Nhập lại mật khẩu" secureTextEntry />

        <CustomButton title="Cập nhật thông tin" 
        onPress={() => console.log('Cập nhật thông tin')} />
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
  },
  txt01: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 4,
  },
  txt02: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  halfInput: {
    width: "48%",
  },
  thirdInput: {
    width: "32%",
    backgroundColor: "#f5f5f5",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  radioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    marginHorizontal: 4,
    backgroundColor: "#fff",
  },
  radioButtonSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#E0F0FF",
  },
  radioText: {
    color: "#000",
  },
  radioTextSelected: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});

export default UpdateProfile;
