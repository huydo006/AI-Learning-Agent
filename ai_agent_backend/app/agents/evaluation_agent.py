import logging
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger("AI_MAS_System.EvaluationAgent")

class EvaluationAgent:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = "gemini-2.5-flash"

    def evaluate_student(self, test_score_percent: float, time_spent_seconds: int, retry_count: int) -> dict:
        """
        Evaluation Agent: Đánh giá toàn diện dựa trên Learning Analytics.
        Final Score = 0.5 * Test + 0.3 * Effort + 0.2 * Progress
        """
        logger.info("Evaluation Agent đang phân tích nỗ lực học tập...")

        # 1. Tính Test Score (Thang 100)
        test_score = test_score_percent * 100

        # 2. Tính Effort Score (Dựa vào thời gian học)
        # Giả sử: Học chuẩn 3 phút (180 giây) là đạt 100 điểm nỗ lực. Vượt quá tính tối đa 100.
        effort_score = min((time_spent_seconds / 180) * 100, 100)

        # 3. Tính Progress Score (Dựa vào số lần học lại / phiên học)
        # Lần học đầu tiên (retry=0) -> 100 điểm. Cứ học lại trừ 20 điểm.
        progress_score = max(100 - (retry_count * 20), 0)

        # 4. Tính Final Score tổng hợp
        final_score = (0.5 * test_score) + (0.3 * effort_score) + (0.2 * progress_score)
        
        # Quyết định Qua bài (Mastery): Ngưỡng 70 điểm tổng hợp
        is_mastered = final_score >= 70

        # 5. Sinh lời nhận xét tâm lý (Feedback Loop)
        prompt = f"""
        Bạn là một giáo viên AI tận tâm tên là "Evaluation Agent". Hãy viết MỘT ĐOẠN VĂN NGẮN (2-3 câu) nhận xét học sinh với các dữ liệu sau:
        - Điểm thi: {test_score:.1f}/100
        - Điểm nỗ lực: {effort_score:.1f}/100 (đã học {time_spent_seconds} giây)
        - Điểm tiến bộ: {progress_score:.1f}/100 (số lần thử: {retry_count + 1})
        - Điểm tổng hợp (Final Score): {final_score:.1f}/100
        - Kết quả: {"Đạt (Được qua bài)" if is_mastered else "Chưa đạt (Cần học lại)"}
        
        Yêu cầu:
        - Xưng "Thầy/Cô" và gọi "em".
        - Dùng văn phong gần gũi, khích lệ. 
        - Nếu Test Score thấp nhưng Effort Score cao, hãy ghi nhận sự nỗ lực và an ủi. 
        - TUYỆT ĐỐI KHÔNG giải thích công thức toán học, chỉ đưa ra lời khuyên trực tiếp.
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.6),
            )
            ai_message = response.text.strip()
        except Exception as e:
            logger.error(f"Lỗi Evaluation Agent: {str(e)}")
            ai_message = "Thầy cô ghi nhận sự nỗ lực của em. Hãy tiếp tục cố gắng ở bài sau nhé!"

        return {
            "test_score": round(test_score, 1),
            "effort_score": round(effort_score, 1),
            "progress_score": round(progress_score, 1),
            "final_score": round(final_score, 1),
            "is_mastered": is_mastered,
            "ai_message": ai_message
        }

# Khởi tạo instance
evaluation_agent = EvaluationAgent()