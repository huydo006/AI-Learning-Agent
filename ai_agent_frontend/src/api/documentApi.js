import axiosClient from './axiosClient';

const documentApi = {
    // ==========================================
    // KHU VỰC 1: API DÀNH CHO GIÁO VIÊN
    // ==========================================

    // 1. Tải lên tài liệu mới (Có kèm file nên phải dùng FormData)
    uploadDocument: (courseName, lessonName, file) => {
        const formData = new FormData();
        formData.append('course_name', courseName);
        formData.append('lesson_name', lessonName);
        formData.append('file', file);
        
        return axiosClient.post('/api/v1/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    },

    // 2. Lấy danh sách toàn bộ tài liệu
    getDocuments: () => {
        return axiosClient.get('/api/v1/documents');
    },

    // 3. Xóa một tài liệu dựa vào ID
    deleteDocument: (docId) => {
        return axiosClient.delete(`/api/v1/documents/${docId}`);
    },

    // ==========================================
    // KHU VỰC 2: API DÀNH CHO HỌC SINH (AI MAS)
    // ==========================================

    // 4. Gọi luồng Multi-Agent sinh đề kiểm tra đầu vào (Diagnostic Test) cho cả 1 Môn học
    generateDiagnosticTest: (courseName) => {
        const formData = new FormData();
        formData.append('course_name', courseName);
        
        return axiosClient.post('/api/v1/generate-diagnostic', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    },

    // 5. Gọi luồng Multi-Agent sinh bài học cá nhân hóa (Từng bài)
    generateLesson: (docId, level) => {
        const formData = new FormData();
        formData.append('level', level); 
        
        return axiosClient.post(`/api/v1/generate-lesson/${docId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    },

    // ==========================================
    // KHU VỰC 3: API LƯU TRỮ TIẾN ĐỘ (DATABASE)
    // ==========================================
    
    // 6. Gửi điểm test đầu vào để Learner Profiling Agent đánh giá và lưu hạng
    saveProgress: (username, courseName, score, totalQuestions) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('course_name', courseName);
        formData.append('score', score);
        formData.append('total_questions', totalQuestions);
        
        return axiosClient.post('/api/v1/progress', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    },

    // 7. Lấy danh sách tất cả các hạng môn học của học sinh
    getProgress: (username) => {
        return axiosClient.get(`/api/v1/progress/${username}`);
    },

    // 8. Nộp bài Mini-quiz và nhận đánh giá từ Evaluation Agent (Chuẩn MAS)
    submitQuiz: (username, docId, score, totalQuestions, timeSpent = 0, retryCount = 0) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('doc_id', docId);
        formData.append('score', score);
        formData.append('total_questions', totalQuestions);
        // Thêm 2 tham số mới cho Giai đoạn 3
        formData.append('time_spent', timeSpent);
        formData.append('retry_count', retryCount);
        
        return axiosClient.post('/api/v1/submit-quiz', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
    },
    // 9. Lấy lịch sử học tập chi tiết của học sinh
    getHistory: (username) => {
        return axiosClient.get(`/api/v1/history/${username}`);
    }
    
};

export default documentApi;