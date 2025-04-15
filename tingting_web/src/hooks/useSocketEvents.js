import { useEffect } from 'react';

export const useSocketEvents = (socket, setupHandlers) => {
    useEffect(() => {
        if (!socket) return;

        console.log('Socket connected:', socket.id); // Thêm logging để kiểm tra kết nối

        const cleanup = setupHandlers(socket);

        return () => {
            cleanup?.();
        };
    }, [socket, setupHandlers]);
};

// Trong component nơi bạn sử dụng socket
socket.on('error', (error) => {
    console.error('Socket error:', error);
});