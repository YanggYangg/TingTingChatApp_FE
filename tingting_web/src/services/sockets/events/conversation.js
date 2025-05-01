export const joinConversation = (socket, conversationId) => {
    socket.emit('joinConversation', { conversationId });
};

export const leaveConversation = (socket, conversationId) => {
    socket.emit('leaveConversation', { conversationId });
};

// Combined function to load and listen for conversations
export const loadAndListenConversations = (socket, callback) => {
    // Set up listener first
    socket.on('loadConversations', callback);
    // Then emit to load conversations
    socket.emit('loadConversations');
    // Return cleanup function
    return () => {
        socket.off('loadConversations');
    };
};

// Nếu BE emit lại conversations sau khi load
export const onConversations = (socket, callback) => {
    socket.on('conversations', callback);
};

export const offConversations = (socket) => {
    socket.off('conversations');
};

// Listen for conversation updates
export const onConversationUpdate = (socket, callback) => {
    socket.on('conversationUpdated', callback);
};

export const offConversationUpdate = (socket) => {
    socket.off('conversationUpdated');
};

export const onConversationRemoved = (socket, callback) => {
    socket.on('conversationRemoved', callback);
}

export const offConversationRemoved = (socket) => {
    socket.off('conversationRemoved');
}

