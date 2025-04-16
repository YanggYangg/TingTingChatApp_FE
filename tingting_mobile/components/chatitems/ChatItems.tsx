import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather"; // Dùng Feather từ vector-icons

type ChatItemProps = {
  avatar: string | number;
  username: string;
  lastMessage: string;
  time: string;
  onPress?: () => void;
  isCall?: boolean;
  missed?: boolean;
  type?: "group" | "private";
  members?: number;
};

const ChatItems: React.FC<ChatItemProps> = ({
  avatar,
  username,
  lastMessage,
  time,
  onPress,
  isCall,
  missed,
  type,
  members,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image
          source={typeof avatar === "string" ? { uri: avatar } : avatar}
          style={styles.avatar}
        />
        {type === "group" && (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{members}+</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        <View style={styles.messageRow}>
          {isCall ? (
            <>
              <Icon name="phone" size={14} color={missed ? "red" : "green"} />
              <Text
                style={[styles.lastMessage, { color: missed ? "red" : "#555" }]}
              >
                Voice call {missed ? "missed" : "incoming"}
              </Text>
            </>
          ) : (
            <>
              <Icon name="message-circle" size={14} color="#555" />
              <Text style={styles.lastMessage} numberOfLines={1}>
                {lastMessage}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    backgroundColor: "white",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  groupBadge: {
    position: "absolute",
    bottom: -4,
    right: -6,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 12,
  },
  groupBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: "#888",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#555",
    marginLeft: 4,
  },
});

export default ChatItems;
