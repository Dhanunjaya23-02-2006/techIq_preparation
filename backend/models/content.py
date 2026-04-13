from datetime import datetime, date as dt_date
from typing import Optional
from sqlmodel import SQLModel, Field


class StudyMaterial(SQLModel, table=True):
    __tablename__ = "study_materials"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: Optional[str] = None
    content_type: str = Field(default="notes")
    file: Optional[str] = None
    subject: str = Field(index=True)
    topic: str = Field(index=True)
    is_premium: bool = Field(default=False)
    created_by_id: Optional[int] = Field(default=None, foreign_key="users.id", ondelete="SET NULL")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CurrentAffairs(SQLModel, table=True):
    __tablename__ = "current_affairs"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    category: str = Field(default="national", index=True)
    exam_insight: Optional[str] = None
    importance_score: int = Field(default=5)
    full_content: Optional[str] = None
    date: dt_date = Field(index=True)
    is_downloadable: bool = Field(default=False)
    file: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

