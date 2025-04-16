import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ChatItems from "@/components/chatitems/ChatItems";
import ChatSupportItems from "@/components/chatitems/ChatSupportItems";
import ChatCloudItems from "@/components/chatitems/ChatCloudItems";

const ChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const chatData = [
    {
      id: "1",
      avatar: "https://picsum.photos/200",
      username: "Nguyễn Văn A",
      lastMessage: "Chào bạn!",
      time: "10:30 AM",
    },
    {
      id: "2",
      avatar: "https://picsum.photos/200",
      username: "Nguyễn Văn B",
      lastMessage: "Chào em!",
      time: "10:40 AM",
    },
    {
      id: "3",
      avatar: "https://picsum.photos/200",
      username: "Nguyễn Văn C",
      lastMessage: "Chào em!",
      time: "10:40 AM",
    },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        data={chatData}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <ChatSupportItems />
            <ChatCloudItems />
          </View>
        }
        renderItem={({ item }) => (
          <ChatItems
            avatar={item.avatar}
            username={item.username}
            lastMessage={item.lastMessage}
            time={item.time}
            onPress={() =>
              navigation.navigate("MessageScreen", { username: item.username })
            }
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backIcon: {
    marginTop: 20,
    marginLeft: 20,
  },
});

export default ChatScreen;
