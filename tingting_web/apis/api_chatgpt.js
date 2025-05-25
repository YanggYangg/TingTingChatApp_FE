import axios from 'axios';
import { ApiManager } from './ApiManager';

export const Api_ChatGPT = {
    sendMessage: async (message) => {
        console.log("message", message);
        return ApiManager.post('chatService', '/chatgpt', { message });
    }
}; 