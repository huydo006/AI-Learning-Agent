import { Outlet, Link, useNavigate } from "react-router-dom";

export default function StudentLayout({ user, logout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP NAVIGATION BAR */}
      <nav className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-10">
          <div className="text-xl font-bold text-green-600 flex items-center">
            <span className="text-2xl mr-2">🌱</span> AI Academy
          </div>
          
          <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-600">
            <Link to="/student" className="hover:text-green-600 transition">Khóa học của tôi</Link>
            <Link to="/student/history" className="hover:text-green-600 transition">Lịch sử học tập</Link>
            <Link to="/student/profile" className="hover:text-green-600 transition">Cá nhân</Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-800 leading-tight">{user?.username || "Học viên"}</p>
            <p className="text-xs text-green-500 font-medium">Hạng: Beginner</p>
          </div>
          
          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold border-2 border-green-200">
            {user?.username?.charAt(0).toUpperCase() || "H"}
          </div>

          <button 
            onClick={handleLogout}
            className="ml-2 p-2 text-gray-400 hover:text-red-500 transition"
            title="Đăng xuất"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        {/* Breadcrumb nhẹ cho học sinh biết mình đang ở đâu */}
        <div className="mb-6 flex items-center text-xs text-gray-400 space-x-2">
            <span>Trang chủ</span>
            <span>/</span>
            <span className="text-gray-600 font-medium">Bài học</span>
        </div>

        {/* Nơi hiển thị Dashboard học sinh hoặc màn hình làm bài */}
        <div className="animate-fadeIn">
            <Outlet />
        </div>
      </main>

      {/* FOOTER NHỎ */}
      <footer className="py-6 text-center text-gray-400 text-xs border-t bg-white">
        © 2026 AI Personalized Learning Platform - Powered by Gemini 2.5
      </footer>
    </div>
  );
}