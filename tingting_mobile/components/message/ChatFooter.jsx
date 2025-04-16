import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // for picking images
import * as DocumentPicker from "expo-document-picker"; // for picking files

const ChatFooter = ({
  inputText,
  setInputText,
  handleSend,
  replyingTo,
  setReplyingTo,
}) => {
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setAttachedFile({ type: "image", file: result.assets[0] });
      setFilePreview(result.assets[0].uri);
    }
  };

  const handlePickFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: "*/*" });

    if (result.type === "success") {
      setAttachedFile({ type: "file", file: result });
      setFilePreview(result.uri);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !attachedFile) return;

    try {
      let fileURL = null;
      let messageType = "text";
      let content = inputText.trim();

      if (attachedFile) {
        fileURL = attachedFile.file.uri;
        messageType = attachedFile.type;
        content = content || attachedFile.file.name || `[${messageType}]`;
      }

      if (replyingTo) {
        messageType = "reply";
      }

      const payload = {
        messageType,
        content,
        ...(fileURL && { linkURL: fileURL }),
        ...(replyingTo && {
          replyMessageId: replyingTo.id,
          replyMessageContent: replyingTo.content,
        }),
      };

      // Send the message (calling the function passed as a prop)
      handleSend(payload);

      setInputText("");
      setAttachedFile(null);
      setFilePreview(null);
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <View style={styles.footer}>
      {replyingTo && (
        <View style={styles.replyPreview}>
          <Text style={styles.replyText}>
            Replying to: {replyingTo.sender || "Unknown"}
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      )}

      {attachedFile && (
        <View style={styles.filePreview}>
          {attachedFile.type === "image" ? (
            <Image source={{ uri: filePreview }} style={styles.imagePreview} />
          ) : (
            <Text>{attachedFile.file.name}</Text>
          )}
          <TouchableOpacity onPress={() => setAttachedFile(null)}>
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
          <Ionicons name="image-outline" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePickFile} style={styles.iconButton}>
          <Ionicons name="attach" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter message..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "column",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  replyText: {
    fontSize: 14,
    color: "#666",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  imagePreview: {
    width: 40,
    height: 40,
    borderRadius: 5,
    marginRight: 10,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-start", // Align buttons to the left
    marginBottom: 10,
  },
  iconButton: {
    marginHorizontal: 5, // Reduce space between buttons
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 50,
  },
});

export default ChatFooter;
