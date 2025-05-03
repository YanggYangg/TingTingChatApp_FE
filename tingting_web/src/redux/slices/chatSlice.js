import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    selectedMessage: null,
    lastMessageUpdate: null,
    chatInfoUpdate: null,
  },
  reducers: {
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },
    clearSelectedMessage: (state) => {
      state.selectedMessage = null;
    },
    updateLastMessage: (state, action) => {
      state.lastMessageUpdate = action.payload;
    },
    updateChatInfo: (state, action) => {
      state.chatInfoUpdate = action.payload;
    },
    setChatInfoUpdate(state, action) {
      state.chatInfoUpdate = action.payload;
    },
    setLastMessageUpdate(state, action) {
      state.lastMessageUpdate = action.payload;
    },
  },
});

export const { setSelectedMessage, clearSelectedMessage, updateLastMessage, updateChatInfo, setChatInfoUpdate, setLastMessageUpdate } = chatSlice.actions;
export default chatSlice.reducer;