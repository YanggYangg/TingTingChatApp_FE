export const sendMessage = (socket, data) => {
    socket.emit('sendMessage', data);
};

// Nếu BE emit 'message' sau khi xử lý
export const onMessage = (socket, callback) => {
    socket.on('message', callback);
};

export const offMessage = (socket) => {
    socket.off('message');
};

// Load messages for a conversation
export const loadMessages = (socket, conversationId) => {
    socket.emit('loadMessages', { conversationId });
};

// Listen for loaded messages
export const onLoadMessages = (socket, callback) => {
    socket.on('loadMessages', callback);
};

export const offLoadMessages = (socket) => {
    socket.off('loadMessages');
};



// Delete message
export const deleteMessage = (socket, messageId) => {
    socket.emit('deleteMessage', { messageId });
};
// Listen for deleted message   
export const onMessageDeleted = (socket, callback) => {
    socket.on('messageDeleted', callback);
};
export const offMessageDeleted = (socket) => {
    socket.off('messageDeleted');
};
