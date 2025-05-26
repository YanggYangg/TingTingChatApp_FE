"use client";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Api_FriendRequest } from "../../../../apis/api_friendRequest";
import { Api_Conversation } from "../../../../apis/api_conversation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setSelectedMessage } from "../../../../redux/slices/chatSlice";
import { useDispatch } from "react-redux";

import socket from "../../../../utils/socketFriendRequest";

export default function FriendsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

  //socket 
  useEffect(() => {
  const setupSocket = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (userId) {
       console.log("📲 Mobile đăng ký socket:", userId);
       socket.emit("add_user", userId);
    }

    socket.on("unfriended", ({ byUserId }) => {
      console.log("🔔 Bạn đã bị huỷ kết bạn bởi:", byUserId);
      fetchFriends(); // Tự reload lại danh sách
    });

       // Khi nhận lời mời mới
    socket.on("friend_request_received", ({ fromUserId }) => {
      console.log("📩 Nhận lời mời kết bạn mới từ:", fromUserId);
      setReceivedRequests((prev) => [...prev, { _id: fromUserId }]); // cập nhật đếm
    });

      // Khi lời mời bị thu hồi
    socket.on("friend_request_revoked", ({ fromUserId }) => {
      console.log("❌ Lời mời kết bạn bị thu hồi bởi:", fromUserId);
      setReceivedRequests((prev) =>
        prev.filter((r) => r._id !== fromUserId)
      );
    });

  };

  setupSocket();

  return () => {
    socket.off("unfriended");
    socket.off("friend_request_received");
    socket.off("friend_request_revoked");
  };
}, []);


  const fetchFriends = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const res = await Api_FriendRequest.getFriendsList(userId);
      console.log("Danh sách bạn bè:", res.data);
      //setFriends(res.data);
      setFriends([...res.data]);
    } catch (error) {
      console.error("Lỗi lấy danh sách bạn bè:", error);
    }
  };
  useEffect(() => {
    fetchFriends();
  }, []);
  useEffect(() => {
    fetchReceivedRequests();
  }, []);

  const fetchReceivedRequests = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const res = await Api_FriendRequest.getReceivedRequests(userId);
      console.log("Danh sách lời mời kết bạn đã nhận:", res.data);
      setReceivedRequests(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách lời mời kết bạn đã nhận:", error);
    }
  };

  const handleDeleteFriend = async (friendId: any) => {
    Alert.alert(
      "Xác nhận xóa bạn",
      "Bạn có chắc chắn muốn xóa người này khỏi danh sách bạn bè?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const currentUserId = await AsyncStorage.getItem("userId");
              // const response = await Api_FriendRequest.unfriend(currentUserId, friendId);
              // console.log("Xóa bạn thành công:", response.data);
              // await fetchFriends(); // Cập nhật danh sách bạn bè sau khi xóa
              socket.emit(
                "unfriend",
                { userId1: currentUserId, userId2: friendId },
                (response) => {
                  if (response.status === "ok") {
                    console.log("Huỷ kết bạn thành công qua socket");
                    fetchFriends();
                  } else {
                    console.error("Lỗi khi huỷ kết bạn:", response.message);
                  }
                }
              );
            } catch (error) {
              console.error("Lỗi xóa bạn:", error);
            }
          },
        },
      ]
    );
  };

  const handleStartChat = async (friendId: any) => {
    const currentUserId = await AsyncStorage.getItem("userId");
    console.log("== CLICKED FRIEND ID ==", friendId);
    console.log("== CURRENT USER ID ==", currentUserId);

    try {
      const res = await Api_Conversation.getOrCreateConversation(
        currentUserId,
        friendId
      );
      console.log("== GET OR CREATE CONVERSATION ==", res);

      if (res?.conversationId) {
        const conversationId = res.conversationId;
        console.log("== Đã lấy được conversationId ==", conversationId);

        dispatch(
          setSelectedMessage({
            id: conversationId,
            isGroup: false,
            participants: [{ userId: currentUserId }, { userId: friendId }],
          })
        );
        //navigation.navigate("MessageScreen");
        navigation.navigate("MessageScreen", {
          message: {
            id: conversationId,
            isGroup: false,
            participants: [{ userId: currentUserId }, { userId: friendId }],
          },
          user: {
            userId: friendId,
          },
        });
      }
    } catch (error) {
      console.error("Lỗi khi bắt đầu cuộc trò chuyện:", error);
    }
  };

  const renderContactItem = ({
    item,
  }: {
    item: { _id: string; name: string; avatar: string };
  }) => (
    <TouchableOpacity
      onPress={() => handleStartChat(item._id)}
      style={styles.contactItem}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
      </View>

      <View style={styles.contactActions}>
        {/* <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={22} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="videocam-outline" size={22} color="#666" />
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteFriend(item._id)}
        >
          <Ionicons name="trash-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh bạ</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity style={[styles.topTab, styles.activeTopTab]}>
          <Text style={styles.activeTopTabText}>Ban bè</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topTab}
          onPress={() => navigation.navigate("GroupsTab")}
        >
          <Text style={styles.topTabText}>Nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topTab}
          onPress={() => navigation.navigate("OATab")}
        >
          <Text style={styles.topTabText}>OA</Text>
        </TouchableOpacity>
      </View>

      {/* Friend Options */}
      <View style={styles.friendOptions}>
        <TouchableOpacity
          style={styles.friendOption}
          onPress={() => navigation.navigate("FriendRequests")}
        >
          <View style={styles.friendOptionIcon}>
            <Ionicons name="people" size={24} color="#0091ff" />
          </View>
          <View style={styles.friendOptionTextContainer}>
            <Text style={styles.friendOptionText}>Lời mời kết bạn</Text>
            <Text style={styles.friendOptionCount}>
              ({receivedRequests.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Contact List */}
      <FlatList
        data={friends}
        renderItem={renderContactItem}
        keyExtractor={(item) => item._id}
        style={styles.contactList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    width: 40,
  },
  topTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  topTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTopTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#0091ff",
  },
  topTabText: {
    fontSize: 16,
    color: "#999",
  },
  activeTopTabText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  friendOptions: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  friendOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  friendOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  friendOptionTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  friendOptionCount: {
    fontSize: 16,
    marginLeft: 4,
  },
  friendOptionSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  contactList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4caf50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
  },
  contactActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
});
