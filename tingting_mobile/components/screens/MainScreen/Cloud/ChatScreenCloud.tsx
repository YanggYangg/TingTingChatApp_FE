
import { useState, useEffect, useRef  } from "react"
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
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  TouchableHighlight,
} from "react-native"
import type { FlatList as FlatListType } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import * as ImagePicker from "expo-image-picker"
import * as FileSystem from "expo-file-system"; // Thêm để xử lý tải file
import * as MediaLibrary from "expo-media-library"; // Thêm để lưu vào thư viện ảnh

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
  userId: "user123"
  time: string
  fileUrls: string[]
  thumbnailUrls: string[]
  filenames: string[]
  timestamp: string
}

interface TimestampMessage {
  id: string
  userId: "timestamp"
  time: string
}

// Union type for messages
type Message = UserMessage | TimestampMessage

const ChatScreenCloud = ({ navigation }: ChatScreenCloudProps) => {
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("Tất cả")
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const flatListRef = useRef<FlatListType>(null)
  const [initialIndex, setInitialIndex] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Lưu URL ảnh full màn hình
  const [modalVisible, setModalVisible] = useState(false); // Điều khiển modal



  const tabs = ["Tất cả", "Văn bản", "Ảnh", "File", "Link"]

  // Hàm định dạng thời gian sang múi giờ Việt Nam (UTC+7)
  // Sửa lại hàm formatDate
  const formatDate = (isoString: string): { time: string; dateStr: string } => {
    const date = new Date(isoString)
    const hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const time = `${hours}:${minutes}`
    const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
    return { time, dateStr }
  }

  // Hàm tải ảnh về thiết bị
  const downloadImage = async (url: string) => {
    try {
      const fileName = url.split("/").pop() || "downloaded_image.jpg";
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Tải ảnh từ URL
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      
      // Lưu vào thư viện ảnh
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.createAssetAsync(uri);
        console.log("Ảnh đã được lưu vào thư viện!");
      } else {
        console.warn("Quyền truy cập thư viện ảnh bị từ chối!");
      }
    } catch (error: any) {
      console.error("Tải ảnh thất bại:", error.message || error);
    }
  };

  const pickImageAndUpload = async () => {
    try {
      // Bước 1: Chọn nhiều ảnh
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, // Cho phép chọn nhiều ảnh
        quality: 1,
      });
  
      if (result.canceled) {
        return;
      }
  
      // Bước 2: Tạo FormData
      const formData = new FormData();
      result.assets.forEach((image, index) => {
        formData.append("files", {
          uri: image.uri,
          name: image.uri.split("/").pop() || `image_${index}.jpg`,
          type: image.mimeType || "image/jpeg",
        } as any);
      });
      formData.append("userId", "user123"); // Gửi userId
      formData.append("content", ""); // Gửi content (rỗng nếu chỉ gửi file)
  
      // Bước 3: Gửi request lên API upload
      const res = await fetch("http://192.168.1.28:3000/api/files/upload", {
        method: "POST",
        body: formData,
      });
  
      // Kiểm tra phản hồi từ server
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        const errorText = await res.text();
        throw new Error("Upload failed: " + errorText);
      }
  
      const data = await res.json();
      console.log("Upload success:", data);
  
      // Bước 4: Cập nhật tin nhắn sau khi upload thành công
      const now = new Date();
      const isoTimestamp = now.toISOString();
      const { time, dateStr } = formatDate(isoTimestamp);
  
      const newMessages: Message[] = [];
  
      const lastMessage = messages[messages.length - 1] as UserMessage | undefined;
      const lastDate = lastMessage?.timestamp ? formatDate(lastMessage.timestamp).dateStr : null;
  
      // Thêm timestamp nếu ngày thay đổi
      if (lastDate !== dateStr) {
        newMessages.push({
          id: `ts-${Date.now()}`,
          userId: "timestamp",
          time: dateStr,
        });
      }
  
      // Thêm tin nhắn mới với nhiều file
      newMessages.push({
        id: data.data.messageId || String(Date.now()), // Sử dụng messageId từ backend
        text: data.data.content || "",
        userId: "user123",
        time,
        fileUrls: data.data.fileUrls || [], // Mảng fileUrls từ backend
        thumbnailUrls: data.data.thumbnailUrls || [], // Mảng thumbnailUrls từ backend
        filenames: data.data.filenames || [], // Mảng filenames từ backend
        timestamp: data.data.timestamp || isoTimestamp,
      });
  
      setMessages([...messages, ...newMessages]);
    } catch (error: any) {
      console.error("Upload failed:", error.message || error);
    }
  };
  
  

  useEffect(() => {
    if (filteredMessages.length > 0) {
      setInitialIndex(filteredMessages.length - 1)
    }
  }, [filteredMessages])
  
  

  useEffect(() => {
    const filterMessages = () => {
      if (activeTab === "Tất cả") {
        setFilteredMessages(messages)
        return
      }
  
      const filtered = messages.filter((msg) => {
        if (msg.userId === "timestamp") return true // giữ timestamp
  
        const m = msg as UserMessage
  
        switch (activeTab) {
          case "Văn bản":
            return (
              m.text?.trim() &&
              (!m.thumbnailUrls || m.thumbnailUrls.length === 0) &&
              (!m.filenames || m.filenames.length === 0)
            )
          case "Ảnh":
            return m.thumbnailUrls && m.thumbnailUrls.length > 0
          case "File":
            return (
              m.filenames && m.filenames.length > 0 &&
              (!m.thumbnailUrls || m.thumbnailUrls.length === 0)
            )
          case "Link":
            return m.text && /(https?:\/\/[^\s]+)/.test(m.text)
          default:
            return true
        }
      })
  
      setFilteredMessages(filtered)
    }
  
    filterMessages()
  }, [activeTab, messages])
  


  // Fetch messages from API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("http://192.168.1.28:3000/api/messages/user/user123")
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
              userId: "timestamp",
              time: dateStr,
            })
            lastDate = dateStr
          }

          // Thêm tin nhắn
          formattedMessages.push({
            id: msg.messageId,
            text: msg.content || "",
            userId: "user123",
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
          userId: "timestamp",
          time: dateStr,
        })
      }

      // Thêm tin nhắn mới
      newMessages.push({
        id: String(Date.now()),
        text: message,
        userId: "user123",
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
    if (item.userId === "timestamp") {
      return (
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>{item.time}</Text>
        </View>
      );
    }

    const userMessage = item as UserMessage;

    return (
      <View style={[styles.messageContainer, styles.userMessage]}>
        {userMessage.text ? <Text style={styles.messageText}>{userMessage.text}</Text> : null}
        {userMessage.thumbnailUrls && userMessage.thumbnailUrls.length > 0 ? (
          <View style={styles.fileContainer}>
            {userMessage.thumbnailUrls.map((url, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  // Mở modal với ảnh gốc từ fileUrls
                  setSelectedImage(userMessage.fileUrls[index] || url);
                  setModalVisible(true);
                }}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Modal hiển thị ảnh full màn hình */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalBackground} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <Image
              source={{ uri: selectedImage || "" }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </TouchableWithoutFeedback>
          <View style={styles.downloadButtonContainer}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => selectedImage && downloadImage(selectedImage)}
            >
              <Ionicons name="download-outline" size={24} color="white" />
              <Text style={styles.downloadText}>Tải xuống</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
      <View style={{ height: 52, backgroundColor: "white" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={{
            paddingHorizontal: 10,
            alignItems: "center",
          }}
          removeClippedSubviews={false}
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
      </View>

      {/* Collection Section */}
      {/* <View style={styles.collectionContainer}>
        <Text style={styles.collectionTitle}>Bộ sưu tập</Text>
        <TouchableOpacity>
          <Ionicons name="chevron-down" size={24} color="#333" />
        </TouchableOpacity>
      </View> */}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={filteredMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesList}
        initialNumToRender={10}
        initialScrollIndex={initialIndex ?? 0}
        getItemLayout={(data, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        })}
        nestedScrollEnabled={true}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.inputIcon}>
          <Ionicons name="happy-outline" size={24} color="#888" />
        </TouchableOpacity>
        <TextInput style={styles.input} placeholder="Tin nhắn" value={message} onChangeText={setMessage} multiline />
        <TouchableOpacity style={styles.inputIcon}>
          <Ionicons name="mic-outline" size={24} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={pickImageAndUpload}>
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
    // flex: 1,
    backgroundColor: "white",
    height: 52, // Cố định chiều cao
    maxHeight: 52, // Ngăn chiều cao vượt quá
    minHeight: 52, // Ngăn chiều cao bị thu nhỏ
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60, // Đảm bảo kích thước tối thiểu
    height: 32, // Cố định chiều cao
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
    // flex: 1,
    backgroundColor: "#f0f0f5",
  },
  messagesList: {
    // flex: 1,
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
    width: 200,
    height: 200,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileName: {
    fontSize: 14,
    color: "#0066CC",
    marginVertical: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  fullImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
  downloadButtonContainer: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 10,
    borderRadius: 8,
  },
  downloadText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
  },
})

export default ChatScreenCloud