import PyPDF2
import logging

logger = logging.getLogger("AI_MAS_System.ContentAgent")

class ContentAgent:
    def process_document(self, file_path: str) -> str:
        """
        Agent này có nhiệm vụ mổ xẻ file PDF và rút trích toàn bộ văn bản (text) bên trong.
        """
        logger.info(f"Content Agent đang đọc mổ xẻ file: {file_path}...")
        text_content = ""
        try:
            with open(file_path, "rb") as file:
                reader = PyPDF2.PdfReader(file)
                # Đọc từng trang và nối chữ lại với nhau
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text_content += extracted + "\n"
                        
            logger.info("Content Agent đã trích xuất Text thành công!")
            return text_content
        except Exception as e:
            logger.error(f"Lỗi khi Content Agent đọc PDF: {str(e)}")
            return ""

# Khởi tạo instance
content_agent = ContentAgent()