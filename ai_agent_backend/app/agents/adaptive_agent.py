import logging
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger("AI_MAS_System.AdaptiveAgent")

class AdaptiveAgent:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = "gemini-2.5-flash" 

    def generate_personalized_lesson(self, content_text: str, level: str) -> str:
        """
        Adaptive Agent: Chỉ chịu trách nhiệm cá nhân hóa LÝ THUYẾT (Theory).
        KHÔNG sinh bài tập (Quiz) ở đây để đảm bảo tính Module của MAS.
        """
        logger.info(f"Adaptive Agent đang soạn lý thuyết cho Level: [{level}]...")

        prompt = f"""
        Bạn là một gia sư AI thông minh. Dựa vào nội dung tài liệu gốc dưới đây, hãy thiết kế một bài học lý thuyết phù hợp với trình độ "{level}" của học viên.

        NỘI DUNG TÀI LIỆU GỐC:
        {content_text[:15000]}

        HƯỚNG DẪN CÁ NHÂN HÓA:
        - Beginner: Giải thích đơn giản, dùng ví dụ đời thường, tránh từ ngữ học thuật.
        - Intermediate: Cân bằng lý thuyết và thực tiễn, đi thẳng vấn đề cốt lõi.
        - Advanced: Bỏ qua định nghĩa cơ bản, tập trung phân tích chuyên sâu.

        YÊU CẦU ĐẦU RA BẮT BUỘC:
        Chỉ trả về nội dung bài giảng lý thuyết được viết bằng định dạng Markdown (có tiêu đề `##`, in đậm `**`, danh sách `*`). 
        TUYỆT ĐỐI KHÔNG sinh câu hỏi trắc nghiệm hay trả về định dạng JSON.
        """

        try:
            # Ở đây không ép response_mime_type="application/json" nữa
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                ),
            )
            
            theory_content = response.text.strip()
            logger.info("Adaptive Agent đã soạn xong Lý thuyết cá nhân hóa!")
            return theory_content

        except Exception as e:
            logger.error(f"Lỗi Adaptive Agent: {str(e)}")
            raise e

# Khởi tạo instance
adaptive_agent = AdaptiveAgent()