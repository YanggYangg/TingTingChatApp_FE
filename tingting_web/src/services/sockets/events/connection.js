export const onConnect = (socket, callback) => {
    socket.on('connect', () => {
        callback?.(socket.id);
    });
};

export const onDisconnect = (socket, callback) => {
    socket.on('disconnect', () => {
        callback?.();
    });
};
