import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

class Settings:
    PROJECT_NAME: str = "Digital Points API"
    PROJECT_VERSION: str = "1.0.0"
    
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb+srv://test:test@cluster.mongodb.net/test")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "digital_points")
    MONGODB_DNS_SERVERS: str = os.getenv("MONGODB_DNS_SERVERS", "8.8.8.8,1.1.1.1")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-for-jwt")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    BACKEND_PUBLIC_URL: str = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000")
    
    # --- Email Settings ---
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@digitalpoints.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Digital Points Admin")
    MAIL_SSL_TLS: bool = True
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True

settings = Settings()
