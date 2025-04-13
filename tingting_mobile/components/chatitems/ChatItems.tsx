import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

type ChatItemProps = {
  avatar: string | number;
  username: string;
  lastMessage: string;
  time: string;
  onPress?: () => void;
};

const ChatItems: React.FC<ChatItemProps> = ({ avatar, username, lastMessage, time, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={typeof avatar === "string" ? { uri: avatar } : avatar}
        style={styles.avatar}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.time}>
            {time}
          </Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  lastMessage: {
    fontSize: 14,
    color: '#555',
  },
});

export default ChatItems;
