import axiosClient from './axiosClient';

const documentApi = {
    // ==========================================
    // KHU VỰC 0: AUTHENTICATION (ĐÃ CẬP NHẬT)
    // ==========================================

    // ✅ THÊM HÀM LOGIN: Gửi JSON để fix lỗi 422
    login: (data) => {
        // data: { username, password }
        return axiosClient.post('/api/v1/auth/login', data);
    },

    // ==========================================
    // KHU VỰC 1: API DÀNH CHO GIÁO VIÊN
    // ==========================================

    uploadDocument: (courseName, lessonName, file) => {
        const formData = new FormData();
        formData.append('course_name', courseName);
        formData.append('lesson_name', lessonName);
        formData.append('file', file);
        
        return axiosClient.post('/api/v1/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    getDocuments: () => {
        return axiosClient.get('/api/v1/documents');
    },

    deleteDocument: (docId) => {
        return axiosClient.delete(`/api/v1/documents/${docId}`);
    },

    getStudents: () => {
        return axiosClient.get('/api/v1/users/students');
    },

    getAllUsers: () => {
        return axiosClient.get('/api/v1/users/all');
    },

    // ==========================================
    // KHU VỰC QUẢN LÝ TÀI KHOẢN (JSON - FIX LỖI 422)
    // ==========================================

    createUser: (data) => {
        // data: { full_name, username, password, role }
        return axiosClient.post('/api/v1/auth/register', data);
    },

    updateUser: (userId, data) => {
        // data: { full_name, username, password, role }
        return axiosClient.put(`/api/v1/users/${userId}`, data);
    },

    deleteUser: (userId) => {
        return axiosClient.delete(`/api/v1/users/${userId}`);
    },

    // ==========================================
    // KHU VỰC 2: API DÀNH CHO HỌC SINH (AI MAS)
    // ==========================================

    generateDiagnosticTest: (courseName) => {
        const formData = new FormData();
        formData.append('course_name', courseName);
        return axiosClient.post('/api/v1/generate-diagnostic', formData);
    },

    generateLesson: (docId, level) => {
        const formData = new FormData();
        formData.append('level', level); 
        return axiosClient.post(`/api/v1/generate-lesson/${docId}`, formData);
    },

    // ==========================================
    // KHU VỰC 3: API LƯU TRỮ TIẾN ĐỘ & LỊCH SỬ
    // ==========================================
    
    saveProgress: (username, courseName, score, totalQuestions) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('course_name', courseName);
        formData.append('score', score);
        formData.append('total_questions', totalQuestions);
        return axiosClient.post('/api/v1/progress', formData);
    },

    getProgress: (username) => {
        return axiosClient.get(`/api/v1/progress/${username}`);
    },

    submitQuiz: (username, docId, score, totalQuestions, timeSpent = 0, retryCount = 0) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('doc_id', docId);
        formData.append('score', score);
        formData.append('total_questions', totalQuestions);
        formData.append('time_spent', timeSpent);
        formData.append('retry_count', retryCount);
        return axiosClient.post('/api/v1/submit-quiz', formData);
    },

    // ✅ ĐỔI TÊN THÀNH getHistory: Để khớp với giao diện LearningHistory.jsx
    getHistory: (username) => {
        return axiosClient.get(`/api/v1/history/${username}`);
    }
};

export default documentApi;