import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load key từ file .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Chưa tìm thấy API Key trong file .env!")
else:
    genai.configure(api_key=api_key)
    print("--- CÁC MODEL HỖ TRỢ SINH TEXT (generateContent) ---")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)