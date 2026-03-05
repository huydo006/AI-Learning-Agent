from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy import Boolean

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String) # <--- THÊM CỘT NÀY
    full_name = Column(String)
    role = Column(String, default="student") # 'teacher' hoặc 'student'
    current_level = Column(String, default="Beginner") 
    entry_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# (Giữ nguyên bảng LearningHistory như cũ nhé)
class LearningHistory(Base):
    __tablename__ = "learning_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String)
    test_score = Column(Float)
    final_evaluation = Column(Float)
    feedback = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, index=True)
    lesson_name = Column(String)
    file_name = Column(String)
    file_path = Column(String) # Đường dẫn lưu file PDF thật trên ổ cứng
    created_at = Column(DateTime(timezone=True), server_default=func.now())
class StudentProgress(Base):
    __tablename__ = "student_progress"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True) 
    course_name = Column(String, index=True) # Tên môn học
    level = Column(String) # Hạng: Beginner, Intermediate, Advanced
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), default=func.now())
class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True) # Tên học sinh (VD: hs01)
    doc_id = Column(Integer, index=True)  # ID của bài học (file PDF)
    score = Column(Integer)               # Số câu đúng
    total_questions = Column(Integer)     # Tổng số câu
    is_mastered = Column(Boolean, default=False) # Đã qua bài hay chưa (Điểm >= 70%)
    created_at = Column(DateTime(timezone=True), default=func.now())
    final_score = Column(Float, default=0.0) # Thêm cột này để lưu điểm MAS