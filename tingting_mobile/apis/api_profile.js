import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";



const BASE_URL = 'http://172.27.144.1:3001';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AsyncStorage.getItem('token')}`,
    },
    responseType: 'json',
});

const request = async (method, url, data = null, params = null) => {
    try {
        console.log(`Making ${method.toUpperCase()} request to ${url}`);
        if (data) console.log('Request data:', data);
        if (params) console.log('Request params:', params);

        const response = await axiosInstance({
            method,
            url,
            data,
            params,
        });

        console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
};

const ApiManager = {
    get: async (url, { params } = {}) => request('get', url, null, params),
    post: async (url, data) => request('post', url, data),
    put: async (url, data) => request('put', url, data),
    delete: async (url) => request('delete', url),
};

export const Api_Profile = {

    getProfile: async (id) => {
        return ApiManager.get(`api/v1/profile/${id}`);
    },
    updateProfile: async (id, data) => {
        return ApiManager.post(`api/v1/profile/${id}`, data);
    },
    uploadImage: async () => {
        return ApiManager.post('api/v1/profile/upload');
    },



};