import React, { useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { Api_ChatGPT } from "../../../../apis/api_chatgpt";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, removeLoadingMessage, resetMessages, loadMessages } from "../../../../redux/slices/chatGPTSlice";


//Dinh nghia kieu cho message
interface Message {
  id: string;
  text: string;
  sender: string;
  isLoading?: boolean;
}


const messagesData = [
    { id: "1", text: "Xin chào! Tôi là chatbot của tingting app ! Bạn cần hỗ trợ gì?", sender: "bot" },
]

const MessageSupportScreen = () => {
  const route = useRoute();
  const { username } = route.params as { username: string };
  const navigation = useNavigation();
  const [inputText, setInputText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const dispatch = useDispatch();
  const messages = useSelector((state: any) => state.chatGPT.messages);

  useEffect(() => {
    // Load messages when component mounts
    // dispatch(loadMessages());
  }, [dispatch]);

  const handleSend = async () => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
    };

    dispatch(addMessage(userMessage));
    setInputText("");
    Keyboard.dismiss();

    // Add loading message
    const loadingMessage: Message = {
      id: "loading_" + Date.now(),
      text: "Đang trả lời...",
      sender: "bot",
      isLoading: true,
    };
    dispatch(addMessage(loadingMessage));

    try {
      const response = await Api_ChatGPT.sendMessage({
        message: inputText.trim()
      });

      // Remove loading message and add bot response
      dispatch(removeLoadingMessage(loadingMessage.id));
      dispatch(addMessage({
        id: Date.now().toString(),
        text: response.data.message,
        sender: "bot"
      }));
    } catch (error) {
      console.error("Error sending message to ChatGPT:", error);
      
      // Remove loading message and add error message
      dispatch(removeLoadingMessage(loadingMessage.id));
      dispatch(addMessage({
        id: Date.now().toString(),
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
        sender: "bot"
      }));
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMessage : styles.botMessage,
      ]}
    >
      {item.isLoading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <Text style={styles.messageText}>{item.text}</Text>
      )}
    </View>
  );

  const handleNewChat = () => {
    dispatch(resetMessages());
  };

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
            onPress={handleNewChat}
            style={{ marginLeft: 15 }}
          >
            
            <Ionicons 
              name="add-circle-outline"
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
          ref={inputRef}
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChangeText={setInputText}
          onKeyPress={handleKeyPress}
          multiline
          maxLength={1000}
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
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginRight: 8,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
