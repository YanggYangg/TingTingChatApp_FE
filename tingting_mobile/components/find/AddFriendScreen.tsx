import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image
} from "react-native";
import { Ionicons, MaterialIcons, Entypo } from "@expo/vector-icons";

const AddFriendScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [relationshipStatus, setRelationshipStatus] = useState(null);

    // Dữ liệu giả định người dùng hiện tại
  const currentUserId = "me123";

  // Dữ liệu giả định người dùng tìm thấy
  const dummyUser = {
    _id: "123abc",
    name: "Nguyễn Văn A",
    phone: "912345678",
    avatar: "https://i.pravatar.cc/100?img=5",
  };

  // Các trạng thái mối quan hệ có thể:
  const STATUS = {
    NOT_FRIEND: "NOT_FRIEND",
    REQUEST_SENT: "REQUEST_SENT",
    REQUEST_RECEIVED: "REQUEST_RECEIVED",
    FRIEND: "FRIEND",
  };

  const handleSearch = () => {
    if (phoneNumber === dummyUser.phone) {
      setSearchResult(dummyUser);

      // 👉 Giả lập logic quan hệ (đổi lại cho đúng app thật):
      // Ví dụ:
      // setRelationshipStatus(STATUS.NOT_FRIEND);
      // setRelationshipStatus(STATUS.REQUEST_SENT);
      setRelationshipStatus(STATUS.REQUEST_RECEIVED);
       //setRelationshipStatus(STATUS.FRIEND);

      //setRelationshipStatus(STATUS.NOT_FRIEND);
    } else {
      setSearchResult(null);
      setRelationshipStatus(null);
    }
  };

  const handleAddFriend = () => {
    setRelationshipStatus(STATUS.REQUEST_SENT);
  };

  const handleCancelRequest = () => {
    setRelationshipStatus(STATUS.NOT_FRIEND);
  };

  const handleAcceptRequest = () => {
    setRelationshipStatus(STATUS.FRIEND);
  };

  const handleRejectRequest = () => {
    setRelationshipStatus(STATUS.NOT_FRIEND);
  };

  
  const renderActionButtons = () => {
    switch (relationshipStatus) {
      case STATUS.NOT_FRIEND:
        return (
          <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
            <Text style={styles.addButtonText}>Kết bạn</Text>
          </TouchableOpacity>
        );
      case STATUS.REQUEST_SENT:
        return (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#ccc" }]}
            onPress={handleCancelRequest}
          >
            <Text style={[styles.addButtonText, { color: "#000" }]}>
              Thu hồi
            </Text>
          </TouchableOpacity>
        );
      case STATUS.REQUEST_RECEIVED:
        return (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: "#4CD964" }]}
              onPress={handleAcceptRequest}
            >
              <Text style={styles.addButtonText}>Chấp nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: "#FF3B30" }]}
              onPress={handleRejectRequest}
            >
              <Text style={styles.addButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        );
      case STATUS.FRIEND:
        return (
          <View
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: "#ddd",
            }}
          >
            <Text style={{ fontWeight: "500", color: "#555" }}>
              Đã là bạn bè
            </Text>
          </View>
        );
      default:
        return null;
    }
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
          value={phoneNumber}
          onChangeText={setPhoneNumber}
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
            <Text style={styles.name}>{searchResult.name}</Text>
            <Text style={styles.phone}>+84 {searchResult.phone}</Text>
          </View>
          {renderActionButtons()}
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
