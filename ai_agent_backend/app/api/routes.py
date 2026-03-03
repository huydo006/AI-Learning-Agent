import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

# Import Database & Models
from app.core.database import get_db
from app.models.database_models import Document, StudentProgress, LessonProgress, User 

# Import dàn đệ tử AI (Agents)
from app.agents.content_agent import content_agent
from app.agents.profiling_agent import profiling_agent
from app.agents.assessment_agent import assessment_agent
from app.agents.evaluation_agent import evaluation_agent
from app.agents.adaptive_agent import adaptive_agent
from app.models.schemas import EvaluationInput

logger = logging.getLogger("AI_MAS_System.Routes")
router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==========================================
# KHU VỰC 0: AUTHENTICATION (ĐĂNG NHẬP THẬT)
# ==========================================

@router.post("/auth/login", summary="API Đăng nhập thực tế từ Database")
async def login(
    username: str = Form(..., description="Tên đăng nhập"), 
    password: str = Form(..., description="Mật khẩu"), 
    db: Session = Depends(get_db)
):
    # Tìm user (không phân biệt hoa thường)
    user = db.query(User).filter(func.lower(User.username) == func.lower(username)).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại trên hệ thống!")
    
    if user.password != password:
        raise HTTPException(status_code=401, detail="Mật khẩu không chính xác!")
        
    return {
        "status": "success",
        "user": {
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "level": user.current_level
        }
    }

# ==========================================
# KHU VỰC 1: API DÀNH CHO GIÁO VIÊN (QUẢN LÝ)
# ==========================================

