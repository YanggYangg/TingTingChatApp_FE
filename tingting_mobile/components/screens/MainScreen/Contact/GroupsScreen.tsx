import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import React, { useEffect, useState } from "react"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { Api_Conversation } from "../../../../apis/api_conversation"
import { setSelectedMessage } from "../../../../redux/slices/chatSlice";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function GroupsScreen() {
  const navigation = useNavigation()
  const dispatch = useDispatch();
  const [groups, setGroups] = useState([])


    const fetchGroups = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId"); 
        const res = await Api_Conversation.getUserJoinGroup(userId);
        console.log("Danh sách nhóm:", res);
        setGroups(res)
      } catch (error) {
        console.error("Lỗi khi lấy danh sách nhóm:", error)
      }
    }

  useEffect(() => {
    fetchGroups()
  }, []);
  
  const handleStartChat = async (group) => {
     try {
          const conversationId = group._id; // dùng luôn ID của group làm conversationId
          console.log("== Navigating to group conversation ==", conversationId);
      
          dispatch(setSelectedMessage({
            id: conversationId,
            isGroup: true,
            participants: group.participants,
            name: group.name,
            imageGroup: group.imageGroup || ""  // nếu có ảnh nhóm
          }));
      
          navigation.navigate("MessageScreen", {
            conversationId: conversationId,
            isGroup: true,
            participants: group.participants,
            name: group.name,
            imageGroup: group.imageGroup || ""  // nếu có ảnh nhóm
          });
        } catch (error) {
          console.error("Lỗi khi bắt đầu trò chuyện nhóm:", error);
        }
  }

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity 
    onPress={() => handleStartChat(item)}
    style={styles.groupItem}>
      <Image source={{ uri: item.avatar }} style={styles.groupAvatar} />

      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupLastMessage} numberOfLines={1}>
           {item.participants.length} thành viên
        </Text>
      </View>

      <Text style={styles.groupTime}>{item.time}</Text>
    </TouchableOpacity>
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

      {/* Groups List */}
      <View style={styles.groupsHeader}>
        <Text style={styles.groupsHeaderText}>Nhóm đang tham gia ({(groups.length)})</Text>
      </View>

      <FlatList data={groups} renderItem={renderGroupItem} keyExtractor={(item) => item._id} style={styles.groupsList} />
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
