import axios from 'axios';
import { ApiManager } from './ApiManager';

export const Api_Profile = {
    getProfiles: async () => {
        return ApiManager.get('userService', 'api/v1/profile/');  
    },
    getProfile: async (id, data) => {
        return ApiManager.get('userService',`api/v1/profile/${id}`, data);
    },
    updateProfile: async (id, data) => {
        return ApiManager.post('userService', `api/v1/profile/${id}`, data);
    },
    uploadImage: async () => {
        return ApiManager.post('userService', 'api/v1/profile/upload');
    },
    getUserPhone: async (id) => {
        return ApiManager.get('userService', `api/v1/profile/getUserPhone/${id}`);
    }
};
