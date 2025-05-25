import axios from 'axios';
import { ApiManager } from './ApiManager';

export const Api_ChatGPT = {
    sendMessage: async (data) => {
        try {
            const response = await ApiManager.post('/chatgpt', {
                message: data.message
            });
            return {
                data: {
                    message: response.data.message,
                    role: 'assistant'
                }
            };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}; 