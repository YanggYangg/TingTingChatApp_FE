    import { ApiManager } from './ApiManager';

    export const Api_chatInfo = {
        // Quản lý hội thoại
        getAllConversations: () => ApiManager.get(`/chats`), 
        getChatInfo: (conversationId) => ApiManager.get(`/conversations/${conversationId}`),
        updateChatName: (conversationId, name) => ApiManager.put(`/conversations/${conversationId}`, { name }),

        // Quản lý thành viên trong hội thoại
        getParticipants: (conversationId) => ApiManager.get(`/conversations/${conversationId}/participants`),
        addParticipant: (conversationId, participantData) => ApiManager.post(`/conversations/${conversationId}/participants`, participantData),
        removeParticipant: (conversationId, participantData) => ApiManager.delete(`/conversations/${conversationId}/participants`, participantData), // Gửi participantData trực tiếp
   
        // Media, File, Links, Pin, Reminder
        getChatMedia: (conversationId) => ApiManager.get(`/messages/${conversationId}/media`),
        getChatFiles: (conversationId) => ApiManager.get(`/messages/${conversationId}/files`),
        getChatLinks: (conversationId) => ApiManager.get(`/messages/${conversationId}/links`),
        getPinnedMessages: (conversationId) => ApiManager.get(`/messages/${conversationId}/pinned-messages`),
        // getReminders: (conversationId) => ApiManager.get(`/messages/${conversationId}/reminders`),

        // Ghim/Bỏ ghim trò chuyện
        pinChat: (conversationId, pinData) => ApiManager.put(`/conversations/${conversationId}/pin`, pinData),
        // Thông báo
        updateNotification: (conversationId, muteData) => ApiManager.put(`/conversations/${conversationId}/mute`, muteData),

        // Ẩn trò chuyện
        hideChat: (conversationId, hideData) => ApiManager.put(`/conversations/${conversationId}/hide`, hideData),

        // Xóa lịch sử cuộc trò chuyện (chỉ mình tôi)
        deleteHistory: (conversationId, participantData) => ApiManager.delete(`/conversations/${conversationId}`, participantData ),

        // Danh sách nhóm chung
        getCommonGroups: (conversationId) => ApiManager.get(`/conversations/${conversationId}/common`),
        
        
    };
