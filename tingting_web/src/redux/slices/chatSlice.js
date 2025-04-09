import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedMessage: null,
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
    },
});

export const { setSelectedMessage, clearSelectedMessage } = chatSlice.actions;
export default chatSlice.reducer;
