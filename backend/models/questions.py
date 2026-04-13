from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Question(SQLModel, table=True):
    __tablename__ = "questions"

    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = None
    subject: str = Field(index=True)
    topic: str = Field(index=True)
    difficulty: str = Field(default="medium")
    source: str = Field(default="manual")
    source_pdf_id: Optional[int] = Field(default=None, foreign_key="pdfs.id", ondelete="SET NULL")
    status: str = Field(default="pending_review")
    exam_type: str = Field(index=True)
    language: str = Field(default="en")
    created_by_id: Optional[int] = Field(default=None, foreign_key="users.id", ondelete="SET NULL")
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    # source_pdf: Optional["PDF"] = Relationship(back_populates="questions")
    # created_by: Optional["User"] = Relationship()
    # mock_tests: List["MockTest"] = Relationship(back_populates="questions", link_model="MockTestQuestionLink")