@router.post("/documents", summary="Giáo viên tải lên tài liệu mới")
async def upload_document(
    course_name: str = Form(..., description="Tên môn học"),
    lesson_name: str = Form(..., description="Tên bài học"),
    file: UploadFile = File(..., description="File PDF bài giảng"),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF nhé bro!")

    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_doc = Document(
        course_name=course_name,
        lesson_name=lesson_name,
        file_name=file.filename,
        file_path=file_path
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return {"message": "Tải lên tài liệu thành công!", "data": new_doc}

@router.get("/documents", summary="Lấy danh sách tài liệu")
async def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()

@router.delete("/documents/{doc_id}", summary="Xóa tài liệu")
async def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return {"message": "Đã xóa tài liệu thành công"}

# ==========================================
# KHU VỰC 2: API DÀNH CHO HỌC SINH (AI MAS)
# ==========================================

@router.post("/generate-diagnostic", summary="AI sinh đề Diagnostic Test tổng hợp")
async def create_diagnostic_test_by_course(
    course_name: str = Form(..., description="Tên môn học"),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(Document.course_name == course_name).all()
    if not docs:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy tài liệu cho môn {course_name}")

    try:
        combined_text = ""
        for doc in docs:
            if os.path.exists(doc.file_path):
                combined_text += content_agent.process_document(doc.file_path) + "\n\n"

        if not combined_text.strip():
             raise HTTPException(status_code=400, detail="Không thể trích xuất chữ từ PDF.")

        quiz_data = assessment_agent.generate_diagnostic_test(combined_text)
        return {"status": "success", "data": quiz_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-lesson/{doc_id}", summary="Học sinh học bài cá nhân hóa")
async def generate_student_lesson(
    doc_id: int,
    level: str = Form(..., description="Trình độ"),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại!")

    try:
        text_content = content_agent.process_document(doc.file_path)
        theory_content = adaptive_agent.generate_personalized_lesson(text_content, level)
        quiz_data = assessment_agent.generate_lesson_quiz(theory_content, level)

        return {
            "status": "success",
            "data": {
                "course_name": doc.course_name,
                "lesson_name": doc.lesson_name,
                "level_applied": level,
                "theory": theory_content,
                "quiz": quiz_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# KHU VỰC 3: QUẢN LÝ TIẾN ĐỘ & LỊCH SỬ
# ==========================================

@router.post("/progress", summary="Lưu kết quả test đầu vào & Khởi tạo biểu đồ")
async def save_student_progress(
    username: str = Form(...),
    course_name: str = Form(...),
    score: int = Form(...),
    total_questions: int = Form(...),
    db: Session = Depends(get_db)
):
    level = profiling_agent.evaluate_diagnostic_score(score, total_questions)

    progress = db.query(StudentProgress).filter(
        StudentProgress.username == username,
        StudentProgress.course_name == course_name
    ).first()

    if progress:
        progress.level = level
    else:
        progress = StudentProgress(username=username, course_name=course_name, level=level)
        db.add(progress)
    
    accuracy = round((score / total_questions) * 100, 1) if total_questions > 0 else 0
    diagnostic_history = LessonProgress(
        username=username,
        doc_id=0, 
        score=score,
        total_questions=total_questions,
        is_mastered=True,
        final_score=accuracy 
    )
    db.add(diagnostic_history)
    db.commit()
    
    return {"status": "success", "level": level}

# ---> ĐÃ THÊM: ENDPOINT LẤY HẠNG (LEVEL) ĐANG BỊ THIẾU <---
@router.get("/progress/{username}", summary="Lấy toàn bộ hạng của một học sinh")
async def get_student_progress(username: str, db: Session = Depends(get_db)):
    """
    Giúp Frontend lấy hạng (Beginner/Intermediate/Advanced) của từng môn.
    """
    progress_list = db.query(StudentProgress).filter(StudentProgress.username == username).all()
    result = {p.course_name: p.level for p in progress_list}
    return result

@router.get("/history/{username}", summary="Lấy lịch sử học tập phân loại theo môn")
async def get_learning_history(username: str, db: Session = Depends(get_db)):
    history = db.query(LessonProgress).filter(
        LessonProgress.username == username
    ).order_by(LessonProgress.created_at.asc()).all()
    
    result = []
    for record in history:
        if record.doc_id == 0:
            lesson_name = "Diagnostic Test (Đầu vào)"
            # Tinh chỉnh logic: Lấy môn học đầu tiên cho user (hoặc môn có progress sớm nhất)
            progress_sample = db.query(StudentProgress).filter(StudentProgress.username == username).first()
            course_name = progress_sample.course_name if progress_sample else "N/A"
        else:
            doc = db.query(Document).filter(Document.id == record.doc_id).first()
            lesson_name = doc.lesson_name if doc else "Bài học đã xóa"
            course_name = doc.course_name if doc else "N/A"

        result.append({
            "course_name": course_name,
            "lesson_name": lesson_name,
            "score": record.score,
            "total": record.total_questions,
            "accuracy": round((record.score / record.total_questions) * 100, 1) if record.total_questions > 0 else 0,
            "final_score": record.final_score,
            "is_mastered": record.is_mastered,
            "date": record.created_at.strftime("%d/%m")
        })
    return result

@router.post("/submit-quiz", summary="Chấm điểm đa tác tử & Lưu kết quả MAS")
async def submit_quiz(
    username: str = Form(...),
    doc_id: int = Form(...),
    score: int = Form(...),
    total_questions: int = Form(...),
    time_spent: int = Form(0),
    retry_count: int = Form(0),
    db: Session = Depends(get_db)
):
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Không tìm thấy bài học")

        test_accuracy = score / total_questions if total_questions > 0 else 0
        eval_result = evaluation_agent.evaluate_student(
            test_score_percent=test_accuracy,
            time_spent_seconds=time_spent,
            retry_count=retry_count
        )
        final_score = eval_result["final_score"]
        is_mastered = eval_result["is_mastered"]

        progress = db.query(StudentProgress).filter(
            StudentProgress.username == username,
            StudentProgress.course_name == doc.course_name
        ).first()

        if progress:
            old_level = progress.level
            new_level = profiling_agent.update_level_after_lesson(old_level, final_score)
            if new_level != old_level:
                progress.level = new_level
                eval_result["ai_message"] += f" 🎉 Chúc mừng em đã xuất sắc nâng hạng lên {new_level}!"

        progress_record = LessonProgress(
            username=username,
            doc_id=doc_id,
            score=score,
            total_questions=total_questions,
            is_mastered=is_mastered,
            final_score=final_score 
        )
        db.add(progress_record)
        db.commit()

        return {
            "status": "success",
            "data": {
                "score": score,
                "total": total_questions,
                "eval_details": eval_result,
                "is_mastered": is_mastered,
                "message": eval_result["ai_message"],
                "next_action": "next_lesson" if is_mastered else "learn_again"
            }
        }
    except Exception as e:
        logger.error(f"Lỗi nộp bài: {str(e)}")
        raise HTTPException(status_code=500, detail="Lỗi hệ thống khi lưu kết quả")