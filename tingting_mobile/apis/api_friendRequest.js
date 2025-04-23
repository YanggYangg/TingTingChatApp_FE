import axios from 'axios';

// Use environment-specific base URL
const BASE_URL = 'http://localhost:3001' 

// const BASE_URL = 'http://192.168.139.71:3001' 

const ApiManager = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
ApiManager.interceptors.request.use(
  (config) => {
    console.log('Requesting:', config.url, 'with params:', config.params);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
ApiManager.interceptors.response.use(
  (response) => {
    console.log('Response received from:', response.config.url, 'data:', response.data);
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      url: error.config?.url,
      message: error.message,
      response: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export const Api_FriendRequest = {
  getFriendsList: async (userId) => {
    if (!userId) {
      throw new Error('userId is required to fetch friends list.');
    }
    try {
      const response = await ApiManager.get(`/api/v1/friendRequest/getFriendsLists/${userId}`);
      if (!response.data) {
        throw new Error('No data returned from friends list API.');
      }
      return response;
    } catch (error) {
      console.error('Error fetching friends list:', error);
      throw new Error(
        error.response?.status === 404
          ? 'Friends list endpoint not found.'
          : error.message === 'Network Error'
          ? 'Unable to connect to the server. Please check your network or server status.'
          : 'Failed to fetch friends list. Please try again.'
      );
    }
  },
};