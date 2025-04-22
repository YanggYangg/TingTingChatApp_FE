import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

const MessageItem = ({
  msg,
  currentUserId,
  onReply,
  onForward,
  onDelete,
  onRevoke,
  messages,
  onLongPress,
}) => {
  const isCurrentUser = msg.userId === currentUserId;
  const repliedMessage = messages?.find((m) => m._id === msg.replyMessageId);

  const renderImages = () => {
    if (!msg.linkURL) return null;

    const images = Array.isArray(msg.linkURL) ? msg.linkURL : [msg.linkURL];

    return images.map((uri, index) => (
      <Image
        key={index}
        source={{ uri }}
        style={styles.imageMessage}
        alt="Ảnh"
      />
    ));
  };

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(msg)}
      delayLongPress={500}
      style={[
        styles.messageContainer,
        isCurrentUser ? styles.messageRight : styles.messageLeft,
      ]}
    >
      <View
        style={[
          styles.messageBox,
          isCurrentUser ? styles.messageRightBox : styles.messageLeftBox,
        ]}
      >
        {!isCurrentUser && !msg.isRevoked && (
          <Text style={styles.senderText}>{msg.sender}</Text>
        )}

        {msg.isRevoked ? (
          <Text style={styles.revokedText}>Tin nhắn đã được thu hồi</Text>
        ) : (
          <>
            {/* Reply message */}
            {msg.messageType === "reply" && (
              <View style={styles.replyBox}>
                <Text style={styles.repliedMessageSender}>
                  {repliedMessage?.sender || ""}
                </Text>
                <Text style={styles.repliedMessageContent}>
                  {repliedMessage?.messageType === "image"
                    ? "[Ảnh]"
                    : repliedMessage?.messageType === "file"
                    ? "[Tệp]"
                    : repliedMessage?.content || "[Tin nhắn đã bị xóa]"}
                </Text>
                <Text style={styles.repliedMessage}>{msg.content}</Text>
              </View>
            )}

            {/* Text message (not reply) */}
            {msg.messageType === "text" && !msg.replyMessageId && (
              <Text>{msg.content}</Text>
            )}

            {/* Image message */}
            {msg.messageType === "image" && renderImages()}

            {/* File message */}
            {msg.messageType === "file" && (
              <View style={styles.fileMessage}>
                <Text style={styles.fileText}>
                  {msg.content || "Tệp đính kèm"}
                </Text>
              </View>
            )}
          </>
        )}

        <Text style={styles.time}>{msg.time}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 16,
    position: "relative",
  },
  messageRight: {
    alignSelf: "flex-end",
  },
  messageLeft: {
    alignSelf: "flex-start",
  },
  messageBox: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    position: "relative",
  },
  messageRightBox: {
    backgroundColor: "#dcf8c6",
  },
  messageLeftBox: {
    backgroundColor: "#fff",
  },
  senderText: {
    fontSize: 12,
    color: "gray",
    fontWeight: "bold",
  },
  revokedText: {
    fontStyle: "italic",
    color: "gray",
  },
  replyBox: {
    backgroundColor: "#f1f1f1",
    padding: 8,
    borderRadius: 5,
    marginBottom: 4,
  },
  repliedMessageSender: {
    fontSize: 12,
    fontWeight: "bold",
  },
  repliedMessageContent: {
    fontSize: 12,
    color: "gray",
    fontStyle: "italic",
  },
  repliedMessage: {
    marginTop: 4,
  },
  imageMessage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginTop: 4,
  },
  fileMessage: {
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 4,
  },
  fileText: {
    fontSize: 12,
    color: "blue",
  },
  time: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
    textAlign: "right",
  },
});

export default MessageItem;
