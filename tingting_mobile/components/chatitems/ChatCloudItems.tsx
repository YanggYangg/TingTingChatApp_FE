import { useNavigation } from "@react-navigation/native";
import ChatItems from "./ChatItems";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Define the type for the navigation stack params
type RootStackParamList = {
  Main: undefined;
  MessageScreen: { userId?: string; username?: string };
  ChatScreenCloud: undefined;
  // Add other routes as needed
};

// Create a typed navigation prop
type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ChatCloudItems = () => {
  // Use the typed navigation
  const navigation = useNavigation<ChatNavigationProp>();

  return (
    <ChatItems
      avatar="https://help.zalo.me/wp-content/uploads/2023/08/z4650065944256_2971e71cc06a5cfcb0aef41782e5f30e.jpg"
      username="Cloud của tôi"
      lastMessage="Chào bạn! Bạn cần hỗ trợ gì?"
      time="10:30 AM"
      onPress={() => navigation.navigate("ChatScreenCloud")}
    />
  );
};

export default ChatCloudItems;
