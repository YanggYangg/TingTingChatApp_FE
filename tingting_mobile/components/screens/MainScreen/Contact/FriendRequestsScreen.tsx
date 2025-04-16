"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

// Dữ liệu mẫu
const RECEIVED_REQUESTS = [
  {
    id: "1",
    name: "Phước Thanh",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    message: "Muốn kết bạn",
  },
  {
    id: "2",
    name: "Hong Anh",
    avatar: "https://randomuser.me/api/portraits/women/45.jpg",
    message: "Muốn kết bạn",
  },
  {
    id: "3",
    name: "Vân",
    avatar: "https://randomuser.me/api/portraits/women/46.jpg",
    message: "Muốn kết bạn",
  },
]

const SENT_REQUESTS = [
  {
    id: "1",
    name: "Nguyễn Thành Luân",
    avatar: "https://randomuser.me/api/portraits/men/47.jpg",
    message: "Từ cửa sổ trò chuyện",
    time: "7 giờ trước",
  },
  {
    id: "2",
    name: "Trần Hoàng Anh",
    avatar: "https://randomuser.me/api/portraits/men/48.jpg",
    message: "Từ cửa sổ trò chuyện",
    time: "21/03",
  },
]

export default function FriendRequestsScreen() {
  const navigation = useNavigation()
  const [activeTab, setActiveTab] = useState("received")

  const renderReceivedRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />

      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.name}</Text>
        <Text style={styles.requestMessage}>{item.message}</Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.rejectButton}>
          <Text style={styles.rejectButtonText}>Từ chối</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton}>
          <Text style={styles.acceptButtonText}>Đồng ý</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderSentRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />

      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.name}</Text>
        <Text style={styles.requestMessage}>{item.message}</Text>
        <Text style={styles.requestTime}>{item.time}</Text>
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
          <Text style={activeTab === "received" ? styles.activeTopTabText : styles.topTabText}>Đã nhận 6</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topTab, activeTab === "sent" && styles.activeTopTab]}
          onPress={() => {
            setActiveTab("sent")
            navigation.navigate("SentRequests")
          }}
        >
          <Text style={activeTab === "sent" ? styles.activeTopTabText : styles.topTabText}>Đã gửi 2</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "received" && (
        <>
          
          <FlatList
            data={RECEIVED_REQUESTS}
            renderItem={renderReceivedRequestItem}
            keyExtractor={(item) => item.id}
            style={styles.requestList}
          />
          
        </>
      )}

      {activeTab === "sent" && (
        <FlatList
          data={SENT_REQUESTS}
          renderItem={renderSentRequestItem}
          keyExtractor={(item) => item.id}
          style={styles.requestList}
        />
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
})
