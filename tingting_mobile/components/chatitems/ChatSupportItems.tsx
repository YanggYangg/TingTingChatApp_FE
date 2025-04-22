import React from "react";
import { View, StyleSheet } from "react-native";
import ChatItems from "./ChatItems";
import { useNavigation } from "@react-navigation/native";

const ChatSupportItems = () => {
    const navigation = useNavigation<any>();

    return (
        <ChatItems
            avatar="https://picsum.photos/200/?1"
            username="Hỗ trợ tiện ích ChatGPT"
            lastMessage="Chào bạn! Bạn cần hỗ trợ gì?"
            time="10:30 AM"
            onPress={() => navigation.navigate("MessageSupportScreen", {
                username : "Hỗ trợ tiện ích ChatGPT",
            })}
        />
    )
};
export default ChatSupportItems;