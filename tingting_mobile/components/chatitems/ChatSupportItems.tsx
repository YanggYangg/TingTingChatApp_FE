import React from "react";
import { View, StyleSheet } from "react-native";
import ChatItems from "./ChatItems";

const ChatSupportItems = () => {
    return (
        <ChatItems
            avatar="https://picsum.photos/200/?1"
            username="Chat Support TingTingApp"
            lastMessage="Chào bạn! Bạn cần hỗ trợ gì?"
            time="10:30 AM"
            onPress={() => console.log("Chat Support")}
        />
    )
};
export default ChatSupportItems;