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

/**
 * Tìm kiếm tin nhắn trong cuộc trò chuyện
 * @param {Object} params - Các tham số tìm kiếm
 * @param {string} params.conversationId - ID của cuộc trò chuyện
 * @param {string} params.searchTerm - Từ khóa tìm kiếm
 * @param {number} [params.page=1] - Số trang (mặc định là 1)
 * @param {number} [params.limit=20] - Số lượng tin nhắn mỗi trang (mặc định là 20)
 * @param {string} params.userId - ID của người dùng hiện tại
 * @param {string} [params.senderId] - ID của người gửi (tùy chọn, để lọc theo người gửi) [BỔ SUNG]
 * @param {string} [params.startDate] - Ngày bắt đầu (YYYY-MM-DD, tùy chọn) [BỔ SUNG]
 * @param {string} [params.endDate] - Ngày kết thúc (YYYY-MM-DD, tùy chọn) [BỔ SUNG]
 * @returns {Promise<Object>} - Kết quả tìm kiếm (messages, total, page, limit)
 * @throws {Error} - Nếu có lỗi trong quá trình gọi API
 */
searchMessages: async ({
  conversationId,
  searchTerm,
  page = 1,
  limit = 20,
  userId,
  senderId, // [BỔ SUNG] Lọc theo người gửi
  startDate, // [BỔ SUNG] Lọc theo ngày bắt đầu
  endDate, // [BỔ SUNG] Lọc theo ngày kết thúc
}) => {
  try {
    // Tạo query parameters
    const queryParams = new URLSearchParams({
      searchTerm,
      page,
      limit,
      userId,
      ...(senderId && { senderId }), // [BỔ SUNG] Thêm senderId nếu có
      ...(startDate && { startDate }), // [BỔ SUNG] Thêm startDate nếu có
      ...(endDate && { endDate }), // [BỔ SUNG] Thêm endDate nếu có
    }).toString();

    // Tạo URL cho API
    const url = `/messages/search/${conversationId}?${queryParams}`;
    console.log("Calling ApiManager.get with:", { url });

    // Gọi API
    const response = await ApiManager.get("chatService", url);
    console.log("ApiManager.get response:", response);

    if (!response) {
      throw new Error("No response received from ApiManager.get");
    }

    return response; // Trả về response trực tiếp (không cần response.data)
  } catch (error) {
    console.error("Error in Api_chatInfo.searchMessages:", {
      message: error.message,
      response: error.response,
      stack: error.stack,
    });
    throw new Error(
      error.response?.error || error.message || "Không thể tìm kiếm tin nhắn"
    );
  }
},
};