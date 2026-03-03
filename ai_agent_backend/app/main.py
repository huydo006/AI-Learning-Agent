import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings

# --- THÊM IMPORT DATABASE ---
from app.core.database import engine
from app.models import database_models

# 1. Cấu hình Logging chuyên nghiệp
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("AI_MAS_System")

# 2. Quản lý vòng đời (Startup & Shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Khởi động Hệ thống Multi-Agent System (MAS)...")
    
    # TỰ ĐỘNG TẠO BẢNG TRONG DATABASE (Bao gồm bảng Document)
    logger.info("Đang kiểm tra và khởi tạo các bảng trong PostgreSQL...")
    database_models.Base.metadata.create_all(bind=engine)
    logger.info("Khởi tạo Database thành công!")
    
    yield
    logger.info("Hệ thống đang tắt. Đóng các kết nối an toàn...")

# 3. Khởi tạo ứng dụng
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="""
    Hệ thống API hỗ trợ cá nhân hóa chương trình học dựa trên AI Agent.
    Bao gồm 5 Agent cốt lõi: Content, Profiling, Assessment, Adaptive và Evaluation.
    """,
    version="1.0.0",
    lifespan=lifespan,
    contact={
        "name": "huydo006",
        "url": "https://github.com/huydo006",
    }
)

# 4. Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Xử lý lỗi Global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Lỗi hệ thống bất ngờ: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error", 
            "message": "Đã xảy ra lỗi nội bộ hệ thống. Vui lòng thử lại sau.", 
            "details": str(exc)
        },
    )

# 6. Import và gắn các đường dẫn API (Routers)
from app.api import routes
app.include_router(routes.router, prefix="/api/v1", tags=["Multi-Agent Flow"])

@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "success",
        "message": "AI Agent Learning Platform API is running smoothly!",
        "architecture": "Multi-Agent System (MAS)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)