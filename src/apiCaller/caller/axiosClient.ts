import axios from "axios";

const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL + "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Thêm interceptor để tự động gắn token
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("id_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Xử lý lỗi response (tùy chọn)
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn("Access token hết hạn hoặc không hợp lệ");
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
