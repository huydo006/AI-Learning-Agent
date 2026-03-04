import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend } from 'recharts';
import { useNavigate } from "react-router-dom";
import documentApi from "../../api/documentApi";

export default function LearningHistory() {
  const navigate = useNavigate();
  const [groupedData, setGroupedData] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy username động từ localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const CURRENT_USER = user.username || "hs01";

  useEffect(() => {
    fetchHistory();
  }, [CURRENT_USER]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await documentApi.getLearningHistory(CURRENT_USER);
      const rawData = response.data || response;

      // Console log để cậu soi xem Backend đang gửi cái gì về
      console.log("📊 Dữ liệu thô từ MAS Backend:", rawData);

      if (!Array.isArray(rawData) || rawData.length === 0) {
        setGroupedData({});
        return;
      }

      // Nhóm dữ liệu theo môn học
      const groups = rawData.reduce((acc, item) => {
        // Nếu Backend chưa trả về course_name, mặc định là "MAS System"
        const courseName = item.course_name || "Môn học khác";
        if (!acc[courseName]) acc[courseName] = [];
        
        acc[courseName].push({ 
          ...item, 
          // Đảm bảo có accuracy để vẽ biểu đồ, nếu thiếu thì dùng final_score tạm
          accuracy: item.accuracy ?? item.final_score ?? 0,
          attemptIndex: acc[courseName].length + 1 
        });
        return acc;
      }, {});
      
      setGroupedData(groups);
      
      // Tự động chọn môn đầu tiên nếu có dữ liệu
      const courses = Object.keys(groups);
      if (courses.length > 0) setSelectedCourse(courses[0]);

    } catch (error) { 
      console.error("❌ Lỗi khi tải lịch sử:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <div className="font-black text-gray-400 uppercase tracking-widest text-xs">Đang đồng bộ MAS Core...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white text-xl">📊</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Phân tích tiến trình</h2>
        </div>
        <button 
          onClick={() => navigate('/student')} 
          className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md"
        >
          ← Dashboard
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar môn học */}
        <div className="w-80 bg-white border-r border-gray-100 p-8 overflow-y-auto shrink-0 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Lộ trình của bạn</h3>
          <div className="space-y-4">
            {Object.keys(groupedData).length > 0 ? (
              Object.keys(groupedData).map(course => (
                <button
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left px-6 py-5 rounded-[1.5rem] transition-all duration-300 transform ${
                    selectedCourse === course 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 -translate-y-1' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <div className={`text-xs font-black uppercase mb-1 ${selectedCourse === course ? 'text-blue-100' : 'text-gray-400'}`}>Course</div>
                  <div className="text-sm font-black truncate">{course}</div>
                  <div className={`text-[10px] mt-3 font-bold flex items-center gap-2 ${selectedCourse === course ? 'text-blue-200' : 'text-gray-400'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {groupedData[course].length} bài học đã hoàn thành
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-xs font-bold text-gray-300 italic uppercase">Chưa có bài học nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Nội dung biểu đồ */}
        <div className="flex-1 p-12 overflow-y-auto">
          {selectedCourse && groupedData[selectedCourse] ? (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
              {/* Biểu đồ chính */}
              <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase">{selectedCourse}</h3>
                    <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Sơ đồ phát triển năng lực AI MAS</p>
                  </div>
                  <div className="bg-blue-50 px-4 py-2 rounded-xl">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live Syncing</span>
                  </div>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={groupedData[selectedCourse]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                      <XAxis 
                        dataKey="attemptIndex" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        dy={20}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                        itemStyle={{ fontWeight: '900', fontSize: '12px' }}
                      />
                      <Legend verticalAlign="top" align="right" height={50} iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}/>

                      {/* Phân vùng năng lực chuẩn */}
                      <ReferenceArea y1={0} y2={40} fill="#fff1f2" fillOpacity={0.6} />
                      <ReferenceArea y1={40} y2={75} fill="#fffbeb" fillOpacity={0.6} />
                      <ReferenceArea y1={75} y2={100} fill="#f0fdf4" fillOpacity={0.6} />

                      <Line 
                        name="Chính xác (%)" 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#cbd5e1" 
                        strokeDasharray="8 8" 
                        strokeWidth={2} 
                        dot={false}
                      />
                      <Line 
                        name="Năng lực (MAS)" 
                        type="monotone" 
                        dataKey="final_score" 
                        stroke="#2563eb" 
                        strokeWidth={6} 
                        dot={{ r: 8, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} 
                        activeDot={{ r: 12, shadow: '0 0 20px rgba(37, 99, 235, 0.4)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bảng chi tiết */}
              <div className="bg-white rounded-[3rem] shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lần học</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nội dung bài giảng</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Độ chính xác</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Điểm MAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groupedData[selectedCourse].slice().reverse().map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-10 py-6">
                          <span className="text-xs font-black text-gray-300 group-hover:text-blue-600 transition-colors">#{item.attemptIndex}</span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="text-sm font-black text-gray-700">{item.lesson_name || "Bài học hệ thống"}</div>
                          <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">📅 Ngày làm: {item.date}</div>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <div className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-mono font-bold text-gray-500">
                            {item.accuracy}%
                          </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <div className={`inline-block px-5 py-2 rounded-xl text-xs font-black shadow-sm ${
                            item.final_score >= 75 ? 'bg-green-50 text-green-600' : 
                            item.final_score >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {item.final_score}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <div className="text-6xl mb-6 opacity-20">📈</div>
              <p className="font-black uppercase tracking-[0.2em] text-xs">Hãy chọn một môn học để AI MAS phân tích</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}