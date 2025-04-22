import { ApiManager } from "./ApiManager";

export const Api_chatInfo = {
  // Quản lý hội thoại (chatService)
  getAllConversations: () => ApiManager.get("chatService", `/conversations`),
  getConversationById: (userId) =>
    ApiManager.get(
      "chatService",
      `/conversations/getAllConversationById/${userId}`
    ),
  getChatInfo: (conversationId) =>
    ApiManager.get("chatService", `/conversations/${conversationId}`),
  updateChatName: (conversationId, name) =>
    ApiManager.put("chatService", `/conversations/${conversationId}`, { name }),

  // Quản lý thành viên trong hội thoại (chatService)
  getParticipants: (conversationId) =>
    ApiManager.get(
      "chatService",
      `/conversations/${conversationId}/participants`
    ),
  addParticipant: (conversationId, participantData) =>
    ApiManager.post(
      "chatService",
      `/conversations/${conversationId}/participants`,
      participantData
    ),
  getAvailableMembers: (conversationId) =>
    ApiManager.get("chatService", `/conversations/${conversationId}/available`),
  removeParticipant: (conversationId, participantData) =>
    ApiManager.delete(
      "chatService",
      `/conversations/${conversationId}/participants`,
      participantData
    ), // Gửi participantData trực tiếp

  // Media, File, Links, Pin, Reminder (chatService)
  getChatMedia: (conversationId) =>
    ApiManager.get("chatService", `/messages/${conversationId}/media`),
  getChatFiles: (conversationId) =>
    ApiManager.get("chatService", `/messages/${conversationId}/files`),
  getChatLinks: (conversationId) =>
    ApiManager.get("chatService", `/messages/${conversationId}/links`),
  getPinnedMessages: (conversationId) =>
    ApiManager.get(
      "chatService",
      `/messages/${conversationId}/pinned-messages`
    ),
  // getReminders: (conversationId) => ApiManager.get('chatService', `/messages/${conversationId}/reminders`),

  // Ghim/Bỏ ghim trò chuyện (chatService)
  pinChat: (conversationId, pinData) =>
    ApiManager.put(
      "chatService",
      `/conversations/${conversationId}/pin`,
      pinData
    ),
  // Thông báo (chatService)
  updateNotification: (conversationId, muteData) =>
    ApiManager.put(
      "chatService",
      `/conversations/${conversationId}/mute`,
      muteData
    ),

  // Ẩn trò chuyện (chatService)
  hideChat: (conversationId, hideData) =>
    ApiManager.put(
      "chatService",
      `/conversations/${conversationId}/hide`,
      hideData
    ),

  // Xóa lịch sử cuộc trò chuyện (chỉ mình tôi) (chatService)
  deleteHistory: (conversationId, participantData) =>
    ApiManager.delete(
      "chatService",
      `/conversations/${conversationId}`,
      participantData
    ),

  // Danh sách nhóm chung (chatService)
  getCommonGroups: (conversationId) =>
    ApiManager.get("chatService", `/conversations/${conversationId}/common`),

  // Tạo nhóm (chatService)
  createConversation: (groupData) =>
    ApiManager.post(
      "chatService",
      `/conversations/createConversation2`,
      groupData
    ),

  // Xóa tin nhắn
  deleteMessage: (messageIds) =>
    ApiManager.delete("chatService", `/messages/delete`, messageIds), // Gửi messageIds trực tiếp

  //thu
  revokeMessage: (messageIds) =>
    ApiManager.delete("chatService", `/messages/revoke`, messageIds), // Gửi messageIds trực tiếp
  // Chuyển tiếp tin nhắn
  forwardMessage: (data) => {
    const { messageId, targetConversationIds, userId, content } = data;

    // if (!userId) {
    //     throw new Error("userId is required for forwarding messages");
    // }
    // if (!messageId || !messageId.length) {
    //     throw new Error("messageId are required");
    // }
    // if (!targetConversationIds || !targetConversationIds.length) {
    //     throw new Error("targetConversationIDs are required");
    // }

    return ApiManager.post("chatService", `/chats/forwardMessage`, {
      messageId,
      targetConversationIds,
      userId,
      content,
    });
  },

  deleteConversationHistory: (conversationId) =>
    ApiManager.delete("chatService", `/conversations/${conversationId}`),

  disbandGroup: (conversationId, userId) => ApiManager.delete("chatService", `/conversations/disbandGroup/${conversationId}` , { userId }),
  transferGroupAdmin: (conversationId, participantData) => ApiManager.put("chatService",`/conversations/${conversationId}/transfer-admin/test`, participantData), // Gửi participantData trực tiếp
};