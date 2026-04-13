from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class PDF(SQLModel, table=True):
    __tablename__ = "pdfs"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    file: str
    uploaded_by_id: Optional[int] = Field(default=None, foreign_key="users.id", ondelete="SET NULL")
    status: str = Field(default="processing")
    questions_generated: int = Field(default=0)
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
