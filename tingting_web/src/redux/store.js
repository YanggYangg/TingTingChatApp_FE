import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./slices/chatSlice";
import chatGPTReducer from "./slices/chatGPTSlice";


const store = configureStore({
    reducer: {
        chat: chatReducer,
        chatGPT: chatGPTReducer
    },
});

export default store;
