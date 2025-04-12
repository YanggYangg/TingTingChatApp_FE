"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

// Define the type for the navigation stack params
type RootStackParamList = {
  Main: undefined
  MessageScreen: { userId?: string; username?: string }
  ChatScreenCloud: undefined
  // Add other routes as needed
}

// Create a type for the component props using NativeStackScreenProps
type ChatScreenCloudProps = NativeStackScreenProps<RootStackParamList, "ChatScreenCloud">

const ChatScreenCloud = ({ navigation, route }: ChatScreenCloudProps) => {
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("Tất cả")
  const [messages, setMessages] = useState([
    { id: "1", text: "Vinh 15", sender: "user", time: "" },
    { id: "2", text: "Khương 15", sender: "user", time: "17:56" },
    { id: "3", text: "", sender: "timestamp", time: "13:23 09/04/2025" },
    { id: "4", text: "Khương 35", sender: "user", time: "" },
    { id: "5", text: "", sender: "timestamp", time: "02:20 11/04/2025" },
    { id: "6", text: "Khương 60", sender: "user", time: "" },
    { id: "7", text: "", sender: "timestamp", time: "17:17 11/04/2025" },
    { id: "8", text: "Khương 25", sender: "user", time: "" },
    { id: "9", text: "", sender: "timestamp", time: "18:37 11/04/2025" },
    { id: "10", text: "Khương 178", sender: "user", time: "" },
    { id: "11", text: "Vinh 108", sender: "user", time: "" },
    { id: "12", text: "Cường 108", sender: "user", time: "18:37" },
  ])

  const tabs = ["Tất cả", "Văn bản", "Ảnh", "File", "Link"]

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: String(messages.length + 1),
        text: message,
        sender: "user",
        time: new Date().getHours() + ":" + String(new Date().getMinutes()).padStart(2, "0"),
      }
      setMessages([...messages, newMessage])
      setMessage("")
    }
  }

  const renderMessage = ({ item }: { item: any }) => {
    if (item.sender === "timestamp") {
      return (
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>{item.time}</Text>
        </View>
      )
    }

    return (
      <View style={[styles.messageContainer, item.sender === "user" ? styles.userMessage : styles.otherMessage]}>
        <Text style={styles.messageText}>{item.text}</Text>
        {item.time ? <Text style={styles.messageTime}>{item.time}</Text> : null}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cloud của tôi</Text>
          <Ionicons name="checkmark-circle" size={20} color="#FFA500" style={styles.verifiedIcon} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="grid-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={{ paddingHorizontal: 10, alignItems: "center" }} // <- thêm dòng này
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Collection Section */}
      <View style={styles.collectionContainer}>
        <Text style={styles.collectionTitle}>Bộ sưu tập</Text>
        <TouchableOpacity>
          <Ionicons name="chevron-down" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesList}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.inputIcon}>
          <Ionicons name="happy-outline" size={24} color="#888" />
        </TouchableOpacity>

        <TextInput style={styles.input} placeholder="Tin nhắn" value={message} onChangeText={setMessage} multiline />

        <TouchableOpacity style={styles.inputIcon}>
          <Ionicons name="mic-outline" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="image-outline" size={24} color="#FF9500" />
        </TouchableOpacity>
      </View>

      
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0099FF",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginLeft: 20,
  },
  tabsContainer: {
    backgroundColor: "white",
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    height: 32, // <- thêm dòng này để fix chiều cao
  },
  
  activeTab: {
    backgroundColor: "#e0e0e0",
  },
  tabText: {
    color: "#333",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 16, // Nếu muốn tinh chỉnh chiều cao chữ
  },
  collectionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0066CC",
  },
  messagesContainer: {
    // flex: 1,
    backgroundColor: "#f0f0f5",
  },
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  messageContainer: {
    maxWidth: "70%",
    padding: 10,
    borderRadius: 18,
    marginVertical: 5,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#E1F5FE",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "white",
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: "#888",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  timestampContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  timestamp: {
    backgroundColor: "#ccc",
    color: "white",
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  inputIcon: {
    padding: 5,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    padding: 5,
  },
  sentIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: "white",
  },
  sentText: {
    fontSize: 12,
    color: "#888",
    marginRight: 5,
  },
})

export default ChatScreenCloud
