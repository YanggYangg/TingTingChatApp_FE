    import { ApiManager } from './ApiManager';

    export const Api_chatInfo = {
        // Quản lý hội thoại
        getAllConversations: () => ApiManager.get(`/chats`), 
        getChatInfo: (chatId) => ApiManager.get(`/conversations/${chatId}`),
        updateChatName: (chatId, name) => ApiManager.put(`/conversations/${chatId}`, { name }),

        // Quản lý thành viên trong hội thoại
        getParticipants: (chatId) => ApiManager.get(`/conversations/${chatId}/participants`),
        addParticipant: (chatId, participantData) => ApiManager.post(`/conversations/${chatId}/participants`, participantData),
        removeParticipant: (chatId, participantData) => ApiManager.delete(`/conversations/${chatId}/participants`, participantData), // Gửi participantData trực tiếp
   
        // Media, File, Links, Pin, Reminder
        getChatMedia: (chatId) => ApiManager.get(`/messages/${chatId}/media`),
        getChatFiles: (chatId) => ApiManager.get(`/messages/${chatId}/files`),
        getChatLinks: (chatId) => ApiManager.get(`/messages/${chatId}/links`),
        getPinnedMessages: (chatId) => ApiManager.get(`/messages/${chatId}/pinned-messages`),
        // getReminders: (chatId) => ApiManager.get(`/messages/${chatId}/reminders`),

        // Ghim/Bỏ ghim trò chuyện
        pinChat: (chatId, isPinned) => ApiManager.put(`/conversations/${chatId}/pin`, { isPinned }),
        // Thông báo
        updateNotification: (chatId, muteData) => ApiManager.put(`/conversations/${chatId}/mute`, muteData),

        // Ẩn trò chuyện
        hideChat: (chatId, isHidden) => ApiManager.put(`/conversations/${chatId}/hide`, { isHidden }),

        // Xóa lịch sử cuộc trò chuyện (chỉ mình tôi)
        deleteHistory: (chatId, participantData) => ApiManager.delete(`/conversations/${chatId}`, participantData ),
        
        
    };
