import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [activeTab, setActiveTab] = useState('chat');// 'chat' or 'contact'

    return (
        <ChatContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </ChatContext.Provider>
    );
};

//Hool để dùng context trong các component khác
export const useChat = () => {
    return useContext(ChatContext);
}