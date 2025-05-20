import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.171:3006";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  responseType: "json",
});

const request = async (method, url, data = null, params = null, headers = {}) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      params,
      headers, 
    });

    return response.data;
  } catch (error) {
    console.log("Request Error:", error.response?.data || error.message);
    throw error;
  }
};

const ApiManager = {
  get: async (url, { params } = {}) => request("get", url, null, params),
  post: async (url, data) => request("post", url, data),
  put: async (url, data) => request("put", url, data),
  delete: async (url) => request("delete", url),
};

export const Api_Post = {
    getAllPosts: async (data) => {
        return ApiManager.get("api/v1/post", data);
    },
    getPostById: async (id) => {
        return ApiManager.get(`api/v1/post/${id}`);
    },
    createPost: async (data) => {
        return ApiManager.post("api/v1/post", data);
    },
    updatePost: async (id, data) => {
        return ApiManager.put(`api/v1/post/${id}`, data);
    },
    deletePost: async (id) => {
        return ApiManager.delete(`api/v1/post/${id}`);
    },
    toggleLove: async (id, data) => {
        return ApiManager.post(`api/v1/post/${id}/love`, data);
    },
};
