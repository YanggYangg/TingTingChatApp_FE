import { ApiManager } from "./ApiManager";

export const Api_chatInfo = {
  // Quản lý hội thoại
  getAllConversations: () => ApiManager.get(`/chats`),
  getChatInfo: (conversationId) =>
    ApiManager.get(`/conversations/${conversationId}`),
  updateChatName: (conversationId, name) =>
    ApiManager.put(`/conversations/${conversationId}`, { name }),

  // Quản lý thành viên trong hội thoại
  getParticipants: (conversationId) =>
    ApiManager.get(`/conversations/${conversationId}/participants`),
  addParticipant: (conversationId, participantData) =>
    ApiManager.post(
      `/conversations/${conversationId}/participants`,
      participantData
    ),
  getAvailableMembers: (conversationId) =>
    ApiManager.get(`/conversations/${conversationId}/available`),
  removeParticipant: (conversationId, participantData) =>
    ApiManager.delete(
      `/conversations/${conversationId}/participants`,
      participantData
    ), // Gửi participantData trực tiếp

  // Media, File, Links, Pin, Reminder
  getChatMedia: (conversationId) =>
    ApiManager.get(`/messages/${conversationId}/media`),
  getChatFiles: (conversationId) =>
    ApiManager.get(`/messages/${conversationId}/files`),
  getChatLinks: (conversationId) =>
    ApiManager.get(`/messages/${conversationId}/links`),
  getChatStogaes: (conversationId) =>
    ApiManager.get(`/messages/${conversationId}/storage`),
  getPinnedMessages: (conversationId) =>
    ApiManager.get(`/messages/${conversationId}/pinned-messages`),
  // getReminders: (conversationId) => ApiManager.get(`/messages/${conversationId}/reminders`),

  // Ghim/Bỏ ghim trò chuyện
  pinChat: (conversationId, pinData) =>
    ApiManager.put(`/conversations/${conversationId}/pin`, pinData),
  // Thông báo
  updateNotification: (conversationId, muteData) =>
    ApiManager.put(`/conversations/${conversationId}/mute`, muteData),

  // Ẩn trò chuyện
  hideChat: (conversationId, hideData) =>
    ApiManager.put(`/conversations/${conversationId}/hide`, hideData),

  // Xóa lịch sử cuộc trò chuyện (chỉ mình tôi)
  deleteHistory: (conversationId, participantData) =>
    ApiManager.delete(`/conversations/${conversationId}`, participantData),

  deleteMessages: (messageData) =>
    ApiManager.delete(`/messages//delete-selected`, messageData), // Gửi messageData trực tiếp

  // Danh sách nhóm chung
  getCommonGroups: (conversationId) =>
    ApiManager.get(`/conversations/${conversationId}/common`),

  // Xóa tin nhắn
  deleteMessage: (messageIds) =>
    ApiManager.delete(`/messages/delete`, messageIds), // Gửi messageIds trực tiếp
  createConversation: (groupData) =>
    ApiManager.post(`/conversations/createConversation2`, groupData),
  // router.put('/:conversationId/transfer-admin/test', chatInfoController.transferGroupAdmin);
  transferGroupAdmin: (conversationId, participantData) =>
    ApiManager.put(
      `/conversations/${conversationId}/transfer-admin/test`,
      participantData
    ), // Gửi participantData trực tiếp

  disbandGroup: (conversationId, userId) =>
    ApiManager.delete(`/conversations/disbandGroup/${conversationId}`, {
      userId,
    }),

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

    return ApiManager.post(`/chats/forwardMessage`, {
      messageId,
      targetConversationIds,
      userId,
      content,
    });

  },



  getUserGroups: (userId) =>
    ApiManager.get(`/conversations/getUserGroups/${userId}`),

  getConversationById: (userId) =>
    ApiManager.get(`/conversations/getAllConversationById/${userId}`),

  // uploadGroupImage
 uploadGroupImage: async (formData, conversationId, userId) => {
    if (!userId) {
      throw new Error('Không tìm thấy ID người dùng');
    }
    if (!conversationId) {
      throw new Error('Không tìm thấy ID cuộc trò chuyện');
    }
    const url = `/conversations/uploadGroupImage/${conversationId}/${userId}`;
    console.log('Sending request to:', url, 'with formData');
    try {
      const response = await ApiManager.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error) {
      console.error('API error:', error.response?.data || error.message);
      throw error;
    }
  },

//  const { conversationId, searchTerm, page = 1, limit = 20 } = req.query;
//     const userId = req.userId;

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
    const response = await ApiManager.get(url);
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
      error.response?.error || error.message || ""
    );
  }
},
};
