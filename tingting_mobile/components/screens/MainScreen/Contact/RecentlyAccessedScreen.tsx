import { View, Text, StyleSheet, TouchableOpacity, Image, SectionList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

// Dữ liệu mẫu
const CONTACTS_BY_SECTION = [
  {
    title: "A",
    data: [
      {
        id: "a1",
        name: "An",
        avatar: "https://randomuser.me/api/portraits/women/32.jpg",
        online: false,
      },
      {
        id: "a2",
        name: "An Quốc Việt",
        avatar: "https://randomuser.me/api/portraits/men/42.jpg",
        online: false,
      },
      {
        id: "a3",
        name: "Anh Khoa",
        avatar: "https://randomuser.me/api/portraits/men/43.jpg",
        online: true,
      },
      {
        id: "a4",
        name: "Anh Thư",
        avatar: "https://randomuser.me/api/portraits/women/43.jpg",
        online: false,
      },
    ],
  },
  {
    title: "B",
    data: [
      {
        id: "b1",
        name: "Bảo Ngọc",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        online: false,
      },
    ],
  },
]

export default function RecentlyAccessedScreen() {
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

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mới truy cập</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity style={[styles.topTab, styles.activeTopTab]} onPress={() => navigation.goBack()}>
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

      {/* Alphabet Index */}
      <View style={styles.alphabetIndex}>
        {["A", "B", "C", "D", "Đ", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "S", "T", "V", "X", "Y", "Z", "#"].map(
          (letter) => (
            <Text key={letter} style={[styles.alphabetLetter, letter === "A" && styles.activeAlphabetLetter]}>
              {letter}
            </Text>
          ),
        )}
      </View>

      {/* Contact List */}
      <SectionList
        sections={CONTACTS_BY_SECTION}
        renderItem={renderContactItem}
        renderSectionHeader={renderSectionHeader}
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
  alphabetIndex: {
    position: "absolute",
    right: 5,
    top: 250,
    bottom: 0,
    justifyContent: "space-between",
    zIndex: 1,
  },
  alphabetLetter: {
    fontSize: 12,
    color: "#999",
    paddingVertical: 2,
  },
  activeAlphabetLetter: {
    color: "#0091ff",
    fontWeight: "bold",
  },
  contactList: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
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
