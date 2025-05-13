import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedMessage: null, // Lưu trữ thông tin cuộc trò chuyện được chọn
  selectedConversation: null, // Lưu trữ thông tin hội thoại được chọn
  lastMessageUpdate: null, // Lưu trữ tin nhắn cuối cùng của cuộc trò chuyện
  chatInfoUpdate: null, // Lưu trữ thông tin cập nhật của cuộc trò chuyện
  pinnedOrder: [], // Thêm: Lưu trữ danh sách conversationId được ghim
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Đặt hoặc xóa cuộc trò chuyện được chọn
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },
    clearSelectedMessage: (state) => {
      state.selectedMessage = null;
    },
    selectConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },
    // Cập nhật tin nhắn cuối cùng
    setLastMessageUpdate: (state, action) => {
      state.lastMessageUpdate = action.payload; // payload có thể là { conversationId, lastMessage } hoặc null
    },
    // Cập nhật thông tin cuộc trò chuyện
    setChatInfoUpdate: (state, action) => {
      state.chatInfoUpdate = action.payload; // payload chứa thông tin cuộc trò chuyện
    },
    // Thêm: Action để cập nhật pinnedOrder
    setPinnedOrder: (state, action) => {
      state.pinnedOrder = action.payload; // Cập nhật danh sách conversationId được ghim
    },
    // Thêm: Action để ghim một cuộc trò chuyện
    pinConversation: (state, action) => {
      const conversationId = action.payload;
      // Thêm conversationId vào đầu pinnedOrder, đảm bảo không trùng lặp
      state.pinnedOrder = [conversationId, ...state.pinnedOrder.filter(id => id !== conversationId)];
    },
    // Thêm: Action để bỏ ghim một cuộc trò chuyện
    unpinConversation: (state, action) => {
      const conversationId = action.payload;
      // Xóa conversationId khỏi pinnedOrder
      state.pinnedOrder = state.pinnedOrder.filter(id => id !== conversationId);
    },
  },
});

export const {
  setSelectedMessage,
  clearSelectedMessage,
  selectConversation,
  setLastMessageUpdate,
  setChatInfoUpdate,
  setPinnedOrder,
  pinConversation,
  unpinConversation,
} = chatSlice.actions;
export default chatSlice.reducer;