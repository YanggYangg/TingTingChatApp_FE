import { useNavigation } from "@react-navigation/native"
import ChatItems from "./ChatItems"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

// Define the type for the navigation stack params
type RootStackParamList = {
  Main: undefined
  MessageScreen: { userId?: string; username?: string }
  ChatScreenCloud: undefined
  // Add other routes as needed
}

// Create a typed navigation prop
type ChatNavigationProp = NativeStackNavigationProp<RootStackParamList>

const ChatCloudItems = () => {
  // Use the typed navigation
  const navigation = useNavigation<ChatNavigationProp>()

  return (
    <ChatItems
      avatar="https://picsum.photos/200/?2"
      username="Cloud của tôi"
      lastMessage="Chào bạn! Bạn cần hỗ trợ gì?"
      time="10:30 AM"
      onPress={() => navigation.navigate("ChatScreenCloud")}
    />
  )
}

export default ChatCloudItems
