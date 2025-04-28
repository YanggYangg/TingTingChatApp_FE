import axios from "axios";

const BASE_URL = "http://172.20.10.10:5000";
// const BASE_URL = "http://192.168.139.71:5000";
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  responseType: "json",
});

const handleApiError = (error) => {
  if (error.response) {
    // Lỗi từ phản hồi của server
    const { status, data } = error.response;
    console.error(`Lỗi API (mã trạng thái ${status}):`, data);

    // Xử lý các mã trạng thái cụ thể
    switch (status) {
      case 400:
        return { error: "Yêu cầu không hợp lệ.", details: data };
      case 401:
        return { error: "Không được ủy quyền.", details: data };
      case 404:
        return { error: "Không tìm thấy tài nguyên.", details: data };
      case 500:
        return { error: "Lỗi server nội bộ.", details: data };
      default:
        return { error: "Lỗi không xác định.", details: data };
    }
  } else if (error.request) {
    // Lỗi mạng (không nhận được phản hồi)
    console.error("Lỗi mạng:", error.request);
    return {
      error: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
    };
  } else {
    // Lỗi khác
    console.error("Lỗi khác:", error.message);
    return { error: "Lỗi không xác định.", details: error.message };
  }
};

const request = async (method, url, data = null, params = null) => {
  try {
    console.log(`[${method.toUpperCase()}] Gửi request tới: ${BASE_URL}${url}`);
    const response = await axiosInstance({ method, url, data, params });
    console.log(`[${method.toUpperCase()}] Phản hồi API:`, response.data);
    return response.data;
  } catch (error) {
    const errorData = handleApiError(error);
    throw errorData;
  }
};

export const ApiManager = {
  get: (url, params = {}) => request("get", url, null, params),
  post: (url, data) => request("post", url, data),
  put: (url, data) => request("put", url, data),
  delete: (url, data = null) => request("delete", url, data),
};
