import axios from "axios";

//Auth: 3000
//User: 3001
//Chat: 5000
const SERVICES = {
  authService: 'http://100.28.46.80:3002',
  userService: 'http://100.28.46.80:3001',
  chatService: 'http://100.28.46.80:5000',
};

// Tạo một instance axios theo service
const createAxiosInstance = (service) => {
  if (!SERVICES[service]) {
    throw new Error(`Service ${service} not found`);
  }

  const instance = axios.create({
    baseURL: SERVICES[service],
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
    responseType: "json",
  });

  // Gắn token mỗi lần request
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token"); // Hoặc AsyncStorage nếu React Native
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

// Hàm gọi API chung
const request = async (service, method, url, data = null, params = null) => {
  try {
    const axiosInstance = createAxiosInstance(service);

    console.log(
      `${method.toUpperCase()} request -> ${SERVICES[service]}${url}`
    );
    if (data) console.log("Data:", data);
    if (params) console.log("Params:", params);

    const response = await axiosInstance({
      method,
      url,
      data,
      params,
    });

    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
};

// Định nghĩa các phương thức API
export const ApiManager = {
  get: async (service, url, { params } = {}) =>
    request(service, "get", url, null, params),
  post: async (service, url, data) => request(service, "post", url, data),
  put: async (service, url, data) => request(service, "put", url, data),
  delete: async (service, url, data) => request(service, "delete", url, data),
};