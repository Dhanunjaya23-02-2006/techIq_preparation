from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class QuestionBase(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = None
    subject: str
    topic: str
    difficulty: str = "medium"
    exam_type: str
    language: str = "en"


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    option_a: Optional[str] = None
    option_b: Optional[str] = None
    option_c: Optional[str] = None
    option_d: Optional[str] = None
    correct_option: Optional[str] = None
    explanation: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    exam_type: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None


class QuestionOut(QuestionBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuestionPublicOut(BaseModel):
    """Schema for public question listing (no correct option or explanation)."""
    id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    subject: str
    topic: str
    difficulty: str
    language: str

    class Config:
        from_attributes = True


class QuestionTestOut(BaseModel):
    """Schema for active mock tests (absolutely no correct option or explanation)."""
    id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str

    class Config:
        from_attributes = True


class QuestionBulkAction(BaseModel):
    question_ids: List[int]
    action: str  # 'approve', 'reject', 'delete'
