import React from "react";
import { View, StyleSheet } from "react-native";
import ChatItems from "./ChatItems";
import { useNavigation } from "@react-navigation/native";

const ChatSupportItems = () => {
    const navigation = useNavigation<any>();

    return (
        <ChatItems
            avatar={require("../../assets/images/chatGPT.jpg")}
            username="ChatGPT"
            lastMessage="Chào bạn! Bạn cần hỗ trợ gì?"
            time=""
            onPress={() => navigation.navigate("MessageSupportScreen", {
                username : "ChatGPT",
            })}
        />
    )
};

export default ChatSupportItems;