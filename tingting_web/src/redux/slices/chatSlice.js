import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedMessage: null,
    selectedConversation: null,
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setSelectedMessage: (state, action) => {
            state.selectedMessage = action.payload;
        },
        clearSelectedMessage: (state) => {
            state.selectedMessage = null;
        },
        selectConversation: (state, action) => {
            state.selectedConversation = action.payload;
        },
    },
});

export const { setSelectedMessage, clearSelectedMessage, selectConversation } = chatSlice.actions;
export default chatSlice.reducer;
