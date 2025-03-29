import axios from "axios";

const BASE_URL = "http://localhost:5000"; // Cấu hình API backend

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  responseType: "json",
});

// Hàm thực hiện request chung
const request = async (method, url, data = null, params = null) => {
  try {
    console.log(`[${method.toUpperCase()}] Gửi request tới: ${BASE_URL}${url}`);
    const response = await axiosInstance({ method, url, data, params });
    console.log(`[${method.toUpperCase()}] Phản hồi API:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[${method.toUpperCase()}] Lỗi API:`, error.response?.data || error.message);
    throw error;
  }
};


// Định nghĩa các phương thức API
export const ApiManager = {
  get: (url, params = {}) => request("get", url, null, params),
  post: (url, data) => request("post", url, data),
  put: (url, data) => request("put", url, data),
  delete: (url, data = null) => request("delete", url, data), // Có thể thêm data nếu cần
};
