
import React, { createContext, useContext, useEffect, useState } from 'react';
import socket, { connectSocket, disconnectSocket } from '../services/socketService';

const SocketContext = createContext();

export const SocketProvider = ({ children, userId }) => {
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userId) {
            connectSocket(userId);

            socket.on('loadMessages', (msgs) => setMessages(msgs));
            socket.on('receiveMessage', (newMessage) => {
                setMessages((prev) => [...prev, newMessage]);
            });
            socket.on('getOnlineUsers', (users) => setOnlineUsers(users));
            socket.on('userTyping', ({ userId, conversationId }) => {
                setTypingUsers((prev) => [...prev, { userId, conversationId }]);
            });
            socket.on('userStopTyping', ({ userId, conversationId }) => {
                setTypingUsers((prev) =>
                    prev.filter((u) => u.userId !== userId || u.conversationId !== conversationId)
                );
            });
            socket.on('messageRead', ({ messageId, userId, readBy }) => {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id === messageId ? { ...msg, status: { ...msg.status, readBy } } : msg
                    )
                );
            });
            socket.on('error', ({ message }) => {
                setError(message);
                setTimeout(() => setError(null), 3000); // Xóa lỗi sau 3s
            });

            return () => disconnectSocket();
        }
    }, [userId]);

    return (
        <SocketContext.Provider value={{ messages, onlineUsers, typingUsers, error, socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocketContext = () => useContext(SocketContext);