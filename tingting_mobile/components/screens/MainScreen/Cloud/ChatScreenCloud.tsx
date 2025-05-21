import { useState, useEffect, useRef } from "react";
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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import type { FlatList as FlatListType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as DocumentPicker from "expo-document-picker";
import { useCloudSocket } from "../../../../context/CloudSocketContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";

// Define the type for the navigation stack params
type RootStackParamList = {
  Main: undefined;
  MessageScreen: { userId?: string; username?: string };
  ChatScreenCloud: undefined;
};

// Create a type for the component props
type ChatScreenCloudProps = NativeStackScreenProps<
  RootStackParamList,
  "ChatScreenCloud"
>;

// Define interfaces for message types
interface UserMessage {
  messageId: string;
  text: string;
  userId: string;
  time: string;
  fileUrls: string[];
  thumbnailUrls: string[];
  filenames: string[];
  timestamp: string;
}

interface TimestampMessage {
  messageId: string;
  userId: "timestamp";
  time: string;
}

// Union type for messages
type Message = UserMessage | TimestampMessage;

const ChatScreenCloud = ({ route, navigation }: ChatScreenCloudProps) => {
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatListType>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const tabs = ["Tất cả", "Văn bản", "Ảnh", "File", "Link"];
  const { socket } = useCloudSocket();

  // Lấy currentUserId từ AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        let userId = await AsyncStorage.getItem("userId");
        if (!userId) {
          userId = "user123";
          await AsyncStorage.setItem("userId", userId);
        }
        console.log("userId fetched from AsyncStorage:", userId);
        setCurrentUserId(userId);
        setUserId(userId);
      } catch (error) {
        console.error("Failed to fetch userId:", error);
        setCurrentUserId("user123");
      }
    };

    fetchUserId();
  }, []);

  // Log currentUserId sau khi state được cập nhật
  useEffect(() => {
    console.log("Current userId set in state (after update):", currentUserId);
  }, [currentUserId]);

  // Hàm định dạng thời gian
  const formatDate = (isoString: string): { time: string; dateStr: string } => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const time = `${hours}:${minutes}`;
    const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
    return { time, dateStr };
  };

  // Hàm thêm tin nhắn với kiểm tra timestamp
  const addMessageWithTimestamp = (newMessage: UserMessage) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1] as
        | UserMessage
        | undefined;
      const lastDate = lastMessage?.timestamp
        ? formatDate(lastMessage.timestamp).dateStr
        : null;
      const { dateStr } = formatDate(newMessage.timestamp);

      const newMessages: Message[] = [];
      if (lastDate !== dateStr) {
        newMessages.push({
          messageId: `ts-${Date.now()}`,
          userId: "timestamp",
          time: dateStr,
        });
      }
      newMessages.push(newMessage);

      const updatedMessages = [...prevMessages, ...newMessages];

      // Cuộn xuống ngay sau khi thêm tin nhắn mới
      setTimeout(() => {
        if (flatListRef.current && updatedMessages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 0);

      return updatedMessages;
    });
  };

  // Lắng nghe sự kiện Socket.IO
  useEffect(() => {
    if (!socket || !currentUserId) {
      console.warn(
        "Cloud socket not initialized on mobile or currentUserId missing"
      );
      return;
    }

    console.log("Cloud socket active on mobile, currentUserId:", currentUserId);

    socket.on("newMessage", (newMessage: any) => {
      console.log("Cloud socket - Received newMessage on mobile:", newMessage);
      if (!newMessage.userId) {
        console.warn("Cloud socket - newMessage missing userId:", newMessage);
        return;
      }
      if (newMessage.userId === currentUserId) {
        const formattedMessage: UserMessage = {
          messageId: newMessage.messageId,
          text: newMessage.content || "",
          userId: newMessage.userId,
          time: formatDate(newMessage.timestamp).time,
          fileUrls: newMessage.fileUrls || [],
          thumbnailUrls: newMessage.thumbnailUrls || [],
          filenames: newMessage.filenames || [],
          timestamp: newMessage.timestamp,
        };
        addMessageWithTimestamp(formattedMessage);
      } else {
        console.log(
          "Cloud socket - Message ignored, userId mismatch:",
          newMessage.userId,
          "vs",
          currentUserId
        );
      }
    });

    socket.on("messageDeleted", ({ messageId }: { messageId: string }) => {
      console.log(
        "Cloud socket - Received messageDeleted on mobile:",
        messageId
      );
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.messageId !== messageId)
      );
    });

    socket.on("error", (error: any) => {
      console.error("Cloud socket error on mobile:", error);
    });

    socket.on("connect", () => {
      console.log("Cloud socket reconnected on mobile");
    });

    socket.on("disconnect", () => {
      console.warn("Cloud socket disconnected on mobile");
    });

    socket.on("connect_error", (error: any) => {
      console.error("Cloud socket connect_error on mobile:", error.message);
    });

    return () => {
      console.log("Cleaning up cloud socket listeners on mobile");
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("error");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, [socket, currentUserId]);

  // Cuộn xuống tin nhắn mới nhất khi filteredMessages thay đổi
  useEffect(() => {
    if (filteredMessages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [filteredMessages]);

  // Hàm chọn và gửi file
  const pickFileAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length) {
        const formData = new FormData();
        result.assets.forEach((file, index) => {
          formData.append("files", {
            uri: file.uri,
            name:
              file.name ||
              `file_${index}${
                file.mimeType ? `.${file.mimeType.split("/")[1]}` : ""
              }`,
            type: file.mimeType || "application/octet-stream",
          } as any);
        });
        formData.append("userId", currentUserId);
        formData.append("content", "");

        const res = await fetch("http://192.168.1.12:3000/api/files/upload", {
          method: "POST",
          body: formData,
        });

        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Upload failed: ${res.status} - ${errorText}`);
        }
        if (!contentType?.includes("application/json")) {
          throw new Error("Upload failed: Server did not return JSON");
        }

        const data = await res.json();
        // Tin nhắn sẽ được thêm qua Socket.IO
      }
    } catch (error: any) {
      console.error("Upload failed:", error.message || error);
      Alert.alert(
        "Lỗi",
        "Không thể tải file lên: " + (error.message || "Vui lòng thử lại")
      );
    }
  };

  // Hàm tải ảnh
  const downloadImage = async (url: string) => {
    try {
      const fileName = url.split("/").pop() || "downloaded_image.jpg";
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri);
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.createAssetAsync(uri);
        Alert.alert("Thành công", "Ảnh đã được lưu vào thư viện!");
      } else {
        Alert.alert("Lỗi", "Quyền truy cập thư viện ảnh bị từ chối!");
      }
    } catch (error: any) {
      console.error("Tải ảnh thất bại:", error.message || error);
      Alert.alert(
        "Lỗi",
        "Không thể tải ảnh: " + (error.message || "Vui lòng thử lại")
      );
    }
  };

  // Hàm chọn và gửi ảnh
  const pickImageAndUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        const formData = new FormData();
        result.assets.forEach((image, index) => {
          formData.append("files", {
            uri: image.uri,
            name: image.uri.split("/").pop() || `image_${index}.jpg`,
            type: image.mimeType || "image/jpeg",
          } as any);
        });
        formData.append("userId", currentUserId);
        formData.append("content", "");

        const res = await fetch("http://192.168.1.12:3000/api/files/upload", {
          method: "POST",
          body: formData,
        });

        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType?.includes("application/json")) {
          const errorText = await res.text();
          throw new Error("Upload failed: " + errorText);
        }

        const data = await res.json();
        // Tin nhắn sẽ được thêm qua Socket.IO
      }
    } catch (error: any) {
      console.error("Upload failed:", error.message || error);
      Alert.alert(
        "Lỗi",
        "Không thể tải ảnh lên: " + (error.message || "Vui lòng thử lại")
      );
    }
  };

  // Hàm xóa tin nhắn
  const deleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const response = await fetch(
        `http://192.168.1.12:3000/api/messages/${messageToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Tin nhắn sẽ được xóa qua Socket.IO
      setDeleteModalVisible(false);
      setMessageToDelete(null);
    } catch (error: any) {
      console.error("Xóa tin nhắn thất bại:", error.message || error);
      Alert.alert(
        "Lỗi",
        "Không thể xóa tin nhắn: " + (error.message || "Vui lòng thử lại")
      );
    }
  };

  // Hàm gửi tin nhắn
  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const response = await fetch(
        "http://192.168.1.12:3000/api/messages/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
            content: message.trim(),
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setMessage("");
      // Tin nhắn sẽ được thêm qua Socket.IO
    } catch (error: any) {
      console.error("Gửi tin nhắn thất bại:", error.message || error);
      Alert.alert(
        "Lỗi",
        "Không thể gửi tin nhắn: " + (error.message || "Vui lòng thử lại")
      );
    }
  };

  // Hàm lấy icon theo loại file
  const getFileIcon = (filename: string) => {
    const lowerCaseName = filename.toLowerCase();
    if (lowerCaseName.endsWith(".pdf")) return "document-text-outline";
    if (lowerCaseName.endsWith(".doc") || lowerCaseName.endsWith(".docx"))
      return "document-outline";
    if (lowerCaseName.endsWith(".xls") || lowerCaseName.endsWith(".xlsx"))
      return "grid-outline";
    if (lowerCaseName.endsWith(".txt")) return "reader-outline";
    return "document";
  };

  // Fetch messages từ API
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserId) {
        console.warn("Cannot fetch messages: currentUserId is null");
        return;
      }

      try {
        const response = await fetch(
          `http://192.168.1.12:3000/api/messages/user/${currentUserId}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        const sortedData = data.sort(
          (a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const formattedMessages: Message[] = [];
        let lastDate: string | null = null;

        sortedData.forEach((msg: any) => {
          const { time, dateStr } = formatDate(msg.timestamp);

          if (lastDate !== dateStr) {
            formattedMessages.push({
              messageId: `ts-${msg.messageId}`,
              userId: "timestamp",
              time: dateStr,
            });
            lastDate = dateStr;
          }

          formattedMessages.push({
            messageId: msg.messageId,
            text: msg.content || "",
            userId: currentUserId,
            time,
            fileUrls: msg.fileUrls || [],
            thumbnailUrls: msg.thumbnailUrls || [],
            filenames: msg.filenames || [],
            timestamp: msg.timestamp,
          });
        });

        setMessages(formattedMessages);
      } catch (error: any) {
        console.error("Error fetching messages:", {
          message: error.message,
          stack: error.stack,
        });
      }
    };

    if (currentUserId) {
      fetchMessages();
    }
  }, [currentUserId]);

  // Lọc tin nhắn theo tab
  useEffect(() => {
    const filterMessages = () => {
      if (activeTab === "Tất cả") {
        setFilteredMessages(messages);
        return;
      }

      const filtered = messages.filter((msg) => {
        if (msg.userId === "timestamp") return true;

        const m = msg as UserMessage;

        switch (activeTab) {
          case "Văn bản":
            return (
              m.text?.trim() &&
              (!m.thumbnailUrls || m.thumbnailUrls.length === 0) &&
              (!m.filenames || m.filenames.length === 0)
            );
          case "Ảnh":
            return m.thumbnailUrls && m.thumbnailUrls.length > 0;
          case "File":
            return (
              m.filenames &&
              m.filenames.length > 0 &&
              (!m.thumbnailUrls || m.thumbnailUrls.length === 0)
            );
          case "Link":
            return m.text && /(https?:\/\/[^\s]+)/.test(m.text);
          default:
            return true;
        }
      });

      setFilteredMessages(filtered);
    };

    filterMessages();
  }, [activeTab, messages]);

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
      <TouchableOpacity
        style={[styles.messageContainer, styles.userMessage]}
        onLongPress={() => {
          setMessageToDelete(item.messageId);
          setDeleteModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        {userMessage.text ? (
          <Text style={styles.messageText}>{userMessage.text}</Text>
        ) : null}
        {userMessage.thumbnailUrls && userMessage.thumbnailUrls.length > 0 ? (
          <View style={styles.fileContainer}>
            {userMessage.thumbnailUrls.map((url, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
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
        {userMessage.filenames &&
        userMessage.filenames.length > 0 &&
        !userMessage.thumbnailUrls.length ? (
          <View style={styles.fileContainer}>
            {userMessage.filenames.map((name, index) => (
              <View key={index} style={styles.fileItem}>
                <Ionicons
                  name={getFileIcon(name)}
                  size={28}
                  color="#0066CC"
                  style={styles.fileIcon}
                />
                <Text style={styles.fileName}>{name}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {userMessage.time ? (
          <Text style={styles.messageTime}>{userMessage.time}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Modal xem ảnh */}
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
            {/* <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => selectedImage && downloadImage(selectedImage)}
            >
              <Ionicons name="download-outline" size={24} color="white" />
              <Text style={styles.downloadText}>Tải xuống</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Xóa tin nhắn?</Text>
            <Text style={styles.deleteModalText}>
              Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này không thể
              hoàn tác.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setMessageToDelete(null);
                }}
              >
                <Text style={styles.deleteModalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.deleteButton]}
                onPress={deleteMessage}
              >
                <Text
                  style={[styles.deleteModalButtonText, { color: "white" }]}
                >
                  Xóa
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cloud của tôi</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => {
              navigation.push("ChatInfoCloud", { userId });
            }}
          >
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.messageId}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesList}
          initialNumToRender={10}
          getItemLayout={(data, index) => ({
            length: 100,
            offset: 100 * index,
            index,
          })}
          nestedScrollEnabled={true}
          initialScrollIndex={
            filteredMessages.length > 0
              ? filteredMessages.length - 1
              : undefined
          }
          onContentSizeChange={() => {
            if (filteredMessages.length > 0 && flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có tin nhắn</Text>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tin nhắn"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          {message.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send" size={24} color="#FF9500" />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.inputIcon}
                onPress={pickFileAndUpload}
              >
                <Ionicons name="attach-outline" size={24} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inputIcon}
                onPress={pickImageAndUpload}
              >
                <Ionicons name="image-outline" size={24} color="#888" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    height: 52,
    maxHeight: 52,
    minHeight: 52,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
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
  messagesContainer: {
    backgroundColor: "#f0f0f5",
  },
  messagesList: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    paddingBottom: 20,
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
    marginHorizontal: 5,
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
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  fileIcon: {
    marginRight: 20,
    color: "#0066CC",
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
  deleteModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  deleteModalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  deleteModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});

export default ChatScreenCloud;
