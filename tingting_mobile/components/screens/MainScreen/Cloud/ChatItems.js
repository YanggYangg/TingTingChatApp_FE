import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

const ChatItems = ({
  avatar,
  username,
  lastMessage,
  time,
  onPress,
  verified = false,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: avatar }} style={styles.avatar} />
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.message} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  time: {
    fontSize: 14,
    color: "#888",
  },
  message: {
    fontSize: 14,
    color: "#666",
  },
});

export default ChatItems;
