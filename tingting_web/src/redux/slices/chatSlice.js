import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    selectedMessage: null,
    chatInfoUpdate: null,
    lastMessageUpdate: null,
  },
  reducers: {
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },
    clearSelectedMessage: (state) => {
      state.selectedMessage = null;
    },
    updateChatInfo: (state, action) => {
      state.chatInfoUpdate = action.payload;
    },
    updateLastMessage: (state, action) => {
      state.lastMessageUpdate = action.payload;
    },
  },
});

export const { setSelectedMessage, clearSelectedMessage, updateChatInfo, updateLastMessage } = chatSlice.actions;
export default chatSlice.reducer;