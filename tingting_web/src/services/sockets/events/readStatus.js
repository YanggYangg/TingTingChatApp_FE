export const readMessage = (socket, data) => {
    socket.emit('readMessage', data);
};

export const onReadMessage = (socket, callback) => {
    socket.on('readMessage', callback);
};

export const offReadMessage = (socket) => {
    socket.off('readMessage');
};

export const onMessageRead = (socket, callback) => {
    socket.on('messageRead', callback);
};

export const offMessageRead = (socket) => {
    socket.off('messageRead');
<<<<<<< HEAD
};
=======
};
>>>>>>> 96dfdde139e3e2e88fdf8bf43836271670c4f645
