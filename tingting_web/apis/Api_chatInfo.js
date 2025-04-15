import { ApiManager } from './ApiManager';

export const Api_chatInfo = {
    // Quản lý hội thoại (chatService)
    getAllConversations: () => ApiManager.get('chatService', `/chats`),
    getChatInfo: (conversationId) => ApiManager.get('chatService', `/conversations/${conversationId}`),
    updateChatName: (conversationId, name) => ApiManager.put('chatService', `/conversations/${conversationId}`, { name }),

    // Quản lý thành viên trong hội thoại (chatService)
    getParticipants: (conversationId) => ApiManager.get('chatService', `/conversations/${conversationId}/participants`),
    addParticipant: (conversationId, participantData) => ApiManager.post('chatService', `/conversations/${conversationId}/participants`, participantData),
    getAvailableMembers: (conversationId) => ApiManager.get('chatService', `/conversations/${conversationId}/available`),
    removeParticipant: (conversationId, participantData) => ApiManager.delete('chatService', `/conversations/${conversationId}/participants`, participantData), // Gửi participantData trực tiếp

    // Media, File, Links, Pin, Reminder (chatService)
    getChatMedia: (conversationId) => ApiManager.get('chatService', `/messages/${conversationId}/media`),
    getChatFiles: (conversationId) => ApiManager.get('chatService', `/messages/${conversationId}/files`),
    getChatLinks: (conversationId) => ApiManager.get('chatService', `/messages/${conversationId}/links`),
    getPinnedMessages: (conversationId) => ApiManager.get('chatService', `/messages/${conversationId}/pinned-messages`),
    // getReminders: (conversationId) => ApiManager.get('chatService', `/messages/${conversationId}/reminders`),

    // Ghim/Bỏ ghim trò chuyện (chatService)
    pinChat: (conversationId, pinData) => ApiManager.put('chatService', `/conversations/${conversationId}/pin`, pinData),
    // Thông báo (chatService)
    updateNotification: (conversationId, muteData) => ApiManager.put('chatService', `/conversations/${conversationId}/mute`, muteData),

    // Ẩn trò chuyện (chatService)
    hideChat: (conversationId, hideData) => ApiManager.put('chatService', `/conversations/${conversationId}/hide`, hideData),

    // Xóa lịch sử cuộc trò chuyện (chỉ mình tôi) (chatService)
    deleteHistory: (conversationId, participantData) => ApiManager.delete('chatService', `/conversations/${conversationId}`, participantData),

    // Danh sách nhóm chung (chatService)
    getCommonGroups: (conversationId) => ApiManager.get('chatService', `/conversations/${conversationId}/common`),

    // Tạo nhóm (chatService)
    createConversation: (groupData) => ApiManager.post('chatService', `/conversations/createConversation2`, groupData),

    // Xóa tin nhắn
    deleteMessage: (messageIds) => ApiManager.delete('chatService', `/messages/delete`, messageIds), // Gửi messageIds trực tiếp
    
};