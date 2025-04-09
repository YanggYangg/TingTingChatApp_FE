import { ApiManager } from "./ApiManager";

export const Api_Conversation = {
    getAllConversations: async () => {
        return ApiManager.get('conversation', '/conversations');
    },
};