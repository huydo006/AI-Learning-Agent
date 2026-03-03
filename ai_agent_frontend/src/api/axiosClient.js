import axios from 'axios';

// Khởi tạo một instance của axios với các cấu hình mặc định
const axiosClient = axios.create({
    // Trỏ thẳng vào port 8000 của FastAPI Backend
    baseURL: 'http://127.0.0.1:8000', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// THÊM INTERCEPTOR CHO REQUEST (Trước khi gửi đi)
axiosClient.interceptors.request.use(
    (config) => {
        // Nếu sau này cậu dùng Token thực tế, mở comment 2 dòng dưới ra:
        // const token = localStorage.getItem('access_token');
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// THÊM INTERCEPTOR CHO RESPONSE (Sau khi nhận kết quả về)
axiosClient.interceptors.response.use(
    (response) => {
        // Chỉ lấy đúng cái cục data trả về, bỏ qua mấy thông số lằng nhằng của HTTP
        if (response && response.data) {
            return response.data;
        }
        return response;
    },
    (error) => {
        // Bắt lỗi toàn cục: Nếu backend báo lỗi 500 hoặc 400 thì văng ra đây
        const errorMessage = error.response?.data?.detail || "Lỗi kết nối đến máy chủ AI!";
        console.error("🚨 API Error:", errorMessage);
        
        // Ném lỗi ra để các component bên ngoài (Login, Dashboard) tự xử lý hiện thông báo
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;