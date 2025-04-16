"use client"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

// Dữ liệu mẫu
const CONTACTS = [
  {
    id: "1",
    name: "Vinh Trần",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    online: true,
  },
  {
    id: "2",
    name: "Hữu Trí",
    avatar: "https://randomuser.me/api/portraits/men/33.jpg",
    online: true,
  },
  {
    id: "3",
    name: "Vĩnh Bình",
    avatar: "https://randomuser.me/api/portraits/men/34.jpg",
    online: true,
  },
  {
    id: "4",
    name: "Trọng Phúc",
    avatar: "https://randomuser.me/api/portraits/men/35.jpg",
    online: true,
  },
  {
    id: "5",
    name: "Nguyễn Tấn Lộc",
    avatar: "https://randomuser.me/api/portraits/men/36.jpg",
    online: true,
  },
]

export default function FriendsScreen() {
  const navigation = useNavigation()

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
      </View>

      <View style={styles.contactActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call-outline" size={22} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="videocam-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} >
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
        <TouchableOpacity style={styles.topTab} onPress={() => navigation.navigate("GroupsTab")}>
          <Text style={styles.topTabText}>Nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topTab} onPress={() => navigation.navigate("OATab")}>
          <Text style={styles.topTabText}>OA</Text>
        </TouchableOpacity>
      </View>

      {/* Friend Options */}
      <View style={styles.friendOptions}>
        <TouchableOpacity style={styles.friendOption} onPress={() => navigation.navigate("FriendRequests")}>
          <View style={styles.friendOptionIcon}>
            <Ionicons name="people" size={24} color="#0091ff" />
          </View>
          <View style={styles.friendOptionTextContainer}>
            <Text style={styles.friendOptionText}>Lời mời kết bạn</Text>
            <Text style={styles.friendOptionCount}>(6)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.friendOption}>
          <View style={styles.friendOptionIcon}>
            <Ionicons name="book" size={24} color="#0091ff" />
          </View>
          <View>
            <Text style={styles.friendOptionText}>Danh bạ máy</Text>
            <Text style={styles.friendOptionSubtext}>Liên hệ có dùng Zalo</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.friendOption}>
          <View style={styles.friendOptionIcon}>
            <Ionicons name="gift" size={24} color="#0091ff" />
          </View>
          <Text style={styles.friendOptionText}>Sinh nhật</Text>
        </TouchableOpacity>
      </View>

      {/* Contact List */}
      <FlatList
        data={CONTACTS}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        style={styles.contactList}
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
})
