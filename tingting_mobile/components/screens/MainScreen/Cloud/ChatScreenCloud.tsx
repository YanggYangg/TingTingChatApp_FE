
import { useState, useEffect } from "react"
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
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

// Define the type for the navigation stack params
type RootStackParamList = {
  Main: undefined
  MessageScreen: { userId?: string; username?: string }
  ChatScreenCloud: undefined
}

// Create a type for the component props
type ChatScreenCloudProps = NativeStackScreenProps<RootStackParamList, "ChatScreenCloud">

// Define interfaces for message types
interface UserMessage {
  id: string
  text: string
  sender: "user"
  time: string
  fileUrls: string[]
  thumbnailUrls: string[]
  filenames: string[]
  timestamp: string
}

interface TimestampMessage {
  id: string
  sender: "timestamp"
  time: string
}

// Union type for messages
type Message = UserMessage | TimestampMessage

const ChatScreenCloud = ({ navigation }: ChatScreenCloudProps) => {
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("Tất cả")
  const [messages, setMessages] = useState<Message[]>([])

  const tabs = ["Tất cả", "Văn bản", "Ảnh", "File", "Link"]

  // Hàm định dạng thời gian sang múi giờ Việt Nam (UTC+7)
  const formatDate = (isoString: string): { time: string; dateStr: string } => {
    const date = new Date(isoString)
    // Giả định timestamp từ API là UTC, cộng 7 giờ để chuyển sang UTC+7
    const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    const time = `${vnDate.getHours()}:${String(vnDate.getMinutes()).padStart(2, "0")}`
    const dateStr = `${vnDate.getDate().toString().padStart(2, "0")}/${(vnDate.getMonth() + 1).toString().padStart(2, "0")}/${vnDate.getFullYear()}`
    return { time, dateStr }
  }

  // Fetch messages from API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("http://192.168.1.35:3000/api/messages/user/user123")
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()

        // Sắp xếp tin nhắn theo timestamp
        const sortedData = data.sort(
          (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )

        // Nhóm tin nhắn theo ngày
        const formattedMessages: Message[] = []
        let lastDate: string | null = null

        sortedData.forEach((msg: any) => {
          const { time, dateStr } = formatDate(msg.timestamp)

          // Chỉ thêm timestamp nếu ngày thay đổi
          if (lastDate !== dateStr) {
            formattedMessages.push({
              id: `ts-${msg.messageId}`,
              sender: "timestamp",
              time: dateStr,
            })
            lastDate = dateStr
          }

          // Thêm tin nhắn
          formattedMessages.push({
            id: msg.messageId,
            text: msg.content || "",
            sender: "user",
            time,
            fileUrls: msg.fileUrls || [],
            thumbnailUrls: msg.thumbnailUrls || [],
            filenames: msg.filenames || [],
            timestamp: msg.timestamp,
          })
        })

        setMessages(formattedMessages)
      } catch (error: any) {
        console.error("Error fetching messages:", {
          message: error.message,
          stack: error.stack,
        })
      }
    }

    fetchMessages()
  }, [])

  const sendMessage = () => {
    if (message.trim()) {
      // Sử dụng giờ hệ thống trực tiếp (giả định đã là UTC+7)
      const now = new Date()
      const isoTimestamp = now.toISOString() // Lưu timestamp dạng ISO
      const { time, dateStr } = formatDate(isoTimestamp)

      // Debug để kiểm tra giờ
      console.log("New message timestamp:", isoTimestamp, "Formatted time:", time)

      // Kiểm tra ngày của tin nhắn cuối
      const lastMessage = messages[messages.length - 1] as UserMessage | undefined
      const lastDate = lastMessage?.timestamp
        ? formatDate(lastMessage.timestamp).dateStr
        : null

      const newMessages: Message[] = []

      // Thêm timestamp nếu ngày khác
      if (lastDate !== dateStr) {
        newMessages.push({
          id: `ts-${Date.now()}`,
          sender: "timestamp",
          time: dateStr,
        })
      }

      // Thêm tin nhắn mới
      newMessages.push({
        id: String(Date.now()),
        text: message,
        sender: "user",
        time,
        fileUrls: [],
        thumbnailUrls: [],
        filenames: [],
        timestamp: isoTimestamp,
      })

      setMessages([...messages, ...newMessages])
      setMessage("")
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.sender === "timestamp") {
      return (
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>{item.time}</Text>
        </View>
      )
    }

    const userMessage = item as UserMessage

    return (
      <View style={[styles.messageContainer, styles.userMessage]}>
        {userMessage.text ? <Text style={styles.messageText}>{userMessage.text}</Text> : null}
        {userMessage.thumbnailUrls && userMessage.thumbnailUrls.length > 0 ? (
          <View style={styles.fileContainer}>
            {userMessage.thumbnailUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ))}
          </View>
        ) : null}
        {userMessage.filenames && userMessage.filenames.length > 0 && !userMessage.thumbnailUrls.length ? (
          <View style={styles.fileContainer}>
            {userMessage.filenames.map((name, index) => (
              <Text key={index} style={styles.fileName}>
                {name}
              </Text>
            ))}
          </View>
        ) : null}
        {userMessage.time ? <Text style={styles.messageTime}>{userMessage.time}</Text> : null}
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
        contentContainerStyle={{ paddingHorizontal: 10, alignItems: "center" }}
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
    height: 32,
  },
  activeTab: {
    backgroundColor: "#e0e0e0",
  },
  tabText: {
    color: "#333",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 16,
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
  fileContainer: {
    marginTop: 8,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileName: {
    fontSize: 14,
    color: "#0066CC",
    marginVertical: 4,
  },
})

export default ChatScreenCloud