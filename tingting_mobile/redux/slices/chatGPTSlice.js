import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_MESSAGES_KEY = '@chat_messages';

const initialState = {
    messages: [
        { id: "1", text: "Xin chào! Tôi là chatbot của tingting app ! Bạn cần hỗ trợ gì?", sender: "bot" }
    ],
    loading: false,
    error: null
};

// Load messages from AsyncStorage
export const loadMessages = createAsyncThunk(
    'chatGPT/loadMessages',
    async () => {
        try {
            console.log('Loading messages from AsyncStorage...');
            const savedMessages = await AsyncStorage.getItem(CHAT_MESSAGES_KEY);
            console.log('Saved messages:', savedMessages);

            if (savedMessages) {
                const parsedMessages = JSON.parse(savedMessages);
                console.log('Parsed messages:', parsedMessages);
                return parsedMessages;
            }

            console.log('No saved messages found, using initial state');
            await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(initialState.messages));
            return initialState.messages;
        } catch (error) {
            console.error('Error loading messages:', error);
            return initialState.messages;
        }
    }
);

// Helper function to save messages
const saveMessagesToStorage = async (messages) => {
    try {
        console.log('Saving messages to AsyncStorage:', messages);
        await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
        console.log('Messages saved successfully');
    } catch (error) {
        console.error('Error saving messages:', error);
    }
};

const chatGPTSlice = createSlice({
    name: 'chatGPT',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            console.log('Adding new message:', action.payload);
            state.messages.push(action.payload);
            saveMessagesToStorage(state.messages);
        },
        removeLoadingMessage: (state, action) => {
            console.log('Removing loading message:', action.payload);
            state.messages = state.messages.filter(msg => msg.id !== action.payload);
            saveMessagesToStorage(state.messages);
        },
        resetMessages: (state) => {
            console.log('Resetting messages to initial state');
            state.messages = initialState.messages;
            saveMessagesToStorage(state.messages);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadMessages.pending, (state) => {
                console.log('Loading messages...');
                state.loading = true;
            })
            .addCase(loadMessages.fulfilled, (state, action) => {
                console.log('Messages loaded successfully:', action.payload);
                state.loading = false;
                state.messages = action.payload;
            }).addCase(loadMessages.rejected, (state, action) => {
                console.error('Error loading messages:', action.error);
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { addMessage, removeLoadingMessage, resetMessages } = chatGPTSlice.actions;
export default chatGPTSlice.reducer;