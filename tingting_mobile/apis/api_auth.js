import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// const BASE_URL = "http://192.168.139.71:3002";
// 
const BASE_URL = "http://localhost:3002";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  responseType: "json",
});

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
    throw error;
  }
};

const ApiManager = {
  get: async (url, { params } = {}) => request("get", url, null, params),
  post: async (url, data) => request("post", url, data),
  put: async (url, data) => request("put", url, data),
  delete: async (url) => request("delete", url),
};

export const Api_Auth = {
  login: async (data) => {
    return ApiManager.post("api/v1/auth/sign-in", data);
  },
  generate_token: async (data) => {
    return ApiManager.post("api/v1/auth/generate-token", data);
  },
  resent_otp: async (data) => {
    return ApiManager.post("api/v1/auth/resent-otp", data);
  },
  signUp: async (data) => {
    return ApiManager.post("api/v1/auth/sign-up", data);
  },
  create_account: async (data) => {
    return ApiManager.post("api/v1/auth/create-account", data);
  },
  logout: async (data) => {
    return ApiManager.post("api/v1/auth/sign-out", data);
  },
  forgotPassword: async (data) => {
    return ApiManager.post("api/v1/auth/forgot-password", data);
  },
  verifyOTP: async (data) => {
    return ApiManager.post("api/v1/auth/verify-otp", data);
  },
  updateNewPassword: async (data) => {
    return ApiManager.post("api/v1/auth/update-password", data);
  },
  validateToken: async (data) => {
    return ApiManager.post("api/v1/auth/validate-token", data);
  },
};
