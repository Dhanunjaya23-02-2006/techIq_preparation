from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class MockTestQuestionLink(SQLModel, table=True):
    __tablename__ = "mock_test_question_link"

    mock_test_id: Optional[int] = Field(
        default=None, foreign_key="mock_tests.id", primary_key=True, ondelete="CASCADE"
    )
    question_id: Optional[int] = Field(
        default=None, foreign_key="questions.id", primary_key=True, ondelete="CASCADE"
    )


class MockTest(SQLModel, table=True):
    __tablename__ = "mock_tests"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    exam_type: str = Field(index=True)
    subject: Optional[str] = None
    time_limit: int = Field(default=60)
    negative_marking: float = Field(default=0.25)
    marks_per_question: float = Field(default=1.0)
    is_grand_test: bool = Field(default=False)
    is_pyq: bool = Field(default=False)
    is_free: bool = Field(default=False)
    total_questions: int = Field(default=0)
    pdf_file: Optional[str] = None
    is_active: bool = Field(default=True)
    created_by_id: Optional[int] = Field(default=None, foreign_key="users.id", ondelete="SET NULL")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TestAttempt(SQLModel, table=True):
    __tablename__ = "test_attempts"

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    test_id: int = Field(foreign_key="mock_tests.id", ondelete="CASCADE")
    score: float = Field(default=0)
    total_questions: int = Field(default=0)
    correct: int = Field(default=0)
    wrong: int = Field(default=0)
    unanswered: int = Field(default=0)
    time_taken: int = Field(default=0)
    percentile: float = Field(default=0)
    rank: Optional[int] = None
    is_completed: bool = Field(default=False)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    submitted_at: Optional[datetime] = None


class QuestionAttempt(SQLModel, table=True):
    __tablename__ = "question_attempts"

    id: Optional[int] = Field(default=None, primary_key=True)
    attempt_id: int = Field(foreign_key="test_attempts.id", ondelete="CASCADE")
    question_id: int = Field(foreign_key="questions.id", ondelete="CASCADE")
    selected_option: Optional[str] = None
    is_correct: bool = Field(default=False)
    time_spent: int = Field(default=0)
    is_marked: bool = Field(default=False)
