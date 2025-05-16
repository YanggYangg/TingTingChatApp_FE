import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView, LongPressGestureHandler, State } from "react-native-gesture-handler";

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
  isPinned?: boolean;
  isMuted?: boolean;
  onPinConversation?: () => void;
  onMuteConversation?: () => void;
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
  isPinned,
  isMuted,
  onPinConversation,
  onMuteConversation,
}) => {
  const handleLongPress = ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {
      Alert.alert(
        "Tùy chọn",
        `Tùy chọn cho ${username}`,
        [
          {
            text: isPinned ? "Bỏ ghim" : "Ghim",
            onPress: onPinConversation,
          },
          {
            text: isMuted ? "Bật thông báo" : "Tắt thông báo",
            onPress: onMuteConversation,
          },
          {
            text: "Hủy",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <GestureHandlerRootView>
      <LongPressGestureHandler onHandlerStateChange={handleLongPress}>
        <TouchableOpacity style={styles.container} onPress={onPress}>
          <View style={styles.avatarContainer}>
            <Image
              source={typeof avatar === "string" ? { uri: avatar } : avatar}
              style={styles.avatar}
            />
            {type === "group" && members > 2 && (
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>{members}</Text>
              </View>
            )}
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.username} numberOfLines={1}>
                {username}
              </Text>
              <View style={styles.statusIcons}>
                {isPinned && <Ionicons name="pin-outline" size={16} color="#FFD700" />}
                {isMuted && <Ionicons name="notifications-off-outline" size={16} color="#888" />}
                <Text style={styles.time}>{time}</Text>
              </View>
            </View>

            <View style={styles.messageRow}>
              {isCall ? (
                <>
                  <Ionicons name="call-outline" size={14} color={missed ? "red" : "green"} />
                  <Text
                    style={[styles.lastMessage, { color: missed ? "red" : "#555" }]}
                    numberOfLines={1}
                  >
                    Voice call {missed ? "missed" : "incoming"}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={14} color="#555" />
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {lastMessage}
                  </Text>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </LongPressGestureHandler>
    </GestureHandlerRootView>
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
  statusIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  time: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
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