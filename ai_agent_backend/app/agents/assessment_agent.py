import json
import logging
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger("AI_MAS_System.AssessmentAgent")

class AssessmentAgent:
    def __init__(self):
        # Khởi tạo kết nối với Gemini phiên bản mới nhất
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        # Sử dụng model Gemini 2.5 Flash vì nó nhanh và cực kỳ thông minh trong việc xử lý JSON
        self.model_id = "gemini-2.5-flash"
    # ---> THÊM HÀM MỚI NÀY VÀO TRONG CLASS AssessmentAgent <---
    def generate_lesson_quiz(self, theory_content: str, level: str) -> list:
        """
        Assessment Agent: Nhận lý thuyết đã được cá nhân hóa từ Adaptive Agent,
        sau đó sinh ra 5 câu Quiz bám sát đúng nội dung đó.
        """
        logger.info(f"Assessment Agent đang sinh Quiz cho bài học (Level: {level})...")

        prompt = f"""
        Dựa vào nội dung bài giảng lý thuyết dưới đây, hãy tạo một bài kiểm tra ngắn gồm ĐÚNG 5 câu hỏi trắc nghiệm.
        Độ khó của câu hỏi phải phù hợp với trình độ: {level}.
        
        NỘI DUNG BÀI GIẢNG LÝ THUYẾT:
        {theory_content[:10000]}

        ĐỊNH DẠNG JSON TRẢ VỀ CHÍNH XÁC:
        [
            {{
                "id": 1,
                "question": "Nội dung câu hỏi?",
                "options": ["A. Lựa chọn", "B. Lựa chọn", "C. Lựa chọn", "D. Lựa chọn"],
                "correctAnswer": "B. Lựa chọn"
            }}
        ]
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3, 
                ),
            )
            
            # Xử lý dọn dẹp Markdown rác nếu có
            raw_text = response.text.strip()
            if raw_text.startswith("```json"): raw_text = raw_text[7:]
            elif raw_text.startswith("```"): raw_text = raw_text[3:]
            if raw_text.endswith("```"): raw_text = raw_text[:-3]
                
            import json
            quiz_data = json.loads(raw_text.strip())
            logger.info("Assessment Agent đã sinh xong 5 câu Quiz!")
            return quiz_data

        except Exception as e:
            logger.error(f"Lỗi Assessment Agent sinh Quiz: {str(e)}")
            raise e
    def generate_diagnostic_test(self, content_text: str) -> list:
        """
        Agent này chuyên sinh đề kiểm tra đầu vào (Diagnostic Test).
        Dựa vào nội dung tài liệu, nó sẽ tạo ra 10 câu hỏi trắc nghiệm để phân loại học viên.
        """
        logger.info("Assessment Agent đang nhờ Gemini sinh đề Diagnostic Test...")

        prompt = f"""
        Bạn là một chuyên gia khảo thí giáo dục. Dựa vào nội dung tài liệu học tập dưới đây, 
        hãy tạo một bài kiểm tra chẩn đoán (Diagnostic Test) gồm đúng 10 câu hỏi trắc nghiệm.
        
        Yêu cầu phân bổ độ khó để phân loại học sinh:
        - 3 câu Dễ (Mức độ Nhận biết - Dành cho người mới).
        - 4 câu Trung bình (Mức độ Thông hiểu - Dành cho người có chút nền tảng).
        - 3 câu Khó (Mức độ Vận dụng - Dành cho người giỏi).

        NỘI DUNG TÀI LIỆU:
        {content_text[:15000]} # Giới hạn ký tự để tránh vượt quá context window nếu file quá dài

        TRẢ VỀ ĐỊNH DẠNG JSON MẢNG (Array) CHÍNH XÁC NHƯ SAU, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO KHÁC:
        [
            {{
                "id": 1,
                "question": "Nội dung câu hỏi 1?",
                "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
                "correctAnswer": "A. Lựa chọn 1"
            }},
            ... (tiếp tục cho đến câu 10)
        ]
        Chú ý: Trường 'correctAnswer' phải khớp hoàn toàn với một trong các chuỗi trong mảng 'options'.
        """

        try:
            # Gọi Gemini API ép kiểu trả về JSON
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2, # Hạ nhiệt độ xuống thấp để AI tập trung làm bài thi chính xác, không "sáng tạo" lan man
                ),
            )
            
            # Parse chuỗi JSON Gemini trả về thành List (mảng) trong Python
            quiz_data = json.loads(response.text)
            logger.info("Đã sinh xong 10 câu hỏi Diagnostic Test thành công!")
            return quiz_data

        except Exception as e:
            logger.error(f"Lỗi khi Assessment Agent gọi Gemini: {str(e)}")
            # Trả về dữ liệu backup nếu AI lỗi (để hệ thống không bị sập)
            return [
                 {
                    "id": 1,
                    "question": "Lỗi hệ thống AI. Vui lòng thử lại sau.",
                    "options": ["A. Lỗi", "B. Lỗi", "C. Lỗi", "D. Lỗi"],
                    "correctAnswer": "A. Lỗi"
                 }
            ]

# Khởi tạo một instance duy nhất để dùng chung cho toàn bộ app
assessment_agent = AssessmentAgent()