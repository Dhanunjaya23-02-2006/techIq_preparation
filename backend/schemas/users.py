from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: str = "student"
    target_exam: Optional[str] = None
    preferred_language: str = "en"
    avatar: Optional[str] = None


class UserCreate(UserBase):
    password: str
    phone: str
    otp: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    target_exam: Optional[str] = None
    preferred_language: Optional[str] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int
    is_premium: bool
    is_elite: bool = False
    is_active: bool
    is_superuser: bool = False
    is_staff: bool = False
    created_at: datetime
    current_plan: Optional[str] = None
    total_test_attempts: int = 0
    test_counts: Optional[dict] = None
    last_seen: Optional[datetime] = None
    last_login: Optional[datetime] = None
    total_time_spent: int = 0
    total_active_seconds: int = 0
    mfa_enabled: bool = False

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[int] = None


class MFASetupOut(BaseModel):
    secret: str
    provisioning_uri: str
    qr_code: str


class MFALoginIn(BaseModel):
    username: str
    password: str
    mfa_code: Optional[str] = None
