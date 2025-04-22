import { ApiManager } from "./ApiManager";

export const Api_FriendRequest = {
    sendFriendRequest: async (data) => {
        return ApiManager.post('userService', '/api/v1/friendRequest/sendFriendRequest', data);
    },
    respondToFriendRequest: async (data) => {
        return ApiManager.post('userService', '/api/v1/friendRequest/respondToFriendRequest', data);
    },
    getSentRequests: async (userId) => {
        return ApiManager.get('userService', `/api/v1/friendRequest/getSentRequests/${userId}`);
    },

    getReceivedRequests: async (userId) => {
        return ApiManager.get('userService', `/api/v1/friendRequest/getReceivedRequests/${userId}`);
    },

    getFriends: async (userId) => {
        return ApiManager.get('userService', `/api/v1/friendRequest/getFriends/${userId}`);
    },

    cancelFriendRequest: async (data) => {
        return ApiManager.post('userService', '/api/v1/friendRequest/cancelFriendRequest', data);
    },

    unfriend: async (userId1, userId2) => {
        return ApiManager.post('userService', `/api/v1/friendRequest/unfriend`, {
          userId1,
          userId2
        });
      },
    getFriendRequestsForUser: async (userId) => {
        return ApiManager.get('userService', `/api/v1/friendRequest/getFriendRequestsForUser/${userId}`);
    },
    checkFriendStatus: async (data) => {
        return ApiManager.post('userService', '/api/v1/friendRequest/checkFriendStatus', data);
    },
    getFriendsList: async (userId) => {
        return ApiManager.get('userService', `/api/v1/friendRequest/getFriendsLists/${userId}`);
    }
};