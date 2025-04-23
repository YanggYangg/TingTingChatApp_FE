/*
 try {
        console.log(`Attempt ${attempt}: Uploading to http://192.168.1.5:5000`);
        const res = await fetch(
          "http://192.168.1.5:5000/messages/sendMessageWithMedia",
          {
            method: "POST",
            body: formData,
          }
        );
*/
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.33:5000";

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

// 📂 API Call
export const Api_S3 = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await ApiManager.post(
        "/messages/sendMessageWithMedia",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  },
};
