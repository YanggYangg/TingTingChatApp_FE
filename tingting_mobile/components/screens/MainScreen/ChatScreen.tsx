import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ChatScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <View>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons
          name="arrow-back-outline"
          size={28}
          color="#fff"
          style={styles.backIcon}
        />
      </TouchableOpacity>
      <Text>Màn hình tin nhắn</Text>
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
