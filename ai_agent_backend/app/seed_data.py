from app.core.database import SessionLocal, engine
from app.models import database_models
from app.models.database_models import User

# Đảm bảo bảng đã được tạo
database_models.Base.metadata.create_all(bind=engine)

def seed_users():
    db = SessionLocal()
    try:
        # Kiểm tra xem đã có data chưa
        if not db.query(User).filter(User.username == "gv01").first():
            # Tạo 1 Giáo viên
            teacher = User(username="gv01", full_name="Nguyễn Văn Giảng Viên", role="teacher")
            # Tạo 1 Học sinh
            student = User(username="hs01", full_name="Trần Thị Học Sinh", role="student")
            
            db.add(teacher)
            db.add(student)
            db.commit()
            print("✅ Đã tạo thành công data thật: 1 Giáo viên (gv01) và 1 Học sinh (hs01)!")
        else:
            print("⚡ Data đã tồn tại trong Database rồi bro!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()