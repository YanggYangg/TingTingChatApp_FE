import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";



//Dinh nghia kieu cho message
interface Message {
  id: string;
  text: string;
  sender: string;
}

const messagesData = [
    { id: "1", text: "Xin chào! Tôi là chatbot của tingting app ! Bạn cần hỗ trợ gì?", sender: "bot" },
]

const MessageSupportScreen = () => {
  const route = useRoute();
  const { username } = route.params as { username: string };
  const navigation = useNavigation();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>(messagesData);
  const [modalVisible, setModalVisible] = useState(false);


  const handleSend = () => {
    if (inputText.trim() === "") return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };

    setMessages([...messages, newMessage]);
    setInputText("");
    Keyboard.dismiss();

    // Giả lập phản hồi từ bot
    setTimeout(() => {
      const botReply = {
        id: Date.now().toString() + "_bot",
        text: "Cảm ơn bạn đã nhắn! Tôi sẽ hỗ trợ bạn ngay.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botReply]);
    }, 1000);
  };

  const renderItem = ({ item } : any) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.leftContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>{ username }</Text>
        </View>
        <View style={styles.rightContainer}>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{ marginLeft: 15 }}
          >
            <Ionicons
              name="information-circle-outline"
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body: Tin nhắn */}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        style={{ flex: 1 }}
      />

      {/* Footer: Nhập tin nhắn */}
      <View style={styles.footerContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { opacity: inputText.trim() === "" ? 0.5 : 1 },
          ]}
          onPress={handleSend}
          disabled={inputText.trim() === ""}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Giới thiệu Chatbot</Text>
        <Text style={styles.modalContent}>
          Đây là chatbot của TingTingApp. Tôi sẽ hỗ trợ bạn các vấn đề liên quan đến ứng dụng, học tập, tài khoản và nhiều hơn nữa.
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setModalVisible(false)}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableWithoutFeedback>
</Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e4e8f3",
  },
  headerContainer: {
    backgroundColor: "#0196fc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 16,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
    color: "#fff",
  },
  footerContainer: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 10,
  },
  messageContainer: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  userMessage: {
    backgroundColor: "#d2effd",
    alignSelf: "flex-end",
  },
  botMessage: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#0196fc",
  },
  modalContent: {
    fontSize: 16,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#0196fc",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  
});

export default MessageSupportScreen;
