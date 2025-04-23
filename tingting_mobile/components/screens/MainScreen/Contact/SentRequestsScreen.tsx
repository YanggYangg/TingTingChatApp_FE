import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native"
import { useState, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { Api_FriendRequest } from "@/apis/api_friendRequest"
import AsyncStorage from "@react-native-async-storage/async-storage"



export default function SentRequestsScreen() {
  const navigation = useNavigation()
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);


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
  const handleCancelRequest = async (recipientId: string) => {
    try {
      const requesterId = await AsyncStorage.getItem("userId");
  
      const data = {
        requesterId,
        recipientId,
      };
  
      console.log("Sending cancel request:", data);
      
      await Api_FriendRequest.cancelFriendRequest(data);
  
      console.log("Huỷ lời mời kết bạn thành công");
      fetchSentRequests(); // Cập nhật lại danh sách
    } catch (error) {
      console.error("Lỗi khi thu hồi lời mời:", error.response?.data || error);
    }
  };
  
  
  



  const renderSentRequestItem = ({ item }: { item: {
      createdAt: string | number | Date
      recipient: any
      _id: string; id: string; name: string; avatar: string; message: string; time: string 
  } }) => 
    (
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
          <Text style={styles.withdrawButtonText} onPress={() => handleCancelRequest(item.recipient._id, fetchSentRequests)}>Thu hồi</Text>
        </TouchableOpacity>
      </View>
    )

  return (
    <View style={styles.container}>
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lời mời đã gửi</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity style={styles.topTab} onPress={() => navigation.navigate("FriendRequests")}>
          <Text style={styles.topTabText}>Đã nhận {receivedRequests.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, styles.activeTopTab]}>
          <Text style={styles.activeTopTabText}>Đã gửi {sentRequests.length}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sentRequests}
        renderItem={renderSentRequestItem}
        keyExtractor={(item) => item._id}
        style={styles.requestList}
      />
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
})
