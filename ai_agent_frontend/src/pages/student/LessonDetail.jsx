import { useEffect, useState, useRef } from "react"; // Thêm useRef
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import documentApi from "../../api/documentApi";

// Tạm hardcode user để test, sau này lấy từ Auth context
const CURRENT_USER = "hs01"; 

export default function LessonDetail() {
  const { docId } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  
  const level = location.state?.level || "Beginner"; 

  const [loading, setLoading] = useState(true);
  const [lessonData, setLessonData] = useState(null);

  // States cho bài Quiz
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  // STATES CHO GIAI ĐOẠN 3: ĐÁNH GIÁ (EVALUATION)
  const [timeSpent, setTimeSpent] = useState(0); // Đếm số giây học tập thực tế
  const [retryCount, setRetryCount] = useState(0); // Đếm số lần học lại để tính điểm tiến bộ
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null); 

  // BIẾN KHÓA CHẶN RACE CONDITION (FIX LỖI RELOAD)
  const isFetching = useRef(false);

  // TẢI NỘI DUNG BÀI HỌC - CHỈ THEO DÕI docId
  useEffect(() => {
    fetchAdaptiveLesson();
  }, [docId]); // <--- Xóa level khỏi đây để tránh reload khi Level Up

  // ĐỒNG HỒ ĐẾM GIÂY CHẠY NGẦM ĐỂ ĐO LƯỜNG NỖ LỰC (EFFORT)
  useEffect(() => {
    let timer;
    if (!loading && !isSubmitted) {
      timer = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading, isSubmitted]);

  const fetchAdaptiveLesson = async () => {
    // Nếu đang có một yêu cầu chạy rồi thì không chạy thêm cái nữa
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      setLoading(true);
      
      const response = await documentApi.generateLesson(docId, level);
      setLessonData(response.data); 
      
      // Dọn dẹp trạng thái cho phiên học mới
      setAnswers({});
      setIsSubmitted(false);
      setEvaluation(null);
      setScore(0);
    } catch (error) {
      console.error("Lỗi khi tải bài học:", error);
      alert("Hệ thống AI đang gặp sự cố khi soạn bài. Vui lòng thử lại!");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleOptionSelect = (qId, option) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  // NỘP BÀI VÀ GỌI EVALUATION AGENT
  const handleSubmitQuiz = async () => {
    const unansweredCount = lessonData.quiz.filter(q => !answers[q.id]).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`Bạn còn ${unansweredCount} câu chưa làm. Tiếp tục nộp bài?`)) return;
    }

    const correctCount = lessonData.quiz.filter(q => answers[q.id] === q.correctAnswer).length;
    setScore(correctCount);
    setIsSubmitted(true);
    setIsEvaluating(true);

    try {
      const response = await documentApi.submitQuiz(
        CURRENT_USER, 
        docId, 
        correctCount, 
        lessonData.quiz.length,
        timeSpent,
        retryCount
      );
      
      const evalData = response?.data?.data || response?.data || response;
      setEvaluation(evalData); 

    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu đánh giá:", error);
      alert("Không thể kết nối với Evaluation Agent, nhưng bạn vẫn có thể xem đáp án bên dưới.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextAction = () => {
    if (evaluation?.next_action === 'next_lesson') {
      navigate('/student'); 
    } else {
      setRetryCount(prev => prev + 1);
      setTimeSpent(0);
      fetchAdaptiveLesson(); 
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <h2 className="text-xl font-bold text-gray-700">Adaptive Agent đang soạn bài...</h2>
      </div>
    );
  }

  if (!lessonData) return <div className="text-center py-10">Không tìm thấy dữ liệu bài học.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Quay lại Dashboard
        </button>
        <div className="flex items-center space-x-3">
          {!isSubmitted && (
             <span className="flex items-center bg-white px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-xs font-mono shadow-sm">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {formatTime(timeSpent)}
             </span>
          )}
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">Hạng: {lessonData.level_applied}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        
        {/* CỘT TRÁI: NỘI DUNG LÝ THUYẾT */}
        <div className="lg:w-7/12 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center shrink-0">
            <h2 className="font-bold text-lg truncate">📖 {lessonData.lesson_name}</h2>
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded-md uppercase tracking-wider font-bold">Adaptive Content</span>
          </div>
          <div className="p-6 overflow-y-auto prose prose-blue prose-sm max-w-none flex-1 custom-scrollbar">
            <ReactMarkdown>{lessonData.theory}</ReactMarkdown>
          </div>
        </div>

        {/* CỘT PHẢI: MINI QUIZ & ĐÁNH GIÁ */}
        <div className="lg:w-5/12 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-gray-800 text-lg">⚡ Luyện tập củng cố</h2>
            {isSubmitted && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${score >= lessonData.quiz.length * 0.7 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Đúng: {score}/{lessonData.quiz.length}
              </span>
            )}
          </div>

          {/* VÙNG NỘI DUNG CÓ THỂ CUỘN (Scrollable Area) */}
          <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar pb-20">
            
            {/* 1. HIỂN THỊ BẢNG ĐIỂM MAS (Đưa vào vùng cuộn) */}
            {isSubmitted && evaluation?.eval_details && (
              <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm animate-fadeIn">
                <h4 className="font-bold text-center text-gray-700 text-xs mb-3 border-b pb-2 uppercase tracking-widest">Bảng Điểm Toàn Diện (Evaluation Agent)</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-blue-50 p-2 rounded-lg text-center">
                    <div className="text-gray-400 mb-1">Test (50%)</div>
                    <div className="font-bold text-blue-700 text-base">{evaluation.eval_details.test_score}</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg text-center">
                    <div className="text-gray-400 mb-1">Effort (30%)</div>
                    <div className="font-bold text-purple-700 text-base">{evaluation.eval_details.effort_score}</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg text-center">
                    <div className="text-gray-400 mb-1">Progress (20%)</div>
                    <div className="font-bold text-orange-700 text-base">{evaluation.eval_details.progress_score}</div>
                  </div>
                  <div className={`p-2 rounded-lg text-center border-2 ${evaluation.is_mastered ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                    <div className="text-gray-500 font-bold mb-1">FINAL</div>
                    <div className={`font-black text-xl ${evaluation.is_mastered ? 'text-green-600' : 'text-red-600'}`}>{evaluation.eval_details.final_score}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. NHẬN XÉT CỦA GIÁO VIÊN AI (Đưa vào vùng cuộn) */}
            {isSubmitted && evaluation?.message && (
              <div className={`p-4 rounded-xl border-l-4 shadow-sm animate-fadeIn ${evaluation.is_mastered ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'}`}>
                <p className={`text-xs italic leading-relaxed ${evaluation.is_mastered ? 'text-green-800' : 'text-orange-800'}`}>
                  " {evaluation.message} "
                </p>
              </div>
            )}

            {/* 3. DANH SÁCH CÂU HỎI QUIZ */}
            <div className="space-y-8 pt-4">
                {lessonData.quiz.map((q, index) => (
                  <div key={q.id} className="bg-white">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm md:text-base">
                      <span className="text-blue-600 mr-1">{index + 1}.</span> {q.question}
                    </h3>
                    <div className="space-y-2">
                      {q.options.map((opt, i) => {
                        let style = "border-gray-200 hover:bg-gray-50 text-gray-600";
                        if (isSubmitted) {
                          if (opt === q.correctAnswer) style = "bg-green-50 border-green-500 text-green-700 font-bold";
                          else if (answers[q.id] === opt) style = "bg-red-50 border-red-500 text-red-700";
                          else style = "border-gray-100 text-gray-400 opacity-60";
                        } else if (answers[q.id] === opt) {
                          style = "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 font-medium";
                        }
                        return (
                          <label key={i} className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${style}`}>
                            <input type="radio" name={`quiz_${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => handleOptionSelect(q.id, opt)} disabled={isSubmitted} className="mt-1 mr-3 text-blue-600 shrink-0" />
                            <span className="text-sm leading-tight">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* CHÂN TRANG CỐ ĐỊNH: CHỈ CHỨA NÚT BẤM CHÍNH */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            {!isSubmitted ? (
              <button onClick={handleSubmitQuiz} disabled={isEvaluating} className={`w-full py-3 text-white font-bold rounded-xl transition shadow-md ${isEvaluating ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isEvaluating ? "Đang phân tích..." : "Nộp bài & Chấm điểm"}
              </button>
            ) : (
              <button onClick={handleNextAction} className={`w-full py-3 text-white font-bold rounded-xl transition shadow-md flex items-center justify-center animate-fadeIn ${evaluation?.is_mastered ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                {evaluation?.is_mastered ? (<>Tiếp tục lộ trình <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></>) : (<>Học lại với phương pháp khác</>)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}