import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import documentApi from "../../api/documentApi";

export default function StudentsList() {
  const queryClient = useQueryClient();
  const [selectedUsername, setSelectedUsername] = useState(null);
  
  // States cho Form Quản lý Tài khoản
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', username: '', password: '' });

  // 1. LẤY DANH SÁCH SINH VIÊN
  const { data: students = [], isLoading, isError } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await documentApi.getStudents();
      return response.data || response;
    },
    refetchInterval: 50000,
  });

  // 2. CÁC THAO TÁC CRUD (Tạo/Sửa/Xóa)
  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? documentApi.updateUser(editingId, data) : documentApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => documentApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries(['students'])
  });

  const resetForm = () => {
    setFormData({ full_name: '', username: '', password: '' });
    setEditingId(null);
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setFormData({ full_name: student.full_name, username: student.username, password: student.password });
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse">Đang tải dữ liệu thực tế...</div>;
  if (isError) return <div className="p-10 text-red-500 text-center">Lỗi kết nối Backend!</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">👥 Quản lý Học viên</h1>
      
      {/* KHU VỰC THÊM / SỬA TÀI KHOẢN */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
        <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
            {editingId ? "🛠️ Hiệu chỉnh thông tin" : "🆕 Tạo tài khoản sinh viên mới"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input 
            className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 ring-blue-500" 
            placeholder="Họ và tên" 
            value={formData.full_name} 
            onChange={e => setFormData({...formData, full_name: e.target.value})} 
          />
          <input 
            className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 ring-blue-500" 
            placeholder="Tên đăng nhập" 
            value={formData.username} 
            onChange={e => setFormData({...formData, username: e.target.value})} 
          />
          <input 
            className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 ring-blue-500" 
            placeholder="Mật khẩu" 
            value={formData.password} 
            onChange={e => setFormData({...formData, password: e.target.value})} 
          />
          <div className="flex gap-2">
            <button 
                onClick={() => saveMutation.mutate(formData)}
                className={`flex-1 py-3 text-white font-black text-[10px] uppercase rounded-xl shadow-lg transition-all ${editingId ? 'bg-orange-500' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {editingId ? "Cập nhật" : "Tạo tài khoản"}
            </button>
            {editingId && <button onClick={resetForm} className="bg-gray-100 px-4 rounded-xl text-xs font-bold">Hủy</button>}
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH TÀI KHOẢN */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-5">Học viên</th>
              <th className="px-8 py-5">Tài khoản / Mật khẩu</th>
              <th className="px-8 py-5 text-center">Trình độ</th>
              <th className="px-8 py-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-5">
                  <div className="font-bold text-gray-700">{student.full_name}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {student.id}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-sm font-mono text-blue-600 font-bold">@{student.username}</div>
                  <div className="text-xs font-mono text-gray-400 italic">Pass: {student.password}</div>
                </td>
                <td className="px-8 py-5 text-center">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                    student.current_level === 'Advanced' ? 'bg-purple-100 text-purple-600' : 
                    student.current_level === 'Intermediate' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {student.current_level || "Beginner"} 
                  </span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button 
                    onClick={() => setSelectedUsername(student.username)}
                    className="p-2 bg-gray-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg transition-all"
                    title="Xem lộ trình"
                  >
                    🔍
                  </button>
                  <button 
                    onClick={() => handleEdit(student)}
                    className="p-2 bg-gray-50 hover:bg-orange-500 hover:text-white text-orange-500 rounded-lg transition-all"
                    title="Sửa thông tin"
                  >
                    📝
                  </button>
                  <button 
                    onClick={() => window.confirm('Xóa tài khoản này?') && deleteMutation.mutate(student.id)}
                    className="p-2 bg-gray-50 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all"
                    title="Xóa tài khoản"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cửa sổ Modal Lịch sử bài học (Giữ nguyên của cậu) */}
      {selectedUsername && (
        <StudentDetailModal 
          username={selectedUsername} 
          onClose={() => setSelectedUsername(null)} 
        />
      )}
    </div>
  );
}
function StudentDetailModal({ username, onClose }) {
  // Tự động fetch lịch sử bài học của học sinh này
  const { data: history, isLoading } = useQuery({
    queryKey: ['history', username],
    queryFn: () => documentApi.getLearningHistory(username),
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-8 relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-6 right-8 text-gray-300 hover:text-gray-600 text-2xl">✕</button>
        
        <h2 className="text-2xl font-black text-gray-800 mb-2">Lịch sử bài học</h2>
        <p className="text-gray-400 mb-6 font-bold uppercase text-xs tracking-widest">Học viên: {username}</p>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <p className="text-center py-10 text-gray-400">Đang lục lại hồ sơ...</p>
          ) : history?.length > 0 ? (
            history.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                <div className="flex-1">
                  <div className="text-xs font-black text-blue-500 uppercase mb-1">{item.course_name}</div>
                  <div className="font-bold text-gray-700">{item.lesson_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-gray-800">{item.final_score}%</div>
                  <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${
                    item.final_score >= 80 ? 'bg-purple-100 text-purple-600' : 
                    item.final_score >= 50 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {item.final_score >= 80 ? "Advanced" : item.final_score >= 50 ? "Intermediate" : "Beginner"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-10 text-gray-400 italic">Chưa học bài nào hết cậu ơi!</p>
          )}
        </div>
      </div>
    </div>
  );
}