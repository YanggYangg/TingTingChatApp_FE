/**
 * Transform message data from backend format to MessageItem format
 * @param {Array} messages - Array of messages from backend
 * @param {string} currentUserId - Current user's ID
 * @param {Object} userMap - Map of userId to user information (name, avatar)
 * @returns {Array} Transformed messages in MessageItem format
 */
export const transformMessagesToChatFormat = (messages, currentUserId, userMap = {}) => {
    // Return empty array if messages is undefined or null
    if (!messages || !Array.isArray(messages)) {
        console.warn('No messages provided or invalid messages array');
        return [];
    }

    return messages.map(message => {
        // Determine if the message is from the current user
        const isCurrentUser = message.userId === currentUserId;

        // Get user information from userMap or use defaults
        const userInfo = userMap[message.userId] || {};
        const userName = userInfo.name || 'Người dùng';
        const userAvatar = userInfo.avatar;

        // Format the time
        const messageDate = new Date(message.createdAt);
        const formattedTime = messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Base message object with common fields
        const baseMessage = {
            id: message._id,
            conversationId: message.conversationId,
            sender: isCurrentUser ? 'Bạn' : userName,
            senderId: message.userId,
            senderAvatar: userAvatar,
            time: formattedTime,
            createdAt: message.createdAt,
            status: message.status,
            isCurrentUser,
            replyMessageId: message.replyMessageId
        };

        // Transform based on message type
        switch (message.messageType) {
            case 'text':
                return {
                    ...baseMessage,
                    type: 'chat',
                    text: message.content
                };
            case 'image':
                return {
                    ...baseMessage,
                    type: 'image',
                    imageUrl: message.content,
                    linkURL: message.linkURL
                };
            case 'file':
                return {
                    ...baseMessage,
                    type: 'file',
                    fileName: message.fileName || 'Tệp tin',
                    fileUrl: message.content,
                    fileSize: message.fileSize
                };
            case 'call':
                return {
                    ...baseMessage,
                    type: 'call',
                    callDuration: message.callDuration || '0 phút',
                    missed: message.missed || false,
                    callType: message.callType || 'voice' // voice or video
                };
            default:
                return {
                    ...baseMessage,
                    type: 'chat',
                    text: message.content
                };
        }
    });
};