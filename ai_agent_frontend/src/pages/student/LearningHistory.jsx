import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend } from 'recharts';
import { useNavigate } from "react-router-dom";
import documentApi from "../../api/documentApi";

const CURRENT_USER = "hs01";

export default function LearningHistory() {
  const navigate = useNavigate();
  const [groupedData, setGroupedData] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await documentApi.getHistory(CURRENT_USER);
      const rawData = response.data || response;

      // Nhóm dữ liệu theo môn
      const groups = rawData.reduce((acc, item) => {
        if (!acc[item.course_name]) acc[item.course_name] = [];
        acc[item.course_name].push({ ...item, attemptIndex: acc[item.course_name].length + 1 });
        return acc;
      }, {});
      
      setGroupedData(groups);
      if (Object.keys(groups).length > 0) setSelectedCourse(Object.keys(groups)[0]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">Đang đồng bộ dữ liệu MAS...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">📊 PHÂN TÍCH TIẾN TRÌNH HỌC TẬP</h2>
        <button onClick={() => navigate('/student')} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold hover:bg-gray-200 transition">← Về Dashboard</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar môn học */}
        <div className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto shrink-0">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Môn học của bạn</h3>
          <div className="space-y-3">
            {Object.keys(groupedData).map(course => (
              <button
                key={course}
                onClick={() => setSelectedCourse(course)}
                className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all transform hover:scale-[1.02] ${selectedCourse === course ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                {course}
                <div className={`text-[10px] mt-1 ${selectedCourse === course ? 'text-blue-100' : 'text-gray-400'}`}>{groupedData[course].length} bài thực hành</div>
              </button>
            ))}
          </div>
        </div>

        {/* Nội dung biểu đồ */}
        <div className="flex-1 p-10 overflow-y-auto">
          {selectedCourse ? (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Biểu đồ chính */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-gray-800">📈 Sơ đồ phát triển năng lực: {selectedCourse}</h3>
                  <div className="flex space-x-2">
                    <div className="flex items-center text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">ĐƯỜNG MAS</div>
                  </div>
                </div>
                
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={groupedData[selectedCourse]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="attemptIndex" label={{ value: 'Lần thực hành', position: 'insideBottomRight', offset: -10, fontSize: 10 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="top" height={36}/>

                      {/* Vùng màu Level cực rõ */}
                      <ReferenceArea y1={0} y2={40} fill="#fee2e2" fillOpacity={0.5} label={{ value: 'BEGINNER', fill: '#ef4444', fontSize: 10, fontWeight: '900' }} />
                      <ReferenceArea y1={40} y2={75} fill="#fef3c7" fillOpacity={0.5} label={{ value: 'INTERMEDIATE', fill: '#d97706', fontSize: 10, fontWeight: '900' }} />
                      <ReferenceArea y1={75} y2={100} fill="#dcfce7" fillOpacity={0.5} label={{ value: 'ADVANCED', fill: '#16a34a', fontSize: 10, fontWeight: '900' }} />

                      <Line name="Điểm bài thi (%)" type="monotone" dataKey="accuracy" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} />
                      <Line name="Điểm Năng lực (MAS)" type="monotone" dataKey="final_score" stroke="#2563eb" strokeWidth={5} dot={{ r: 7, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bảng kê chi tiết */}
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Lần</th>
                      <th className="px-8 py-5">Bài học</th>
                      <th className="px-8 py-5 text-center">Độ chính xác</th>
                      <th className="px-8 py-5 text-center">Điểm MAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groupedData[selectedCourse].slice().reverse().map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="px-8 py-5 font-bold text-gray-400">#{item.attemptIndex}</td>
                        <td className="px-8 py-5 font-bold text-gray-700">{item.doc_id === 0 ? "Diagnostic Test (Đầu vào)" : item.lesson_name}</td>
                        <td className="px-8 py-5 text-center font-mono text-gray-500">{item.accuracy}%</td>
                        <td className="px-8 py-5 text-center font-black text-blue-600 bg-blue-50/50">{item.final_score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-4xl mb-4">👈</span>
              <p className="italic">Hãy chọn một môn học để xem phân tích chi tiết.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}