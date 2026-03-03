import { Outlet, Link, useNavigate } from "react-router-dom";

export default function TeacherLayout({ user, logout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR BÊN TRÁI */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-slate-800 text-blue-400">
            AI Admin Panel
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/teacher" className="block px-4 py-2 rounded hover:bg-slate-800 transition">
            🏠 Dashboard Tổng quan
          </Link>
          <Link to="/teacher/documents" className="block px-4 py-2 rounded hover:bg-slate-800 transition">
            📄 Quản lý Tài liệu (PDF)
          </Link>
          <Link to="/teacher/students" className="block px-4 py-2 rounded hover:bg-slate-800 transition">
            👥 Danh sách Học viên
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
            <button 
                onClick={handleLogout}
                className="w-full bg-red-600/20 text-red-400 py-2 rounded hover:bg-red-600 hover:text-white transition"
            >
                Đăng xuất
            </button>
        </div>
      </aside>

      {/* NỘI DUNG BÊN PHẢI */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8">
          <h2 className="font-semibold text-gray-700">Khu vực Giảng viên</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 italic">Phiên bản 1.0 (Gemini 2.5)</span>
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-blue-700">{user?.username || "Giảng viên"}</span>
            </div>
          </div>
        </header>

        {/* VIEWPORT: Nơi các trang con (Dashboard, DocumentMgr) sẽ hiển thị */}
        <section className="flex-1 overflow-y-auto p-8">
            <Outlet /> 
        </section>
      </main>
    </div>
  );
}