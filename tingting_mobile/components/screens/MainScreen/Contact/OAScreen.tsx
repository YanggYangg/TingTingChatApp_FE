import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

export default function OAScreen() {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      {/* Header với nút quay lại */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Official Account</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Top Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity style={styles.topTab} onPress={() => navigation.navigate("FriendsMain")}>
          <Text style={styles.topTabText}>Bạn bè</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topTab} onPress={() => navigation.navigate("GroupsTab")}>
          <Text style={styles.topTabText}>Nhóm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.topTab, styles.activeTopTab]}>
          <Text style={styles.activeTopTabText}>OA</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Chưa có Official Account nào</Text>
      </View>
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
  },
})
