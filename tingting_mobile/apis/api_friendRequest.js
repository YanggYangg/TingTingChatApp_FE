import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.7:3001";

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
    console.log(`Making ${method.toUpperCase()} request to ${url}`);
    if (data) console.log("Request data:", data);
    if (params) console.log("Request params:", params);

    const response = await axiosInstance({
      method,
      url,
      data,
      params,
    });

    console.log("Response:", response.data);
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

// 📂 API Calls
export const Api_FriendRequest = {
      sendFriendRequest: async (data) => {
        return ApiManager.post("api/v1/friendRequest/sendFriendRequest", data);
      },
      respondToFriendRequest: async (data) => {
        return ApiManager.post("api/v1/friendRequest/respondToFriendRequest", data);
      },
      //Ket ban da gui 
      getSentRequests: async (userId) => {
        return ApiManager.get(`api/v1/friendRequest/getSentRequests/${userId}`);
      },
      //Ket ban da nhan
      getReceivedRequests: async (userId) => {
        return ApiManager.get(`api/v1/friendRequest/getReceivedRequests/${userId}`);
      },
      getFriends: async (userId) => {
        return ApiManager.get(`api/v1/friendRequest/getFriends/${userId}`);
      },
      cancelFriendRequest: async (data) => {
        return ApiManager.post("api/v1/friendRequest/cancelFriendRequest", data);
      },
      unfriend: async (userId1, userId2) => {
        return ApiManager.post(`/api/v1/friendRequest/unfriend`, {
          userId1,
          userId2
        });
      },
      
      getFriendRequestsForUser: async (userId) => {
        return ApiManager.get(`api/v1/friendRequest/getFriendRequestsForUser/${userId}`);
      },
      checkFriendStatus: async (data) => {
        return ApiManager.post("api/v1/friendRequest/checkFriendStatus", data);
      },
      //Danh sach ban be
      getFriendsList: async (userId) => {
        return ApiManager.get(`/api/v1/friendRequest/getFriendsLists/${userId}`);
      },
      getSentPendingRequests: async (userId) => {
        return ApiManager.get(`/api/v1/friendRequest/getSentPendingRequests/${userId}`);
      }
};

