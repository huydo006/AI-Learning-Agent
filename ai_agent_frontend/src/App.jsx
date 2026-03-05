import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";


import Login from "./pages/auth/Login";
import TeacherLayout from "./layouts/TeacherLayout";
import StudentLayout from "./layouts/StudentLayout";
import DocumentMgr from "./pages/teacher/DocumentMgr";
import StudentDashboard from "./pages/student/StudentDashboard";
import LessonDetail from './pages/student/LessonDetail';
import LearningHistory from './pages/student/LearningHistory'; 
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentsList from "./pages/teacher/StudentsList";
export default function App() {
  const [user, setUser] = useState(null);

  // Tự động đăng nhập lại nếu đã có thông tin trong máy
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <Router>
      <Routes>
        {/* TRANG CHỦ: Điều hướng dựa trên việc đã login hay chưa */}
        <Route path="/" element={
          !user ? <Login setUser={setUser} /> : <Navigate to={user.role === 'teacher' ? "/teacher" : "/student"} />
        } />

        {/* CỤM ROUTE GIÁO VIÊN */}
        <Route path="/teacher" element={<TeacherLayout user={user} logout={logout} />}>
           <Route index element={<TeacherDashboard />} />
            <Route path="documents" element={<DocumentMgr />} />
            <Route path="students" element={<StudentsList />} /> 
        </Route>
       

        
        

        {/* CỤM ROUTE HỌC SINH */}
        <Route path="/student" element={<StudentLayout user={user} logout={logout} />}>
          {/* Dashboard danh sách môn học */}
          <Route index element={<StudentDashboard />} />
          
          {/* Chi tiết bài học và làm bài tập */}
          <Route path="lesson/:docId" element={<LessonDetail />} />

          {/* Trang Lịch sử học tập (Route này để nút trên Menu hoạt động) */}
          <Route path="history" element={<LearningHistory />} />
        </Route>

        {/* Catch-all: Nếu gõ sai đường dẫn thì về trang chủ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}