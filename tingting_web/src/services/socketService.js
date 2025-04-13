// src/services/socketService.js
import { io } from 'socket.io-client';

const socket = io(process.env.SOCKET_URL, {
    autoConnect: false,
});

socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
});

socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error.message);
});

socket.on('disconnect', () => {
    console.log('Disconnected from Socket.IO server');
});

export const connectSocket = (userId) => {
    if (!userId) {
        console.error('User ID is required to connect to Socket.IO');
        return false;
    }
    socket.io.opts.query = { userId };
    socket.connect();
    return true;
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export const joinConversation = (conversationId) => {
    if (!socket.connected) {
        console.warn('Socket is not connected. Cannot join conversation.');
        return;
    }
    socket.emit('joinConversation', { conversationId });
};

export const leaveConversation = (conversationId) => {
    if (!socket.connected) {
        console.warn('Socket is not connected. Cannot leave conversation.');
        return;
    }
    socket.emit('leaveConversation', { conversationId });
};

export const sendMessage = (conversationId, message) => {
    if (!socket.connected) {
        console.warn('Socket is not connected. Cannot send message.');
        return;
    }
    socket.emit('sendMessage', { conversationId, message });
};

export const on = (event, callback) => {
    socket.on(event, callback);
};

export const off = (event, callback) => {
    socket.off(event, callback);
};

export default socket;