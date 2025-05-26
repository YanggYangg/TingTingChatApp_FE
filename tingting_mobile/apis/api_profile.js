import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.24.106:3001";

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
    console.log("Token from AsyncStorage:", token);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
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

// 🔧 API Manager (sửa lỗi destructure params)
const ApiManager = {
  get: async (url, options = {}) => {
    const { params } = options;
    return request("get", url, null, params);
  },
  post: async (url, data) => request("post", url, data),
  put: async (url, data) => request("put", url, data),
  delete: async (url) => request("delete", url),
};

// 📂 API Calls
export const Api_Profile = {
  getProfile: async (id) => {
    return ApiManager.get(`api/v1/profile/${id}`);
  },
  updateProfile: async (id, data) => {
    return ApiManager.post(`api/v1/profile/${id}`, data);
  },
  uploadImage: async () => {
    return ApiManager.put("api/v1/profile/upload");
  },
  getProfiles: async () => {
    return ApiManager.get("api/v1/profile");
  }
};
