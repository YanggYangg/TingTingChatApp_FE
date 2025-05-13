import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedMessage: null, // Lưu trữ thông tin cuộc trò chuyện được chọn
  selectedConversation: null, // Lưu trữ thông tin hội thoại được chọn
  messages: [], // Thêm: Lưu trữ danh sách tin nhắn của cuộc trò chuyện hiện tại
  lastMessageUpdate: null, // Lưu trữ tin nhắn cuối cùng của cuộc trò chuyện
  chatInfoUpdate: null, // Lưu trữ thông tin cập nhật của cuộc trò chuyện
  pinnedOrder: [], // Lưu trữ danh sách conversationId được ghim
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
      state.messages = []; // Thêm: Xóa danh sách tin nhắn khi xóa cuộc trò chuyện
    },
    selectConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },
    // Cập nhật danh sách tin nhắn
    setMessages: (state, action) => {
      state.messages = action.payload; // Cập nhật danh sách tin nhắn
    },
    // Cập nhật tin nhắn cuối cùng
    setLastMessageUpdate: (state, action) => {
      state.lastMessageUpdate = action.payload; // payload có thể là { conversationId, lastMessage } hoặc null
    },
    // Cập nhật thông tin cuộc trò chuyện
    setChatInfoUpdate: (state, action) => {
      state.chatInfoUpdate = action.payload; // payload chứa thông tin cuộc trò chuyện
    },
    // Cập nhật danh sách hội thoại được ghim
    setPinnedOrder: (state, action) => {
      state.pinnedOrder = action.payload; // Cập nhật danh sách conversationId được ghim
    },
    // Ghim một cuộc trò chuyện
    pinConversation: (state, action) => {
      const conversationId = action.payload;
      // Thêm conversationId vào đầu pinnedOrder, đảm bảo không trùng lặp
      state.pinnedOrder = [conversationId, ...state.pinnedOrder.filter(id => id !== conversationId)];
    },
    // Bỏ ghim một cuộc trò chuyện
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
  setMessages,
  setLastMessageUpdate,
  setChatInfoUpdate,
  setPinnedOrder,
  pinConversation,
  unpinConversation,
} = chatSlice.actions;

export default chatSlice.reducer;