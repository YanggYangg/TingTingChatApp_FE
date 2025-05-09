// Function to request online users
export const getOnlineUsers = (socket) => {
    console.log("Requesting online users from server");
    socket.emit('getOnlineUsers');
};

// Function to listen for online users updates
export const onOnlineUsers = (socket, callback) => {
    socket.on('getOnlineUsers', (users) => {
        console.log("Received online users from server:", users);
        // Validate that users is an array
        if (!Array.isArray(users)) {
            console.error("Received invalid online users data:", users);
            return;
        }
        // Filter out any invalid user IDs
        const validUsers = users.filter(userId => typeof userId === 'string' && userId.trim() !== '');
        console.log("Valid online users:", validUsers);
        callback(validUsers);
    });
    return () => {
        socket.off('getOnlineUsers');
    };
}; 