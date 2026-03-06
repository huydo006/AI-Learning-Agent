import { useEffect, useState, useRef } from "react"; 
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import documentApi from "../../api/documentApi";

export default function LessonDetail() {
  // 1. 🛠️ FIX QUAN TRỌNG: Đưa việc lấy User vào BÊN TRONG component
  // Để mỗi lần trang render, nó sẽ lấy đúng dữ liệu mới nhất từ localStorage
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const CURRENT_USER = storedUser?.username;

  const { docId } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy trình độ từ Dashboard truyền sang
  const level = location.state?.level || "Beginner"; 

  const [loading, setLoading] = useState(true);
  const [lessonData, setLessonData] = useState(null);

  // States cho bài Quiz
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  // STATES CHO GIAI ĐOẠN 3: ĐÁNH GIÁ (MAS EVALUATION)
  const [timeSpent, setTimeSpent] = useState(0); // Đo lường Effort
  const [retryCount, setRetryCount] = useState(0); // Đo lường Progress
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null); 

  const isFetching = useRef(false);

  // 2. Kiểm tra quyền truy cập: Nếu chưa đăng nhập thì đẩy về trang Login
  useEffect(() => {
    if (!CURRENT_USER) {
      alert("Hết phiên làm việc, vui lòng đăng nhập lại!");
      navigate("/login");
    }
  }, [CURRENT_USER, navigate]);

  // 3. Tải nội dung bài học từ Adaptive Agent
  useEffect(() => {
    fetchAdaptiveLesson();
  }, [docId]); 

  // 4. Đồng hồ đếm giây đo lường nỗ lực (Effort tracking)
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
    if (isFetching.current) return;
    try {
      isFetching.current = true;
      setLoading(true);
      
      const response = await documentApi.generateLesson(docId, level);
      setLessonData(response.data); 
      
      setAnswers({});
      setIsSubmitted(false);
      setEvaluation(null);
      setScore(0);
    } catch (error) {
      console.error("Lỗi Adaptive Agent:", error);
      alert("Không thể soạn bài học. Vui lòng kiểm tra lại Backend!");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleOptionSelect = (qId, option) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  // 5. Nộp bài và gọi Evaluation Agent
  const handleSubmitQuiz = async () => {
    const unansweredCount = lessonData.quiz.filter(q => !answers[q.id]).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`Bạn còn ${unansweredCount} câu chưa làm. Tiếp tục nộp?`)) return;
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

      // Thông báo thăng hạng cho User
      if (evalData.new_level && evalData.new_level !== lessonData.level_applied) {
        alert(`🎉 Chúc mừng ${CURRENT_USER}! Bạn đã thăng hạng lên ${evalData.new_level}`);
      }

    } catch (error) {
      console.error("Lỗi Evaluation Agent:", error);
      alert("Kết nối lỗi, nhưng bạn vẫn có thể xem đáp án.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextAction = () => {
    if (evaluation?.is_mastered) {
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
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Adaptive Agent đang soạn bài cho {CURRENT_USER || "bạn"}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-blue-600 flex items-center transition font-medium">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Quay lại Dashboard
        </button>
        <div className="flex space-x-3 items-center">
          {!isSubmitted && (
            <span className="flex items-center bg-white border border-gray-200 px-3 py-1 rounded-lg text-xs font-mono text-gray-600 shadow-sm">
              <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {formatTime(timeSpent)}
            </span>
          )}
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 uppercase">
            Hạng: {lessonData.level_applied}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        {/* NỘI DUNG BÀI HỌC (TRÁI) */}
        <div className="lg:w-7/12 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center shrink-0">
            <h2 className="font-bold text-lg truncate">📖 {lessonData.lesson_name}</h2>
            <span className="text-[10px] bg-white/20 px-2 py-1 rounded-md uppercase tracking-wider font-bold">Adaptive Content</span>
          </div>
          <div className="p-6 overflow-y-auto prose prose-blue prose-sm max-w-none flex-1 custom-scrollbar">
            <ReactMarkdown>{lessonData.theory}</ReactMarkdown>
          </div>
        </div>

        {/* QUIZ & ĐÁNH GIÁ (PHẢI) */}
        <div className="lg:w-5/12 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
            <h2 className="font-bold text-gray-800 text-lg">⚡ Luyện tập củng cố</h2>
            {isSubmitted && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${score >= lessonData.quiz.length * 0.7 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Đúng: {score}/{lessonData.quiz.length}
              </span>
            )}
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 pb-24">
            
            {/* 🛠️ FIX: NHẬN XÉT CỦA EVALUATION AGENT (Đã trả lại form to đẹp) */}
            {isSubmitted && evaluation?.message && (
              <div className={`p-4 rounded-xl border-l-4 shadow-sm animate-fadeIn ${evaluation.is_mastered ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-500'}`}>
                <p className={`text-sm italic leading-relaxed ${evaluation.is_mastered ? 'text-green-800' : 'text-orange-800'}`}>
                  " {evaluation.message} "
                </p>
              </div>
            )}

            {/* BẢNG ĐIỂM ĐA CHIỀU MAS */}
            {isSubmitted && evaluation?.eval_details && (
              <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm animate-fadeIn">
                <h4 className="text-[10px] font-bold text-center text-gray-700 uppercase tracking-widest mb-3 border-b pb-2">Bảng Điểm Toàn Diện (MAS)</h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <p className="text-[10px] text-gray-500 mb-1">Test (50%)</p>
                    <p className="font-bold text-blue-700 text-base">{evaluation.eval_details.test_score}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <p className="text-[10px] text-gray-500 mb-1">Effort (30%)</p>
                    <p className="font-bold text-purple-700 text-base">{evaluation.eval_details.effort_score}</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <p className="text-[10px] text-gray-500 mb-1">Progress (20%)</p>
                    <p className="font-bold text-orange-700 text-base">{evaluation.eval_details.progress_score}</p>
                  </div>
                  <div className={`p-2 rounded-lg border-2 ${evaluation.is_mastered ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                    <p className="text-[10px] text-gray-500 font-bold mb-1">FINAL</p>
                    <p className={`font-black text-xl ${evaluation.is_mastered ? 'text-green-600' : 'text-red-600'}`}>{evaluation.eval_details.final_score}</p>
                  </div>
                </div>
              </div>
            )}

            {/* QUIZ LIST */}
            <div className="space-y-8 pt-2">
              {lessonData.quiz.map((q, idx) => (
                <div key={q.id} className="bg-white">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">
                    <span className="text-blue-600 mr-1">{idx + 1}.</span> {q.question}
                  </h3>
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      let btnStyle = "border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer";
                      if (isSubmitted) {
                        if (opt === q.correctAnswer) btnStyle = "bg-green-50 border-green-500 text-green-700 font-bold";
                        else if (answers[q.id] === opt) btnStyle = "bg-red-50 border-red-500 text-red-700";
                        else btnStyle = "border-gray-100 text-gray-400 opacity-60";
                      } else if (answers[q.id] === opt) {
                        btnStyle = "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 font-medium";
                      }
                      return (
                        <label key={i} className={`flex items-start p-3 rounded-xl border transition ${btnStyle}`}>
                          <input 
                            type="radio" 
                            name={`quiz_${q.id}`} 
                            value={opt} 
                            checked={answers[q.id] === opt} 
                            onChange={() => handleOptionSelect(q.id, opt)} 
                            disabled={isSubmitted} 
                            className="mt-1 mr-3 text-blue-600 shrink-0 cursor-pointer" 
                          />
                          <span className="text-sm leading-tight">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            {!isSubmitted ? (
              <button onClick={handleSubmitQuiz} disabled={isEvaluating} className={`w-full py-3 text-white font-bold rounded-xl transition shadow-md ${isEvaluating ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isEvaluating ? "Agent đang phân tích..." : "Nộp bài & Chấm điểm MAS"}
              </button>
            ) : (
              <button onClick={handleNextAction} className={`w-full flex items-center justify-center py-3 rounded-xl text-white font-bold shadow-md transition animate-fadeIn ${evaluation?.is_mastered ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                {evaluation?.is_mastered ? (
                  <>Tiếp tục lộ trình <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></>
                ) : (
                  "Học lại với phương pháp khác"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}