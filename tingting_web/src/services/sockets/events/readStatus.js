export const readMessage = (socket, data) => {
    socket.emit('readMessage', data);
};

export const onReadMessage = (socket, callback) => {
    socket.on('readMessage', callback);
};

export const offReadMessage = (socket) => {
    socket.off('readMessage');
};
