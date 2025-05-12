// import { createSlice } from "@reduxjs/toolkit";

// const chatSlice = createSlice({
//   name: "chat",
//   initialState: {
//     selectedMessage: null,
//     lastMessageUpdate: null,
//     chatInfoUpdate: null,
//   },
//   reducers: {
//     setSelectedMessage: (state, action) => {
//       state.selectedMessage = action.payload;
//     },
//     clearSelectedMessage: (state) => {
//       state.selectedMessage = null;
//     },
//     updateLastMessage: (state, action) => {
//       state.lastMessageUpdate = action.payload;
//     },
//     updateChatInfo: (state, action) => {
//       state.chatInfoUpdate = action.payload;
//     },
//     setChatInfoUpdate(state, action) {
//       state.chatInfoUpdate = action.payload;
//     },
//     setLastMessageUpdate(state, action) {
//       state.lastMessageUpdate = action.payload;
//     },
//   },
// });

// export const { setSelectedMessage, clearSelectedMessage, updateLastMessage, updateChatInfo, setChatInfoUpdate, setLastMessageUpdate } = chatSlice.actions;
// export default chatSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    selectedMessage: null, // Lưu trữ thông tin cuộc trò chuyện được chọn
    lastMessageUpdate: null, // Lưu trữ tin nhắn cuối cùng của cuộc trò chuyện
    chatInfoUpdate: null, // Lưu trữ thông tin cập nhật của cuộc trò chuyện
  },
  reducers: {
    // Đặt hoặc xóa cuộc trò chuyện được chọn
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },
    clearSelectedMessage: (state) => {
      state.selectedMessage = null;
    },
    // Cập nhật tin nhắn cuối cùng (hỗ trợ giá trị null khi xóa lịch sử)
    setLastMessageUpdate: (state, action) => {
      state.lastMessageUpdate = action.payload; // payload có thể là { conversationId, lastMessage } hoặc null
    },
    // Cập nhật thông tin cuộc trò chuyện (tên, avatar, thành viên, v.v.)
    setChatInfoUpdate: (state, action) => {
      state.chatInfoUpdate = action.payload; // payload chứa thông tin cuộc trò chuyện
    },
  },
});

export const { setSelectedMessage, clearSelectedMessage, setLastMessageUpdate, setChatInfoUpdate } = chatSlice.actions;
export default chatSlice.reducer;