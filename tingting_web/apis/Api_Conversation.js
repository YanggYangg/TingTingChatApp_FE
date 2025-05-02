import { ApiManager } from "./ApiManager";

export const Api_Conversation = {
    getAllConversations: async () => {
        return ApiManager.get('chatService', '/conversations');
    },
    getAllGroups: async () => {
        return ApiManager.get('chatService', '/groups');
    },
    getUserJoinGroup: async (userId) => {
        return ApiManager.get('chatService', `/conversations/userGroups/${userId}`);
    },
    getOrCreateConversation: async (user1Id, user2Id)  => {
        return ApiManager.post('chatService', '/conversations/getOrCreateConversation', {
            user1Id,
            user2Id,
        });
    },
};