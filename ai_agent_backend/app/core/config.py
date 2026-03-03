import os
from dotenv import load_dotenv

# 1. Bắt buộc hệ thống đọc file .env ở thư mục gốc
load_dotenv()

class Settings:
    # --- Cấu hình Dự án ---
    PROJECT_NAME: str = "AI Agent Learning Platform"
    
    # --- Cấu hình Database (Lấy từ .env, nếu không có thì dùng default localhost) ---
    # Cú pháp: postgresql://username:password@host:port/dbname
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:123456@localhost:5432/ai_learning_db"
    )
    
    # --- Cấu hình AI Agents ---
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        print("⚠️ CẢNH BÁO: Chưa tìm thấy GEMINI_API_KEY trong file .env!")

    # --- Cấu hình Security & Token ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "Sieu_Mat_Khau_123_Khong_Ai_Biet")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 ngày

# Khởi tạo instance để các file khác (main.py, database.py) import vào xài
settings = Settings()