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

    //API getAllConversationById2
    // searchConversationsByUserId: async (userId, searchKeyword = "") => {
    //     return ApiManager.get(
    //         'chatService',
    //         `/conversations/getAllConversationById2/${userId}`,
    //         { search: searchKeyword }//query params
    //     )
    // }
    searchConversationsByUserId: async (userId, searchKeyword = "") => {
  // Gắn thủ công query param vào URL
  const query = searchKeyword ? `?search=${encodeURIComponent(searchKeyword)}` : "";
  return ApiManager.get(
    'chatService',
    `/conversations/getAllConversationById2/${userId}${query}`
  );
},

   
};