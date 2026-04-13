from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class MockTestBase(BaseModel):
    title: str
    description: Optional[str] = None
    exam_type: str
    subject: Optional[str] = None
    time_limit: int = 60
    negative_marking: float = 0.25
    marks_per_question: float = 1.0
    is_grand_test: bool = False
    is_pyq: bool = False
    is_free: bool = False
    is_active: bool = True


class MockTestCreate(MockTestBase):
    question_ids: Optional[List[int]] = None


class MockTestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    exam_type: Optional[str] = None
    subject: Optional[str] = None
    time_limit: Optional[int] = None
    is_active: Optional[bool] = None
    is_pyq: Optional[bool] = None
    is_grand_test: Optional[bool] = None
    is_free: Optional[bool] = None
    question_ids: Optional[List[int]] = None


class MockTestOut(MockTestBase):
    id: int
    total_questions: int = 0
    pdf_file: Optional[str] = None
    questions: List[int] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnswerIn(BaseModel):
    question_id: int
    selected_option: Optional[str] = None
    time_spent: int = 0
    is_marked: bool = False


class SubmitTestIn(BaseModel):
    answers: List[AnswerIn]
    time_taken: int


class TestAttemptOut(BaseModel):
    id: int
    test_id: int
    test_title: Optional[str] = None
    score: float
    total_questions: int
    correct: int
    wrong: int
    unanswered: int
    time_taken: int
    rank: Optional[int] = None
    percentile: float = 0
    is_completed: bool
    started_at: datetime
    submitted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class QuestionReviewOut(BaseModel):
    id: int
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = None
    selected_option: Optional[str] = None
    is_correct: bool = False


class AttemptDetailOut(BaseModel):
    attempt: TestAttemptOut
    questions: List[QuestionReviewOut]
