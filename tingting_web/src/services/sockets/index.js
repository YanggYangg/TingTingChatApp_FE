import { io } from 'socket.io-client';

export const initSocket = (userId) => {
    return io('http://100.28.46.80:5000', {
        query: { userId },
        transports: ['websocket'], // quan trọng để tránh fallback polling
    });
};
