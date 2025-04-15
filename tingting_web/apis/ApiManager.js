import axios from "axios";

//Auth: 3000
//User: 3001
//Chat: 5000
const SERVICES = {
    authService: 'http://localhost:3000',
    userService: 'http://localhost:3001',
    chatService: 'http://localhost:5000',
};

//Tạo một instance axios theo service
const createAxiosInstance = (service) => {
    if(!SERVICES[service]) {
        throw new Error(`Service ${service} not found`);
    }

    return axios.create({
        baseURL: SERVICES[service],
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
        },
        responseType: 'json',
    });
    // Gắn token mỗi lần request
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    });

    return instance;
};

//Hàm gọi API chung 
const request = async (service, method, url, data = null, params = null) => {
    try {
        const axiosInstance = createAxiosInstance(service);

        console.log(`${method.toUpperCase()} request -> ${SERVICES[service]}${url}`);
        if (data) console.log('Data:', data);
        if (params) console.log('Params:', params);

        const response = await axiosInstance({
            method,
            url,
            data,
            params,
        });

        console.log('Response:', response.data);
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