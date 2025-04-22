"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { Api_FriendRequest } from "@/apis/api_friendrequest"
import AsyncStorage from "@react-native-async-storage/async-storage";



export default function FriendRequestsScreen() {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState("received")
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friendRequests, setFriendRequests] = useState({});

  useEffect(() => {
    fetchReceivedRequests();
    fetchSentRequests();
  }, [])

  const fetchReceivedRequests = async () => {
    try{
      const userId = await AsyncStorage.getItem("userId");
      const res = await Api_FriendRequest.getReceivedRequests(userId);
      console.log("Danh sách lời mời kết bạn đã nhận:", res.data);
      setReceivedRequests(res.data);
    }catch(error){
      console.error("Lỗi lấy danh sách lời mời kết bạn đã nhận:", error);
    }
  }

  const fetchSentRequests = async () => {
    try{
      const userId = await AsyncStorage.getItem("userId");
      const res = await Api_FriendRequest.getSentPendingRequests(userId);
      console.log("Danh sách lời mời kết bạn đã gửi:", res.data);
      setSentRequests(res.data);
    }catch(error){
      console.error("Lỗi lấy danh sách lời mời kết bạn đã gửi:", error);
    }
  }

  const handleRespondRequest = async (requestId: any, action: "accepted" | "rejected") => {
    try{
      const userId = await AsyncStorage.getItem("userId");
      const response = await Api_FriendRequest.respondToFriendRequest({
        requestId,
        action,
        userId,
      });
      if (response.message.includes("accepted")) {
        // Nếu accepted, xoá khỏi danh sách đã nhận
        setReceivedRequests((prev) => prev.filter((req) => req._id !== requestId));
      } else if (response.message.includes("rejected")) {
        // Nếu rejected, cũng xoá khỏi danh sách
        setReceivedRequests((prev) => prev.filter((req) => req._id !== requestId));
      }
    }catch(error){
      console.error("Lỗi phản hồi lời mời kết bạn:", error);
    }
  };

  



  const renderReceivedRequestItem = ({ item }: { item: {
    requester: any ;_id: string; avatar: string; firstname?: string; surname?: string; message: string 
} }) => (
    <View style={styles.requestItem}>
      <Image source={{ uri: item.requester.avatar || "https://picsum.photos/200/300" }}   style={styles.avatar} />

      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>   {item.requester.surname} {item.requester.firstname}</Text>
        <Text style={styles.requestMessage}>Muốn kết bạn !</Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity 
        style={styles.rejectButton}
        onPress={() => handleRespondRequest(item._id, "rejected")}>
          <Text style={styles.rejectButtonText}>Từ chối</Text>
        </TouchableOpacity>
        <TouchableOpacity 
        style={styles.acceptButton}
        onPress={() => handleRespondRequest(item._id, "accepted")}>
          <Text style={styles.acceptButtonText}>Đồng ý</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderSentRequestItem = ({ item }: { item: {
    createdAt: string | number | Date
    recipient: any
    _id: string; id: string; name: string; avatar: string; message: string; time: string 
} }) => (
    <View style={styles.requestItem}>
      <Image source={{
        uri: item.recipient.avatar || "https://picsum.photos/200/300", // Đặt ảnh mặc định
      }} style={styles.avatar} />

      <View style={styles.requestInfo}>
        <Text style={styles.requestName}> {item.recipient.surname} {item.recipient.firstname}</Text>
        <Text style={styles.requestMessage}>Từ cửa sổ trò chuyện</Text>
        <Text style={styles.requestTime}>{new Date(item.createdAt).toLocaleString()} </Text>
      </View>

      <TouchableOpacity style={styles.withdrawButton}>
        <Text style={styles.withdrawButtonText}>Thu hồi</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("FriendsMain")}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[styles.topTab, activeTab === "received" && styles.activeTopTab]}
          onPress={() => setActiveTab("received")}
        >
          <Text style={activeTab === "received" ? styles.activeTopTabText : styles.topTabText}>Đã nhận {receivedRequests.length}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.topTab, activeTab === "sent" && styles.activeTopTab]}
          onPress={() => {
            setActiveTab("sent")
            navigation.navigate("SentRequests")
          }}
        >
          <Text style={activeTab === "sent" ? styles.activeTopTabText : styles.topTabText}>Đã gửi {sentRequests.length}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "received" && (
  <>
    {receivedRequests.length === 0 ? (
      <Text style={styles.noRequestText}>Không có lời mời kết bạn</Text>
    ) : (
      <FlatList
        data={receivedRequests}
        renderItem={renderReceivedRequestItem}
        keyExtractor={(item) => item._id} // nhớ đổi lại nếu bạn dùng _id thay vì id
        style={styles.requestList}
      />
    )}
  </>
)}

      {activeTab === "sent" && (
        <>
        {sentRequests.length === 0 ? (
          <Text style={styles.noRequestText}>Không có lời mời đã gửi</Text>
        ) : (
        <FlatList
          data={sentRequests}
          renderItem={renderSentRequestItem}
          keyExtractor={(item) => item._id}
          style={styles.requestList}
        />
        )}
        </>
      )}





    </View>
  )
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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  requestList: {
    flex: 1,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: "500",
  },
  requestMessage: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  requestTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  requestActions: {
    flexDirection: "row",
  },
  rejectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    color: "#333",
  },
  acceptButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e6f7ff",
  },
  acceptButtonText: {
    fontSize: 14,
    color: "#0091ff",
  },
  withdrawButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  withdrawButtonText: {
    fontSize: 14,
    color: "#333",
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  showMoreText: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  noRequestText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
})
