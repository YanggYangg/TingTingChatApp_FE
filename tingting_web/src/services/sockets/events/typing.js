export const typing = (socket, conversationId) => {
    socket.emit('typing', { conversationId });
};

export const stopTyping = (socket, conversationId) => {
    socket.emit('stopTyping', { conversationId });
};

export const onTyping = (socket, callback) => {
    socket.on('typing', callback);
};

export const onStopTyping = (socket, callback) => {
    socket.on('stopTyping', callback);
};

export const offTyping = (socket) => {
    socket.off('typing');
    socket.off('stopTyping');
};
