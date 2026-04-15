from typing import List, Union, Any
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Railway Exam"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # Database configuration
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_HOST: str = ""
    DB_PORT: str = ""
    DB_NAME: str = ""
    
    # Optional direct DATABASE_URL for Production (Neon/Railway)
    DATABASE_URL: str = ""
    REDIS_URL: str = ""
    
    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        # Priority: DATABASE_URL -> DB_USER/HOST/etc.
        url = self.DATABASE_URL
        if url:
            # Fix for Heroku/Render/Railway where they might use 'postgres://' 
            # but SQLAlchemy requires 'postgresql://'
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
            
        # Fallback to building from individual components
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 30 minutes
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str
    RAZORPAY_WEBHOOK_SECRET: str = ""

    GROQ_API_KEY: str = ""
    AI_MODEL: str = "llama-3.3-70b-versatile"

    # SMTP (OTP)
    OTP_SERVICE_URL: str = "https://otp-service-beta.vercel.app"

    BACKEND_CORS_ORIGINS: Any = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return []

    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=".env", extra="ignore"
    )


settings = Settings()
