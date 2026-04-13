from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import SQLModel, Field

class VerificationCode(SQLModel, table=True):
    __tablename__ = "verification_codes"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    code: str
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(minutes=10))
    is_used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
