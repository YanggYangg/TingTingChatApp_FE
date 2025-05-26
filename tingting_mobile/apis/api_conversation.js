import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use environment-specific base URL
const BASE_URL = "http://192.168.0.103:5000";

// const BASE_URL = 'http://192.168.139.71:3001'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  responseType: "json",
});

// 👉 Add a request interceptor to always attach the latest token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 📦 Request wrapper
const request = async (method, url, data = null, params = null) => {
  try {
    // console.log(`Making ${method.toUpperCase()} request to ${url}`);
    if (data) console.log("Request data:", data);
    if (params) console.log("Request params:", params);

    const response = await axiosInstance({
      method,
      url,
      data,
      params,
    });

    // console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API call error:", error?.response?.data || error.message);
    throw error;
  }
};
// 🔧 API Manager
const ApiManager = {
  get: async (url, { params } = {}) => request("get", url, null, params),
  post: async (url, data) => request("post", url, data),
  put: async (url, data) => request("put", url, data),
  delete: async (url) => request("delete", url),
};

export const Api_Conversation = {
  getUserJoinGroup: async (userId) => {
    return ApiManager.get(`/conversations/userGroups/${userId}`);
  },
  getOrCreateConversation: async (user1Id, user2Id) => {
    return ApiManager.post('/conversations/getOrCreateConversation', {
      user1Id,
      user2Id,
    });
  },

  searchConversationsByUserId: async (userId, searchKeyword = "") => {
    // Gắn thủ công query param vào URL
    const query = searchKeyword ? `?search=${encodeURIComponent(searchKeyword)}` : "";
    return ApiManager.get(`/conversations/getAllConversationById2/${userId}${query}`);
  },


};
