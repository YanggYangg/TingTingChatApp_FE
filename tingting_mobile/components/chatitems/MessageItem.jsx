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
  onLongPress, // Thêm sự kiện onLongPress
}) => {
  const isCurrentUser = msg.userId === currentUserId;
  const repliedMessage = messages?.find((m) => m._id === msg.replyMessageId);

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(msg)} // Thêm sự kiện nhấn giữ
      delayLongPress={500} // Thời gian delay cho sự kiện nhấn giữ
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
        {/* Hiển thị người gửi nếu không phải current user */}
        {!isCurrentUser && !msg.isRevoked && (
          <Text style={styles.senderText}>{msg.sender}</Text>
        )}

        {/* Nếu đã bị thu hồi thì chỉ hiển thị text */}
        {msg.isRevoked ? (
          <Text style={styles.revokedText}>Tin nhắn đã được thu hồi</Text>
        ) : (
          <>
            {/* Tin nhắn trả lời */}
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

            {/* Tin nhắn văn bản không phải reply */}
            {msg.messageType === "text" && !msg.replyMessageId && (
              <Text>{msg.content}</Text>
            )}

            {/* Tin nhắn hình ảnh */}
            {msg.messageType === "image" && (
              <Image
                source={{ uri: msg.linkURL }}
                style={styles.imageMessage}
                alt="Ảnh"
              />
            )}

            {/* Tin nhắn file */}
            {msg.messageType === "file" && (
              <View style={styles.fileMessage}>
                <Text style={styles.fileText}>
                  {msg.content || "Tệp đính kèm"}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Thời gian */}
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
    alignSelf: "flex-end", // Tin nhắn của mình sẽ nằm bên phải
  },
  messageLeft: {
    alignSelf: "flex-start", // Tin nhắn của người khác sẽ nằm bên trái
  },
  messageBox: {
    padding: 10,
    borderRadius: 10,
    maxWidth: "70%",
    position: "relative",
  },
  messageRightBox: {
    backgroundColor: "#dcf8c6", // Màu nền cho tin nhắn của mình
  },
  messageLeftBox: {
    backgroundColor: "#fff", // Màu nền cho tin nhắn của người khác
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
  },
  fileMessage: {
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
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
