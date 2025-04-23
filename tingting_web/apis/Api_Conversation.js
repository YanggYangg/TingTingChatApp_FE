import { ApiManager } from "./ApiManager";

export const Api_Conversation = {
    getAllConversations: async () => {
        return ApiManager.get('chatService', '/conversations');
    },
    getAllGroups: async () => {
        return ApiManager.get('chatService', '/groups');
    },
    getUserJoinGroup: async (userId) => {
        return ApiManager.get('chatService', `/userGroups/${userId}`);
    },
};