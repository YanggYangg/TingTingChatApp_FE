import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedMessage: null,
    selectedConversation: null,
};

const chatSlice = createSlice({
    name: "chat",
    initialState:{
      selectedMessage: null, // Lưu trữ thông tin cuộc trò chuyện được chọn
      lastMessageUpdate: null, // Nhi thêm: Lưu trữ tin nhắn cuối cùng của cuộc trò chuyện
      chatInfoUpdate: null, // Nhi thêm: Lưu trữ thông tin cập nhật của cuộc trò chuyện
    },
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
         // Nhi thêm: Cập nhật tin nhắn cuối cùng (hỗ trợ giá trị null khi xóa lịch sử)
    setLastMessageUpdate: (state, action) => {
      state.lastMessageUpdate = action.payload; // payload có thể là { conversationId, lastMessage } hoặc null
    },
    // Nhi thêm: Cập nhật thông tin cuộc trò chuyện (tên, avatar, thành viên, v.v.)
    setChatInfoUpdate: (state, action) => {
      state.chatInfoUpdate = action.payload; // payload chứa thông tin cuộc trò chuyện
    },
    },
});

export const { setSelectedMessage, clearSelectedMessage, selectConversation, setLastMessageUpdate, setChatInfoUpdate } = chatSlice.actions;
export default chatSlice.reducer;