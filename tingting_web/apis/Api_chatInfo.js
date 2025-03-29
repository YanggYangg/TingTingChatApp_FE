import { ApiManager } from './ApiManager';

export const Api_chatInfo = {
    // Quản lý hội thoại
    getAllConversations: () => ApiManager.get(`/chats`),
    getChatInfo: (chatId) => ApiManager.get(`/conversations/${chatId}`),

    updateChatInfo: (chatId, data) => ApiManager.put(`/chats/${chatId}`, data),

    // Quản lý thành viên trong hội thoại
    getParticipants: (chatId) => ApiManager.get(`/conversations/${chatId}/participants`),
    addParticipant: (chatId, participantData) => ApiManager.post(`/conversations/${chatId}/participants`, participantData),
    removeParticipant: (chatId, participantData) => ApiManager.delete(`/chats/${chatId}/participants`, { data: participantData }),
    changeParticipantRole: (chatId, roleData) => ApiManager.put(`/chats/${chatId}/participants/role`, roleData),

    // Tin nhắn
    getMessages: (chatId) => ApiManager.get(`/chats/${chatId}/messages`),
    sendMessage: (chatId, message) => ApiManager.post(`/chats/${chatId}/messages`, message),
    deleteMessage: (chatId, messageId) => ApiManager.delete(`/chats/${chatId}/messages/${messageId}`),

    // Media, File, Links, Pin, Reminder
    getChatMedia: (chatId) => ApiManager.get(`/messages/${chatId}/media`),
    getChatFiles: (chatId) => ApiManager.get(`/messages/${chatId}/files`),
    getChatLinks: (chatId) => ApiManager.get(`/messages/${chatId}/links`),
    getPinnedMessages: (chatId) => ApiManager.get(`/messages/${chatId}/pinned-messages`),
    getReminders: (chatId) => ApiManager.get(`/messages/${chatId}/reminders`),

    // Ghim/Bỏ ghim tin nhắn
    pinMessage: (messageId) => ApiManager.post(`/chats/pin/${messageId}`),
    unpinMessage: (messageId) => ApiManager.post(`/chats/unpin/${messageId}`),
};
