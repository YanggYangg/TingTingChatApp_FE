import { io } from 'socket.io-client';

export const initSocket = (userId) => {
    return io('http://184.73.0.29:5000', {
        query: { userId },
        transports: ['websocket'], // quan trọng để tránh fallback polling
    });
};
