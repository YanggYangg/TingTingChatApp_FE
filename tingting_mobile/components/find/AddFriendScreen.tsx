import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert
} from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { Api_Profile } from "@/apis/api_profile";
import { Api_FriendRequest } from "@/apis/api_friendRequest";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddFriendScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
    // Lấy userId hiện tại từ AsyncStorage
    useEffect(() => {
      const fetchUserId = async () => {
        try {
          const id = await AsyncStorage.getItem("userId");
          setUserId(id);
        } catch (error) {
          console.log("Lỗi lấy userId từ AsyncStorage:", error);
        }
      };
      fetchUserId();
    }, []);

  const handleSearch = async () => {
    if(!userId) {
      Alert.alert("Không tìm thấy userId hiện tại");
      return;
    }

    try{
      const res = await Api_Profile.getProfiles();
      const allUsers = res.data.users;

      const foundUser =  allUsers.find((u: { phone: string; }) => u.phone === phone);

      if(!foundUser) {
        Alert.alert("Không tìm thấy người dùng ");
        setSearchResult(null);
        return;
      }

      setSearchResult(foundUser);

      const statusRes = await Api_FriendRequest.checkFriendStatus(
        {
          userIdA: userId,
          userIdB: foundUser._id,
        }
      );
      setStatus(statusRes.data);
    }catch (err) {
      console.error("Lỗi tìm kiếm", err);
    }
  }

return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Thêm bạn</Text>
      </View>

      {/* Nhập số điện thoại */}
      <View style={styles.phoneInputContainer}>
        <Text style={styles.prefix}>+84</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại"
          keyboardType="number-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="arrow-forward-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

        {/* Kết quả tìm kiếm */}
      {searchResult && (
        <View style={styles.resultContainer}>
          <Image
            source={{ uri: searchResult.avatar }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{searchResult.firstname} {searchResult.surname}</Text>
            <Text style={styles.phone}>+84 {searchResult.phone}</Text>
            <Text style={styles.status}>Trạng thái: {status}</Text>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    height: 50,
  },
  prefix: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  phone: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default AddFriendScreen;
