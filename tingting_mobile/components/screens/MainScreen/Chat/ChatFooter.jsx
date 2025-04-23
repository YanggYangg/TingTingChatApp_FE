import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Api_S3 } from "../../../../apis/api_s3";

const ChatFooter = ({ sendMessage, replyingTo, setReplyingTo }) => {
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);

  const truncateMessage = (content, maxLength = 50) =>
    content?.length > maxLength
      ? content.slice(0, maxLength) + "..."
      : content || "[Tin nhắn trống]";

  const handleKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === "Enter" && !nativeEvent.shiftKey) {
      handleSend();
    }
  };

  const handleAttachMedia = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Lỗi",
          "Cần quyền truy cập thư viện ảnh để chọn hình ảnh hoặc video"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const type = asset.mimeType?.startsWith("image/") ? "image" : "video";
        const file = {
          uri:
            Platform.OS === "android"
              ? asset.uri
              : asset.uri.replace("file://", ""),
          name: asset.fileName || `media_${Date.now()}`,
          type:
            asset.mimeType || (type === "image" ? "image/jpeg" : "video/mp4"),
        };
        setAttachedFile({ file, type });
        setPreviewURL(file.uri);
      }
    } catch (err) {
      console.error("Media picker error:", err);
      Alert.alert("Lỗi", "Không thể chọn hình ảnh hoặc video");
    }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Chọn mọi loại file
        copyToCacheDirectory: true,
      });

      if (
        result.type !== "cancel" &&
        result.assets &&
        result.assets.length > 0
      ) {
        const asset = result.assets[0];
        const file = {
          uri:
            Platform.OS === "android"
              ? asset.uri
              : asset.uri.replace("file://", ""),
          name: asset.name || `file_${Date.now()}`,
          type: asset.mimeType || "application/octet-stream",
        };
        setAttachedFile({ file, type: "file" });
        setPreviewURL(null); // File không có preview hình ảnh
      }
    } catch (err) {
      console.error("Document picker error:", err);
      Alert.alert("Lỗi", "Không thể chọn file");
    }
  };

  const uploadToS3 = async (file, retries = 2) => {
    const formData = new FormData();
    formData.append("media", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}: Uploading to http://192.168.1.33:5000`
        );
        const res = await fetch(
          "http://192.168.1.33:5000/messages/sendMessageWithMedia",
          {
            method: "POST",
            body: formData,
          }
        );
        //const res = Api_S3.uploadFile(formData);

        const text = await res.text();
        console.log("Response status:", res.status);
        console.log("Raw response text:", text);

        if (!res.ok) {
          console.error(
            `Upload failed with status ${res.status}: ${res.statusText}`
          );
          throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        }

        try {
          const data = JSON.parse(text);
          if (!data.linkURL) {
            throw new Error("Response missing linkURL");
          }
          return data.linkURL;
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          throw new Error("Invalid JSON response");
        }
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err);
        if (attempt === retries) {
          throw new Error(
            err.message.includes("Network request failed")
              ? "Không thể kết nối tới server. Vui lòng kiểm tra mạng hoặc server."
              : err.message
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !attachedFile) return;

    try {
      let fileURL = null;
      let messageType = "text";
      let content = message.trim();

      if (attachedFile) {
        fileURL = await uploadToS3(attachedFile.file);
        if (!fileURL) return;

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
          replyMessageId: replyingTo._id,
          replyMessageContent: replyingTo.content,
          replyMessageType: replyingTo.messageType,
          replyMessageSender: replyingTo.sender,
        }),
      };

      console.log("Payload gửi đi:", payload);
      sendMessage(payload);

      setMessage("");
      setAttachedFile(null);
      setPreviewURL(null);
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Lỗi", error.message || "Không thể gửi tin nhắn");
    }
  };

  return (
    <View style={styles.container}>
      {replyingTo && (
        <View style={styles.replyPreview}>
          <View>
            <Text style={styles.replySender}>
              Đang trả lời {replyingTo.sender || "Unknown"}
            </Text>
            <Text style={styles.replyContent}>
              {truncateMessage(
                replyingTo.messageType === "text"
                  ? replyingTo.content
                  : `[${replyingTo.messageType}]`
              )}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setReplyingTo(null)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      {attachedFile && (
        <View style={styles.filePreview}>
          {attachedFile.type === "image" ? (
            <Image
              source={{ uri: previewURL }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.previewText}>
              [{attachedFile.type === "video" ? "Video" : "File"}:{" "}
              {attachedFile.file.name}]
            </Text>
          )}
          <TouchableOpacity
            onPress={() => {
              setAttachedFile(null);
              setPreviewURL(null);
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={handleAttachMedia}>
          <Ionicons name="image" size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAttachFile}>
          <Ionicons name="attach" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={setMessage}
          onKeyPress={handleKeyPress}
          multiline
        />
        <TouchableOpacity onPress={handleSend}>
          <Ionicons name="send" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
  },
  replyPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  replySender: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 14,
  },
  replyContent: {
    color: "#6B7280",
    fontSize: 12,
  },
  filePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 8,
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    paddingVertical: 4,
  },
});

export default ChatFooter;
