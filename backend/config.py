import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

class Settings:
    PROJECT_NAME: str = "Digital Points API"
    PROJECT_VERSION: str = "1.0.0"
    
    MONGODB_URL: str = os.getenv("MONGODB_URL", "")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "digital_points")
    MONGODB_DNS_SERVERS: str = os.getenv("MONGODB_DNS_SERVERS", "8.8.8.8,1.1.1.1")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    SECRET_KEY_PREVIOUS: str = os.getenv("SECRET_KEY_PREVIOUS", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    BACKEND_PUBLIC_URL: str = os.getenv("BACKEND_PUBLIC_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")

    RATE_LIMIT_DEFAULT: str = os.getenv("RATE_LIMIT_DEFAULT", "1000/minute")
    RATE_LIMIT_LOGIN: str = os.getenv("RATE_LIMIT_LOGIN", "50/minute")
    RATE_LIMIT_FORGOT_PASSWORD: str = os.getenv("RATE_LIMIT_FORGOT_PASSWORD", "20/minute")
    RATE_LIMIT_RESET_PASSWORD: str = os.getenv("RATE_LIMIT_RESET_PASSWORD", "20/minute")
    RATE_LIMIT_CONTACT: str = os.getenv("RATE_LIMIT_CONTACT", "100/minute")
    RATE_LIMIT_BOOKING: str = os.getenv("RATE_LIMIT_BOOKING", "100/minute")
    
    # --- Email Settings (Resend) ---
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")  # Legacy - kept for backward compatibility
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")  # Legacy - kept for backward compatibility
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@digitalpoints.com")
    ADMIN_CONTACT_EMAIL: str = os.getenv("ADMIN_CONTACT_EMAIL", "")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))  # Legacy - kept for backward compatibility
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")  # Legacy - kept for backward compatibility
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Digital Points Admin")
    USE_CREDENTIALS: bool = True  # Legacy
    VALIDATE_CERTS: bool = True  # Legacy

    def previous_secret_keys(self) -> list[str]:
        return [item.strip() for item in self.SECRET_KEY_PREVIOUS.split(",") if item.strip()]

    def cors_origins(self) -> list[str]:
        explicit = [item.strip() for item in self.CORS_ORIGINS.split(",") if item.strip()]
        if explicit:
            return explicit
        return [self.FRONTEND_URL.rstrip("/")]

settings = Settings()
