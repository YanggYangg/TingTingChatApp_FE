import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";
import { Api_Profile } from "@/apis/api_profile";
import { Api_FriendRequest } from "@/apis/api_friendRequest";
import AsyncStorage from "@react-native-async-storage/async-storage";

//socket
import socket from "../../utils/socketFriendRequest";

const AddFriendScreen = ({ navigation }) => {
  const [phone, setPhone] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // 🔐 Lấy userId từ AsyncStorage và kết nối socket
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        setUserId(id);

        if (id) {
          socket.connect();
          socket.emit("add_user", id);
        }
      } catch (error) {
        console.log("Lỗi lấy userId từ AsyncStorage:", error);
      }
    };

    fetchUserId();

    // 👂 Lắng nghe khi lời mời được chấp nhận
    socket.on("friend_request_accepted", ({ fromUserId }) => {
      if (searchResult && fromUserId === searchResult._id) {
        setStatus("friend");
      }
    });

    return () => {
      socket.disconnect();
      socket.off("friend_request_accepted");
    };
  }, [searchResult]);

  useEffect(() => {
    // Lắng nghe khi bị từ chối lời mời
    socket.on("friend_request_rejected", ({ fromUserId }) => {
      if (searchResult && fromUserId === searchResult._id) {
        setStatus(""); // Trạng thái trở lại "chưa kết bạn"
        Alert.alert("❌ Lời mời đã bị từ chối");
      }
    });

    return () => {
      socket.off("friend_request_rejected");
    };
  }, [searchResult]);

  useEffect(() => {
    if (!userId) return;

    socket.on("friend_request_sent", ({ toUserId }) => {
      if (searchResult && toUserId === searchResult._id) {
        setStatus("pending");
      }
    });

    socket.on("friend_request_revoked_self", ({ toUserId }) => {
      if (searchResult && toUserId === searchResult._id) {
        setStatus("");
      }
    });

    return () => {
      socket.off("friend_request_sent");
      socket.off("friend_request_revoked_self");
    };
  }, [searchResult, userId]);

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
    if (!userId) {
      Alert.alert("Không tìm thấy userId hiện tại");
      return;
    }

    try {
      const res = await Api_Profile.getProfiles();
      const allUsers = res.data.users;

      const foundUser = allUsers.find(
        (u: { phone: string }) => u.phone === phone
      );

      if (!foundUser) {
        Alert.alert("Không tìm thấy người dùng ");
        setSearchResult(null);
        setStatus(""); // reset status
        return;
      }

      // setSearchResult(foundUser);

      const statusRes = await Api_FriendRequest.checkFriendStatus({
        userIdA: userId,
        userIdB: foundUser._id,
      });
      // setStatus(statusRes.data);
      // setSearchResult(foundUser);//gán user sau cùng
      // ✅ Chỉ lấy field status trong object
      setStatus(statusRes.status || "not_friends");
      setSearchResult(foundUser); // gán user sau cùng
      console.log("Trạng thái kết bạn:", statusRes.status);
    } catch (err) {
      console.error("Lỗi tìm kiếm", err);
      setSearchResult(null);
      setStatus(""); // reset để tránh giữ lại kết quả sai
    }
  };

  // 📩 Gửi hoặc thu hồi lời mời kết bạn qua socket
  const handleSendOrRevokeRequest = () => {
    if (!userId || !searchResult) return;

    socket.emit(
      "send_friend_request",
      {
        fromUserId: userId,
        toUserId: searchResult._id,
      },
      (response) => {
        if (response.status === "ok") {
          setStatus("pending");
          Alert.alert("Đã gửi lời mời kết bạn");
        } else if (response.status === "revoked") {
          setStatus("");
          Alert.alert("Đã thu hồi lời mời");
        } else {
          Alert.alert("Lỗi", response.message || "Không thể xử lý yêu cầu");
        }
      }
    );
  };

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
          <Image source={{ uri: searchResult.avatar }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {searchResult.firstname} {searchResult.surname}
            </Text>
            <Text style={styles.phone}>{searchResult.phone}</Text>
            <Text style={styles.status}>
              Trạng thái:{" "}
              {status === "accepted"
                ? "Đã là bạn bè"
                : status === "pending"
                ? "Đang chờ phản hồi"
                : "Chưa kết bạn"}
            </Text>
          </View>

          {status !== "accepted" && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleSendOrRevokeRequest}
            >
              <Text style={styles.addButtonText}>
                {status === "pending" ? "Thu hồi" : "Kết bạn"}
              </Text>
            </TouchableOpacity>
          )}
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
