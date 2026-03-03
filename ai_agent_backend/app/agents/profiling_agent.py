import logging

logger = logging.getLogger("AI_MAS_System.ProfilingAgent")

class ProfilingAgent:
    def evaluate_diagnostic_score(self, score: int, total_questions: int) -> str:
        """
        Learner Profiling Agent: Đánh giá và phân loại năng lực học viên
        Dựa trên kết quả bài test Diagnostic (Giai đoạn 1).
        """
        if total_questions == 0:
            return "Beginner"
        
        accuracy = score / total_questions
        logger.info(f"Profiling Agent đang phân tích điểm Test đầu vào: {score}/{total_questions} ({accuracy:.2f})")

        # Luật phân loại theo tài liệu Đề tài (Rule-based)
        if accuracy < 0.4:
            level = "Beginner"
        elif accuracy <= 0.7:
            level = "Intermediate"
        else:
            level = "Advanced"
            
        logger.info(f"=> Quyết định xếp hạng ban đầu: {level}")
        return level

    # ---> PHẦN CẬP NHẬT MỚI CHO GIAI ĐOẠN 3 <---
    def update_level_after_lesson(self, current_level: str, final_score: float) -> str:
        """
        Dựa trên Final Score (kết hợp Điểm thi + Nỗ lực + Tiến bộ) từ Evaluation Agent,
        quyết định xem học sinh có xứng đáng được thăng hạng (Level Up) hay không.
        
        Logic đề xuất:
        - Beginner + Final Score >= 85 => Lên Intermediate
        - Intermediate + Final Score >= 90 => Lên Advanced
        """
        new_level = current_level
        
        if current_level == "Beginner" and final_score >= 85:
            new_level = "Intermediate"
        elif current_level == "Intermediate" and final_score >= 90:
            new_level = "Advanced"
            
        if new_level != current_level:
            logger.info(f"🎉 Profiling Agent quyết định NÂNG HẠNG cho học viên: {current_level} -> {new_level}")
        else:
            logger.info(f"Profiling Agent giữ nguyên hạng hiện tại: {current_level}")
        
        return new_level

# Khởi tạo instance duy nhất
profiling_agent = ProfilingAgent()