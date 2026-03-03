import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    // MÔ PHỎNG LOGIC ĐĂNG NHẬP (Sau này sẽ gọi axiosClient.post('/auth/login'))
    setTimeout(() => {
      if (username === "gv01" && password === "123456") {
        const userData = { username: "gv01", full_name: "Nguyễn Văn Giảng Viên", role: "teacher" };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData)); // Lưu lại để F5 không mất login
        navigate("/teacher");
      } else if (username === "hs01" && password === "123456") {
        const userData = { username: "hs01", full_name: "Trần Thị Học Sinh", role: "student" };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/student");
      } else {
        alert("Sai tài khoản hoặc mật khẩu! (Thử gv01/123456 hoặc hs01/123456)");
      }
      setLoading(false);
    }, 800); // Tạo hiệu ứng loading cho chuyên nghiệp
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header của Form */}
        <div className="bg-white p-8 pb-4 text-center">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.72 0 3.347.433 4.774 1.214a10.001 10.001 0 014.582 9.174m-9.439 5.106a9.006 9.006 0 01-2.297-3.423" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AI Learning Agent</h1>
          <p className="text-gray-500 text-sm mt-1">Hệ thống học tập cá nhân hóa thông minh</p>
        </div>

        {/* Form Đăng nhập */}
        <form onSubmit={handleLogin} className="p-8 pt-4 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đăng nhập</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: gv01 hoặc hs01"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition transform active:scale-95 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Đang xác thực..." : "ĐĂNG NHẬP"}
          </button>

          <div className="text-center">
            <a href="#" className="text-xs text-blue-600 hover:underline">Quên mật khẩu?</a>
          </div>
        </form>

        {/* Footer của Form */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-400">© 2026 Dự án AI Agent MAS - Multi-Agent System</p>
        </div>
      </div>
    </div>
  );
}