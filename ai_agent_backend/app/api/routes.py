import os
import shutil
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel 

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

# --- ✨ SCHEMAS ĐỂ ĐỒNG BỘ DỮ LIỆU JSON (FIX LỖI 422) ---
class UserSchema(BaseModel):
    full_name: str
    username: str
    password: str
    role: str = "student"

class LoginSchema(BaseModel):
    username: str
    password: str

# ==========================================
# KHU VỰC 0: AUTHENTICATION & QUẢN TRỊ USER
# ==========================================

# ✅ SỬA LỖI 422 & LOGIN: Chuyển sang nhận JSON Body
@router.post("/auth/login", summary="API Đăng nhập thực tế")
async def login(
    login_data: LoginSchema, 
    db: Session = Depends(get_db)
):
    # Tìm user không phân biệt hoa thường
    user = db.query(User).filter(
        func.lower(User.username) == func.lower(login_data.username.strip())
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Tài khoản không tồn tại trên hệ thống!")
    
    # Kiểm tra mật khẩu trực tiếp (theo yêu cầu quản trị của cậu)
    if user.password != login_data.password:
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

# ✅ TẠO TÀI KHOẢN MỚI (Dùng JSON)
@router.post("/auth/register", summary="Giáo viên tạo tài khoản mới")
async def register(
    user_data: UserSchema, 
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(func.lower(User.username) == func.lower(user_data.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tên tài khoản này đã tồn tại!")

    new_user = User(
        full_name=user_data.full_name,
        username=user_data.username,
        password=user_data.password, 
        role=user_data.role,
        current_level="Beginner"
    )
    try:
        db.add(new_user)
        db.commit()
        return {"status": "success", "message": "Đã tạo tài khoản thành công!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ✅ LẤY TẤT CẢ TÀI KHOẢN (GV & SV) KÈM MẬT KHẨU
@router.get("/users/all", summary="Xem toàn bộ tài khoản hệ thống")
async def get_all_users(db: Session = Depends(get_db)):
    # Trả về tất cả mọi người để giáo viên quản lý
    users = db.query(User).order_by(User.role.desc(), User.username.asc()).all()
    return users 

# ✅ CẬP NHẬT THÔNG TIN TÀI KHOẢN
@router.put("/users/{user_id}", summary="Sửa thông tin thành viên")
async def update_user(
    user_id: int,
    user_data: UserSchema,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    
    user.full_name = user_data.full_name
    user.username = user_data.username
    user.password = user_data.password
    user.role = user_data.role
    try:
        db.commit()
        return {"status": "success", "message": "Cập nhật thành công"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ✅ XÓA VĨNH VIỄN TÀI KHOẢN
@router.delete("/users/{user_id}", summary="Xóa tài khoản")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        try:
            db.delete(user)
            db.commit()
            return {"status": "success"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

# ==========================================
# KHU VỰC 1: API DÀNH CHO GIÁO VIÊN (TÀI LIỆU)
# ==========================================

@router.get("/users/students")
async def get_all_students(db: Session = Depends(get_db)):
    students = db.query(User).filter(
        func.lower(func.trim(User.role)) == "student"
    ).all()  
    
    rev_level_map = {1: "Beginner", 2: "Intermediate", 3: "Advanced"}
    result = []
    for s in students:
        history = db.query(LessonProgress).filter(LessonProgress.username == s.username).all()
        
        if history:
            total_points = sum([3 if r.final_score >= 80 else 2 if r.final_score >= 50 else 1 for r in history])
            avg_val = round(total_points / len(history))
            display_level = rev_level_map.get(avg_val, "Beginner")
        else:
            display_level = s.current_level or "Beginner"

        result.append({
            "id": s.id,
            "full_name": s.full_name,
            "username": s.username,
            "password" : s.password,
            "current_level": display_level, 
            "created_at": s.created_at.strftime("%d/%m/%Y") if s.created_at else "N/A"
        })
    return result

@router.post("/documents", summary="Giáo viên tải lên tài liệu mới")
async def upload_document(
    course_name: str = Form(...),
    lesson_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF nhé bro!")

    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    new_doc = Document(course_name=course_name, lesson_name=lesson_name, file_name=file.filename, file_path=file_path)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return {"message": "Tải lên tài liệu thành công!", "data": new_doc}

@router.get("/documents")
async def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if doc:
        if os.path.exists(doc.file_path): os.remove(doc.file_path)
        db.delete(doc)
        db.commit()
        return {"message": "Đã xóa tài liệu"}
    raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")


# ==========================================
# KHU VỰC 2: API DÀNH CHO HỌC SINH (AI MAS)
# ==========================================

@router.post("/generate-diagnostic")
async def create_diagnostic_test_by_course(course_name: str = Form(...), db: Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.course_name == course_name).all()
    if not docs: raise HTTPException(status_code=404, detail="Không có tài liệu cho môn này")
    try:
        combined_text = ""
        for doc in docs:
            if os.path.exists(doc.file_path):
                combined_text += content_agent.process_document(doc.file_path) + "\n\n"
        quiz_data = assessment_agent.generate_diagnostic_test(combined_text)
        return {"status": "success", "data": quiz_data}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-lesson/{doc_id}")
async def generate_student_lesson(doc_id: int, level: str = Form(...), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc: raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
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
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# KHU VỰC 3: QUẢN LÝ TIẾN ĐỘ & LỊCH SỬ
# ==========================================

@router.post("/progress")
async def save_student_progress(
    username: str = Form(...), 
    course_name: str = Form(...), 
    score: int = Form(...), 
    total_questions: int = Form(...), 
    db: Session = Depends(get_db)
):
    level = profiling_agent.evaluate_diagnostic_score(score, total_questions)
    progress = db.query(StudentProgress).filter(StudentProgress.username == username, StudentProgress.course_name == course_name).first()
    if progress: 
        progress.level = level
    else:
        db.add(StudentProgress(username=username, course_name=course_name, level=level))
    
    user = db.query(User).filter(User.username == username).first()
    if user: 
        user.current_level = level
        
    accuracy = round((score / total_questions) * 100, 1) if total_questions > 0 else 0
    db.add(LessonProgress(username=username, doc_id=0, score=score, total_questions=total_questions, is_mastered=True, final_score=accuracy))
    
    try:
        db.commit()
        return {"status": "success", "level": level}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/progress/{username}")
async def get_student_progress(username: str, db: Session = Depends(get_db)):
    progress_list = db.query(StudentProgress).filter(StudentProgress.username == username).all()
    return {p.course_name: p.level for p in progress_list}

# ✅ FIX LỖI NHÂN BẢN DỮ LIỆU (JOIN)
@router.get("/history/{username}")
async def get_learning_history(username: str, db: Session = Depends(get_db)):
    search_username = username.strip().lower()
    
    # Chỉ JOIN với Document, tránh JOIN StudentProgress để không bị lặp ID
    query = db.query(
        LessonProgress, 
        Document.course_name, 
        Document.lesson_name
    ).outerjoin(Document, LessonProgress.doc_id == Document.id)\
     .filter(func.lower(LessonProgress.username) == search_username)\
     .order_by(LessonProgress.created_at.asc())

    records = query.all()
    
    result = []
    for lp, c_name, l_name in records:
        actual_course = c_name
        if lp.doc_id == 0:
            prog = db.query(StudentProgress).filter(StudentProgress.username == lp.username).first()
            actual_course = prog.course_name if prog else "Kiểm tra năng lực"

        acc_percent = round((lp.score / lp.total_questions) * 100, 1) if lp.total_questions > 0 else 0
        
        result.append({
            "course_name": actual_course or "Môn học chung",
            "lesson_name": l_name if lp.doc_id != 0 else "Diagnostic Test",
            "accuracy": acc_percent,
            "final_score": lp.final_score or 0,
            "doc_id": lp.doc_id,
            "date": lp.created_at.strftime("%d/%m") if lp.created_at else "N/A"
        })
    
    return result

@router.post("/submit-quiz")
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
        if not doc: raise HTTPException(status_code=404, detail="Bài học không tồn tại")
        
        eval_result = evaluation_agent.evaluate_student(score/total_questions, time_spent, retry_count)
        final_score = eval_result["final_score"]
        
        db.add(LessonProgress(
            username=username, 
            doc_id=doc_id, 
            score=score, 
            total_questions=total_questions, 
            is_mastered=eval_result["is_mastered"], 
            final_score=final_score
        ))
        db.flush() 
        
        # Cập nhật Level trung bình
        all_history = db.query(LessonProgress).join(Document, LessonProgress.doc_id == Document.id)\
            .filter(LessonProgress.username == username, Document.course_name == doc.course_name).all()
        
        avg_score = sum([h.final_score for h in all_history]) / len(all_history) if all_history else 0
        new_level = "Advanced" if avg_score >= 80 else "Intermediate" if avg_score >= 50 else "Beginner"
        
        progress = db.query(StudentProgress).filter(StudentProgress.username == username, StudentProgress.course_name == doc.course_name).first()
        if progress: progress.level = new_level
        
        user = db.query(User).filter(User.username == username).first()
        if user and user.current_level != new_level: 
            user.current_level = new_level
            
        db.commit()
        return {"status": "success", "data": {"score": score, "total": total_questions, "message": eval_result["ai_message"]}}
    except Exception as e:
        db.rollback() 
        raise HTTPException(status_code=500, detail=str(e))