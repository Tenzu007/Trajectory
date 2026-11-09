import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings:
    PROJECT_NAME: str = "DairyPulse – Intelligent Energy, Waste & Hygiene OS"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"

    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "5050"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/dairypulse.db")

    # JWT Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dairypulse_production_super_secret_jwt_key_2024_cooperative_plant4")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

    # File storage
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "uploads" / "processed"
    MODELS_DIR: Path = BASE_DIR / "models"

    # AI Model & Computer Vision
    YOLO_MODEL_PATH: Path = BASE_DIR / "models" / "ppe_yolov8n.pt"
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.50"))
    IOU_THRESHOLD: float = float(os.getenv("IOU_THRESHOLD", "0.45"))
    CCTV_RECONNECT_INTERVAL_SECONDS: int = int(os.getenv("CCTV_RECONNECT_INTERVAL_SECONDS", "5"))

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)

