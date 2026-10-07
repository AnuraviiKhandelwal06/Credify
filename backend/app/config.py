import os
import dotenv
from pydantic_settings import BaseSettings

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(env_path):
    dotenv.load_dotenv(env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Credify"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "credify_super_secret_jwt_key_2026_student_demo")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Defaults to SQLite for immediate out-of-the-box runnability, easily overridable via DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./credify.db")
    
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "backend", "uploads")
    MODEL_PATH: str = os.path.join(BASE_DIR, "ml", "saved_model", "credit_model.joblib")

    class Config:
        env_file = env_path
        extra = "allow"

settings = Settings()


os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
