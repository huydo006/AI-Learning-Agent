from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

# 1. Định nghĩa các Enum (Các giá trị cố định)
class LearnerLevel(str, Enum):
    """Phân loại trình độ học viên"""
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class QuestionType(str, Enum):
    """Mức độ câu hỏi tương ứng với trình độ"""
    RECOGNITION = "Nhận biết, ghi nhớ"
    COMPREHENSION = "Hiểu, giải thích"
    APPLICATION = "Vận dụng, tình huống"

# 2. Schema cho Câu hỏi Trắc nghiệm (Ép AI phải trả về đúng form này)
class Question(BaseModel):
    question_text: str = Field(..., description="Nội dung câu hỏi trắc nghiệm")
    options: List[str] = Field(..., min_items=2, description="Danh sách các đáp án (A, B, C, D)")
    correct_answer: str = Field(..., description="Đáp án đúng (phải trùng khớp với 1 item trong options)")
    explanation: str = Field(..., description="Giải thích chi tiết tại sao đáp án này đúng")
    question_type: QuestionType = Field(..., description="Loại câu hỏi (Nhận biết/Hiểu/Vận dụng)")

# 3. Schema cho Kết quả sinh Câu hỏi của Assessment Agent
class QuizGenerationResponse(BaseModel):
    status: str = Field(default="success")
    learner_level: LearnerLevel
    topic_summary: str = Field(..., description="Tóm tắt ngắn gọn nội dung tài liệu")
    questions: List[Question] = Field(..., description="Danh sách câu hỏi được AI sinh ra")

# 4. Schema cho Đầu vào của Evaluation Agent (Tính điểm)
class EvaluationInput(BaseModel):
    test_score: float = Field(..., ge=0, le=100, description="Điểm bài kiểm tra (0-100)")
    effort_score: float = Field(..., ge=0, le=100, description="Điểm nỗ lực: thời gian, số phiên học")
    progress_score: float = Field(..., ge=0, le=100, description="Điểm tiến bộ qua các lần học")

# 5. Schema cho Kết quả Đánh giá
class EvaluationResult(BaseModel):
    final_score: float = Field(..., description="Điểm tổng hợp tính theo trọng số: 0.5 Test + 0.3 Effort + 0.2 Progress")
    feedback: str = Field(..., description="Nhận xét của hệ thống dành cho học viên")