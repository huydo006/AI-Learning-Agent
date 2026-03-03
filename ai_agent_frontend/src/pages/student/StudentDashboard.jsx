import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import documentApi from "../../api/documentApi";

// Tạm hardcode user để test luồng DB
const CURRENT_USER = "hs01"; 

export default function StudentDashboard() {
  const navigate = useNavigate(); 

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseLevels, setCourseLevels] = useState({});

  // States cho Modal làm bài test
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testCourse, setTestCourse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); 
  const [quizData, setQuizData] = useState([]); 
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Tách biệt API để tránh lỗi đồng loạt khi Progress bị 404
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Lấy danh sách môn học
        const docsData = await documentApi.getDocuments();
        setLessons(docsData.data || docsData);

        // 2. Lấy hạng thành viên (Nếu 404 thì bỏ qua, hiện mặc định)
        try {
          const progressData = await documentApi.getProgress(CURRENT_USER);
          setCourseLevels(progressData.data || progressData); 
        } catch (err) {
          console.warn("Chưa có dữ liệu tiến độ cho user này.");
        }
      } catch (error) {
        console.error("Lỗi nghiêm trọng khi tải dữ liệu môn học:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const groupedCourses = lessons.reduce((acc, lesson) => {
    const courseName = (lesson.course_name || "Môn học khác").trim();
    if (!acc[courseName]) acc[courseName] = [];
    acc[courseName].push(lesson);
    return acc;
  }, {});

  const handleStartCourse = async (courseName) => {
    const level = courseLevels[courseName];
    if (!level) {
      setTestCourse(courseName);
      setIsTestModalOpen(true); 
      setIsGenerating(true); 
      
      try {
        const response = await documentApi.generateDiagnosticTest(courseName);
        setQuizData(response.data); 
        setAnswers({});
        setCurrentQuestionIndex(0);
        setIsSubmitted(false);
        setShowErrors(false);
      } catch (error) {
        console.error("Lỗi AI:", error);
        alert("⚠️ Lỗi gọi AI sinh đề!");
        setIsTestModalOpen(false);
      } finally {
        setIsGenerating(false); 
      }
    } else {
      const firstLesson = groupedCourses[courseName][0]; 
      if (firstLesson) {
        navigate(`/student/lesson/${firstLesson.id}`, { state: { level } });
      } else {
        alert("Chưa có bài học nào cho môn này!");
      }
    }
  };

  const handleOptionSelect = (qId, option) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
    setShowErrors(false);
  };

  const handleSubmitTest = () => {
    const unansweredCount = quizData.filter(q => !answers[q.id]).length;
    setShowErrors(true); 

    if (unansweredCount > 0) {
      if (!window.confirm(`⚠️ Bạn còn ${unansweredCount} câu chưa làm.`)) return; 
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true); 
      const correctCount = quizData.filter(q => answers[q.id] === q.correctAnswer).length;
      alert(`✅ Đã nộp bài thành công! Đúng: ${correctCount} / ${quizData.length}.`);
    }, 1000);
  };

  const handleCloseAndSave = async () => {
    setIsTestModalOpen(false);
    const correctCount = quizData.filter(q => answers[q.id] === q.correctAnswer).length;
    const totalQ = quizData.length;

    try {
      const response = await documentApi.saveProgress(CURRENT_USER, testCourse, correctCount, totalQ);
      const aiCalculatedLevel = response?.data?.level || response?.level; 
      if (!aiCalculatedLevel) throw new Error("Không trích xuất được level");
      setCourseLevels(prev => ({ ...prev, [testCourse]: aiCalculatedLevel }));
      alert(`🎉 Đã đánh giá xong! Mức độ: ${aiCalculatedLevel}`);
    } catch (error) {
      console.error("Lỗi Profiling Agent:", error);
    }
  };

  const currentQ = quizData[currentQuestionIndex];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[500px] relative">
      
      {/* HEADER ĐÃ LƯỢC BỎ THANH TAB */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          🚀 Khóa học của bạn
        </h2>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20 animate-pulse font-medium">Đang đồng bộ dữ liệu hệ thống...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {Object.keys(groupedCourses).map((courseName, index) => {
            const level = courseLevels[courseName];
            return (
              <div key={index} className="border border-gray-200 bg-gray-50 p-6 rounded-2xl flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition transform hover:-translate-y-1">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </div>
                    {level ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase">Hạng: {level}</span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200 uppercase tracking-tighter">Mới đăng ký</span>
                    )}
                  </div>
                  <h3 className="font-bold text-xl text-gray-800">{courseName}</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {level ? "Hệ thống MAS đã cá nhân hóa nội dung cho trình độ của bạn." : "Vui lòng làm bài test để AI Agent xếp hạng năng lực phù hợp."}
                  </p>
                </div>
                <button 
                  onClick={() => handleStartCourse(courseName)}
                  className={`w-full py-3 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center ${level ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  <span>{level ? "🚀 Tiếp tục lộ trình" : "📝 Làm test chẩn đoán"}</span>
                </button>
              </div>
            );
          })}
          {Object.keys(groupedCourses).length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 italic">
              Hiện chưa có tài liệu nào. Vui lòng nhờ giáo viên upload PDF nhé!
            </div>
          )}
        </div>
      )}

      {/* --- MODAL LÀM BÀI TEST CHẨN ĐOÁN --- */}
      {isTestModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-zoomIn">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">📝 Diagnostic: {testCourse}</h3>
              <button onClick={() => isSubmitted ? handleCloseAndSave() : setIsTestModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <h3 className="font-bold text-gray-700">AI MAS đang đọc tài liệu...</h3>
              </div>
            ) : (
              quizData.length > 0 && currentQ && (
                <div className="flex flex-1 overflow-hidden">
                  <div className="w-1/4 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
                    <div className="grid grid-cols-4 gap-2">
                      {quizData.map((q, idx) => {
                        let tabColor = "bg-white border-gray-300 text-gray-600"; 
                        if (isSubmitted) {
                          tabColor = answers[q.id] === q.correctAnswer ? "bg-green-500 text-white" : "bg-red-500 text-white";
                        } else if (answers[q.id]) {
                          tabColor = "bg-blue-500 text-white";
                        } else if (currentQuestionIndex === idx) {
                          tabColor = "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200";
                        }
                        return (
                          <button key={q.id} onClick={() => setCurrentQuestionIndex(idx)} className={`w-10 h-10 rounded-lg border font-bold text-xs transition flex items-center justify-center ${tabColor}`}>
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="w-3/4 p-8 overflow-y-auto flex flex-col">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-800 mb-6">{currentQ.question}</h2>
                      <div className="space-y-4">
                        {currentQ.options.map((opt, i) => (
                          <label key={i} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition ${answers[currentQ.id] === opt ? "bg-blue-50 border-blue-500 font-bold" : "bg-white border-gray-200"}`}>
                            <input type="radio" name={`question_${currentQ.id}`} checked={answers[currentQ.id] === opt} onChange={() => handleOptionSelect(currentQ.id, opt)} disabled={isSubmitted} className="w-5 h-5 text-blue-600 mr-4" />
                            <span className="text-lg">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
                      <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} className="px-5 py-2 rounded-lg bg-gray-100 text-gray-600">← Trước</button>
                      {!isSubmitted ? (
                        currentQuestionIndex === quizData.length - 1 ? (
                          <button onClick={handleSubmitTest} className="px-8 py-2.5 rounded-lg bg-green-500 text-white font-bold">Nộp bài</button>
                        ) : (
                          <button onClick={() => setCurrentQuestionIndex(prev => Math.min(quizData.length - 1, prev + 1))} className="px-5 py-2 rounded-lg bg-blue-600 text-white">Tiếp theo →</button>
                        )
                      ) : (
                        <button onClick={handleCloseAndSave} className="px-8 py-2.5 rounded-lg bg-blue-600 text-white font-bold">Hoàn tất & Lưu</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}