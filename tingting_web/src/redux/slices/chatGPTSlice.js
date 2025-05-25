import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    messages: [],
    isLoading: false,
    error: null
};

const chatGPTSlice = createSlice({
    name: 'chatGPT',
    initialState,
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        clearMessages: (state) => {
            state.messages = [];
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const {
    setMessages,
    addMessage,
    clearMessages,
    setLoading,
    setError
} = chatGPTSlice.actions;

export default chatGPTSlice.reducer; 