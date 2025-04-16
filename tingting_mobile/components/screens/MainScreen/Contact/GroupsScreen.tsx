import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

// Dữ liệu mẫu
const GROUPS = [
  {
    id: "1",
    name: "Nhom01_QLDA_T3_T7-9",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    lastMessage: "Dương Thái Bảo: [Thư mục] final_qlda",
    time: "21 phút",
  },
  {
    id: "2",
    name: "bóng chuyền tối thứ cn(7-9h)",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    lastMessage: "Đào Nhật Diễn: @Hoàng Long đánh sân...",
    time: "2 giờ",
    memberCount: 12,
  },
  {
    id: "3",
    name: "Nhóm 01_CNM_App Zalo",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    lastMessage: "Nhi Nhi: em làm nhóm trưởng",
    time: "4 giờ",
    memberCount: 5,
  },
  {
    id: "4",
    name: "DHKTPM17B_QLDA",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    lastMessage: "Thu Ha: thời hạn trong hết hôm nay",
    time: "13 giờ",
    memberCount: 63,
  },
  {
    id: "5",
    name: "NhomX_Bigdata_BTTH",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    lastMessage: "Nguyen Thi Nga: Còn msssv đó tui chưa t...",
    time: "CN",
  },
]

// Dữ liệu mẫu cho các loại nhóm
const GROUP_TYPES = [
  {
    id: "1",
    name: "Lịch",
    icon: "calendar",
    color: "#0091ff",
  },
  {
    id: "2",
    name: "Nhắc hẹn",
    icon: "alarm",
    color: "#ff4d4f",
  },
  {
    id: "3",
    name: "Nhóm Offline",
    icon: "people-circle",
    color: "#7265e6",
  },
]

export default function GroupsScreen() {
  const navigation = useNavigation()

  const renderGroupTypeItem = ({ item }) => (
    <View style={styles.groupTypeItem}>
      <View style={[styles.groupTypeIcon, { backgroundColor: "#f0f0f0" }]}>
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.groupTypeName}>{item.name}</Text>
    </View>
  )

  const renderGroupItem = ({ item }) => (
    <View style={styles.groupItem}>
      <Image source={{ uri: item.avatar }} style={styles.groupAvatar} />

      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupLastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <Text style={styles.groupTime}>{item.time}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nhóm</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity style={styles.topTab} onPress={() => navigation.navigate("FriendsMain")}>
          <Text style={styles.topTabText}>Bạn bè</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, styles.activeTopTab]}>
          <Text style={styles.activeTopTabText}>Nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topTab} onPress={() => navigation.navigate("OATab")}>
          <Text style={styles.topTabText}>OA</Text>
        </TouchableOpacity>
      </View>

      {/* Create Group */}
      <TouchableOpacity style={styles.createGroupOption}>
        <View style={styles.createGroupIcon}>
          <Ionicons name="people" size={24} color="#0091ff" />
          <View style={styles.addIcon}>
            <Ionicons name="add" size={14} color="#fff" />
          </View>
        </View>
        <Text style={styles.createGroupText}>Tạo nhóm</Text>
      </TouchableOpacity>

      {/* Group Types */}
      <Text style={styles.sectionHeader}>Tạo nhóm với:</Text>
      <FlatList
        data={GROUP_TYPES}
        renderItem={renderGroupTypeItem}
        keyExtractor={(item) => item.id}
        horizontal
        style={styles.groupTypesList}
        contentContainerStyle={styles.groupTypesContent}
      />

      {/* Groups List */}
      <View style={styles.groupsHeader}>
        <Text style={styles.groupsHeaderText}>Nhóm đang tham gia (81)</Text>
        <Text style={styles.groupsHeaderAction}>Hoạt động cuối</Text>
      </View>

      <FlatList data={GROUPS} renderItem={renderGroupItem} keyExtractor={(item) => item.id} style={styles.groupsList} />
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
  createGroupOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  createGroupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e6f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    position: "relative",
  },
  addIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0091ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0091ff",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  groupTypesList: {
    maxHeight: 120,
  },
  groupTypesContent: {
    paddingHorizontal: 8,
  },
  groupTypeItem: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 80,
  },
  groupTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  groupTypeName: {
    fontSize: 14,
    textAlign: "center",
  },
  groupsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: 16,
  },
  groupsHeaderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  groupsHeaderAction: {
    fontSize: 14,
    color: "#999",
  },
  groupsList: {
    flex: 1,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "500",
  },
  groupLastMessage: {
    fontSize: 14,
    color: "#999",
    marginTop: 2,
  },
  groupTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
})
