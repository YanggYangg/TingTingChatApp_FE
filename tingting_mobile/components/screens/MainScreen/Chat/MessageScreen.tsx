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
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

//Dinh nghia kieu cho message
interface Message {
  id: string;
  text: string;
  sender: string;
  userID: string;
  recalled?: boolean;
}

//sau nay se co api thi phai lay du lieu tu api ve
const messagesData = [
  { id: "1", text: "hello ", sender: "me", userID: "user1" },
  { id: "2", text: "hi", sender: "other", userID: "user2" },
  { id: "3", text: "hi", sender: "other", userID: "user2" },
  { id: "4", text: "hi", sender: "other", userID: "user2" },
];

const MessageScreen = ({ route, navigation }: any) => {
  const { username } = route.params;

  const [messages, setMessages] = useState<Message[]>(messagesData);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [inputText, setInputText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (inputText.trim() === "") return;
    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "me",
      userID: "user1",
    };
    setMessages([...messages, newMessage]);
    setInputText("");
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      onLongPress={() => {
        if (item.sender === "me") {
          setSelectedMessage(item);
          setShowOptions(true);
        }
      }}
    >
      <View
        style={[
          styles.messageItem,
          item.sender === "me" ? styles.messageRight : styles.messageLeft,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.recalled && { fontStyle: "italic", color: "gray" },
          ]}
        >{item.text}</Text>
      </View>
    </TouchableOpacity>
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
          <Text style={styles.headerText}>{username}</Text>
        </View>
        <View style={styles.rightContainer}>
          <TouchableOpacity
            onPress={() => console.log("Call")}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="call-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => console.log("Video Call")}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="videocam-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => console.log("Menu")}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body*/}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.chatBody}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[
            styles.sendButton,
            { opacity: inputText.trim() === "" ? 0.5 : 1 }, // Doi do mo neu khong co tn
          ]}
          disabled={inputText.trim() === ""} // Vo hieu hoa nut neu khong co tn
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.optionBox}>
              <TouchableOpacity
                onPress={() => {
                  // TODO: handle forward
                  setShowOptions(false);
                  console.log("Chuyển tiếp", selectedMessage);
                }}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Chuyển tiếp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (selectedMessage) {
                    const updatedMessages = messages.map((msg) =>
                      msg.id === selectedMessage.id
                        ? { ...msg, text: "Tin nhắn đã được thu hồi", recalled: true }
                        : msg
                    );
                    setMessages(updatedMessages);
                  }
                  setShowOptions(false);
                  setSelectedMessage(null);
                }}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Thu hồi</Text>
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
  chatBody: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageItem: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: "70%",
  },
  messageLeft: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  messageRight: {
    alignSelf: "flex-end",
    backgroundColor: "#d2effd",
  },
  messageText: {
    color: "#000",
  },
  footer: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 200,
  },
  optionButton: {
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 16,
    color: "#007AFF",
    textAlign: "center",
  },
});

export default MessageScreen;
