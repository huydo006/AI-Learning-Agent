import React from 'react';

export default function TeacherDashboard() {
  // Danh sách 5 Agent cốt lõi của hệ thống MAS đã được tối ưu mô tả
  const agents = [
    { 
      name: "Content Agent", 
      status: "Online", 
      task: "Trích xuất & Phân tích nội dung", 
      icon: "📄",
      desc: "Chuyên đọc các file PDF bài giảng giáo viên tải lên, trích xuất văn bản và tóm tắt các khái niệm cốt lõi của bài học."
    },
    { 
      name: "Profiling Agent", 
      status: "Active", 
      task: "Xếp hạng & Cập nhật trình độ", 
      icon: "👤",
      desc: "Theo dõi bảng điểm, tính trung bình cộng tích lũy để xếp hạng học sinh vào các mức: Beginner, Intermediate hoặc Advanced."
    },
    { 
      name: "Assessment Agent", 
      status: "Ready", 
      task: "Sinh câu hỏi trắc nghiệm", 
      icon: "📝",
      desc: "Tự động soạn đề thi và Quiz dựa trên nội dung bài học và trình độ hiện tại của học sinh để đảm bảo độ khó phù hợp."
    },
    { 
      name: "Adaptive Agent", 
      status: "Idle", 
      task: "Cá nhân hóa bài giảng", 
      icon: "⚙️",
      desc: "Đóng vai trò gia sư riêng, thay đổi cách giải thích lý thuyết và ví dụ minh họa sao cho dễ hiểu nhất với năng lực từng người."
    },
    { 
      name: "Evaluation Agent", 
      status: "Online", 
      task: "Chấm điểm đa tiêu chí", 
      icon: "⚖️",
      desc: "Cầm cân nảy mực khi chấm điểm, tính toán Final Score dựa trên độ chính xác, tốc độ làm bài và số lần học sinh phải làm lại."
    }
  ];

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 tracking-tighter">📊 HỆ THỐNG CÁC AI AGENT</h1>
        <p className="text-gray-500 mt-2 font-medium">Trạng thái vận hành của các tác tử AI trong thời gian thực.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <div 
            key={index} 
            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-5xl group-hover:scale-110 transition-transform drop-shadow-sm">{agent.icon}</div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">{agent.status}</span>
              </div>
            </div>

            <h3 className="text-xl font-black text-gray-800 mb-1 uppercase tracking-tight">{agent.name}</h3>
            <div className="text-[10px] font-black text-blue-600 mb-4 bg-blue-50 px-3 py-1 rounded-lg inline-block uppercase tracking-wider">
              {agent.task}
            </div>
            
            <p className="text-sm text-gray-500 leading-relaxed font-medium min-h-[60px]">
              "{agent.desc}"
            </p>

            <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Uptime</span>
                <span className="text-xs font-black text-gray-800">99.9%</span>
              </div>
              <button className="text-xs font-black text-blue-500 hover:text-blue-700 transition-colors bg-blue-50/50 px-4 py-2 rounded-xl">
                Xem Log →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}