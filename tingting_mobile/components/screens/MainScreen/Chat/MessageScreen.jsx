import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { useSocket } from "../../../../contexts/SocketContext";

const ChatScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const selectedMessageData = useSelector(
    (state) => state.chat.selectedMessage
  );
  const selectedMessageId = selectedMessageData?.id;
  const currentUserId = socket?.io?.opts?.query?.userId;

  useEffect(() => {
    if (!socket || !selectedMessageId) return;

    socket.emit("joinConversation", { conversationId: selectedMessageId });

    socket.on("loadMessages", (data) => setMessages(data));

    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) =>
        prev.some((msg) => msg._id === newMessage._id)
          ? prev
          : [...prev, newMessage]
      );
    });

    socket.on("messageSent", (newMessage) => {
      setMessages((prev) =>
        prev.some((msg) => msg._id === newMessage._id)
          ? prev
          : [...prev, newMessage]
      );
    });

    return () => {
      socket.off("loadMessages");
      socket.off("receiveMessage");
      socket.off("messageSent");
    };
  }, [socket, selectedMessageId]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const payload = {
      conversationId: selectedMessageId,
      message: {
        content: inputText,
        messageType: "text",
        ...(replyingTo && { replyMessageId: replyingTo._id }),
      },
    };

    socket.emit("sendMessage", payload);
    setInputText("");
    setReplyingTo(null);
  };

  const handleRevoke = () => {
    if (!selectedMessage) return;

    socket.emit("revokeMessage", {
      messageId: selectedMessage._id,
      conversationId: selectedMessageId,
    });

    setShowOptions(false);
  };

  const handleLongPress = (msg) => {
    if (msg.userId === currentUserId) {
      setSelectedMessage(msg);
      setShowOptions(true);
    }
  };

  const formatTime = (time) =>
    new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderItem = ({ item }) => (
    <TouchableOpacity onLongPress={() => handleLongPress(item)}>
      <View
        style={[
          styles.messageItem,
          item.userId === currentUserId
            ? styles.messageRight
            : styles.messageLeft,
        ]}
      >
        {item.replyMessageId && (
          <Text style={styles.replyText}>↪️ Đang trả lời...</Text>
        )}
        <Text>{item.content}</Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Danh sách tin nhắn */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 10 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Đang trả lời */}
      {replyingTo && (
        <View style={styles.replyBox}>
          <Text>Đang trả lời: {replyingTo.content}</Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Ionicons name="close" size={16} color="red" />
          </TouchableOpacity>
        </View>
      )}

      {/* Nhập tin nhắn */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity onPress={sendMessage} disabled={!inputText.trim()}>
          <Ionicons name="send" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Modal lựa chọn tin nhắn */}
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.optionBox}>
              <TouchableOpacity onPress={() => setReplyingTo(selectedMessage)}>
                <Text style={styles.optionText}>Trả lời</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRevoke}>
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
    backgroundColor: "#f9f9f9",
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  messageItem: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 10,
    maxWidth: "70%",
  },
  messageLeft: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  messageRight: {
    alignSelf: "flex-end",
    backgroundColor: "#dcf8c6",
  },
  time: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },
  replyText: {
    fontSize: 12,
    color: "gray",
    fontStyle: "italic",
    marginBottom: 4,
  },
  replyBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#eee",
    padding: 8,
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  optionBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: 200,
  },
  optionText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 10,
  },
});

export default ChatScreen;
