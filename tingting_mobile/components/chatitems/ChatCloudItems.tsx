import React from "react";
import { View, StyleSheet } from "react-native";
import ChatItems from "./ChatItems";

const ChatCloudItems = () => {
    return (
        <ChatItems
            avatar="https://picsum.photos/200/?2"
            username="Cloud của tôi"
            lastMessage="Chào bạn! Bạn cần hỗ trợ gì?"
            time="10:30 AM"
            onPress={() => console.log("Chat Cloud")}
        />
    )
};
export default ChatCloudItems;