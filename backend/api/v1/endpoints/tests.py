from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlmodel import Session, select, func
import json
import os

from core.db import get_db
from models.tests import MockTest, TestAttempt, QuestionAttempt, MockTestQuestionLink
from models.questions import Question
from models.users import User
from schemas.tests import MockTestOut, MockTestCreate, MockTestUpdate, SubmitTestIn, TestAttemptOut, AttemptDetailOut, QuestionReviewOut
from schemas.questions import QuestionTestOut
from api.deps import get_current_active_user, get_current_active_superuser
from models.notifications import Notification

router = APIRouter()


@router.get("/mock/", response_model=List[MockTestOut])
def list_mock_tests(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    exam_type: Optional[str] = None,
    is_pyq: Optional[bool] = None,
    is_grand_test: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    List mock tests with optional filters.
    """
    statement = select(MockTest).where(MockTest.is_active == True)
    if exam_type:
        statement = statement.where(MockTest.exam_type == exam_type)
    if is_pyq is not None:
        statement = statement.where(MockTest.is_pyq == is_pyq)
    if is_grand_test is not None:
        statement = statement.where(MockTest.is_grand_test == is_grand_test)
    
    # Show all active tests to all users, let frontend handle locking UI
    # This ensures "No Plan" users can still see that tests exist.
    statement = statement.offset(skip).limit(limit)
    
    results = db.exec(statement).all()
    
    # Enriched results with question_ids
    enriched_results = []
    for test in results:
        q_ids = db.exec(select(MockTestQuestionLink.question_id).where(MockTestQuestionLink.mock_test_id == test.id)).all()
        test_out = MockTestOut.model_validate(test)
        test_out.questions = q_ids
        enriched_results.append(test_out)
        
    return enriched_results


@router.get("/mock/{test_id}/", response_model=MockTestOut)
def get_mock_test(
    *,
    db: Session = Depends(get_db),
    test_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get a single mock test by ID.
    """
    test = db.get(MockTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")
    
    q_ids = db.exec(select(MockTestQuestionLink.question_id).where(MockTestQuestionLink.mock_test_id == test.id)).all()
    test_out = MockTestOut.model_validate(test)
    test_out.questions = q_ids
    return test_out


@router.post("/mock/", response_model=MockTestOut)
def create_mock_test(
    *,
    db: Session = Depends(get_db),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    exam_type: str = Form(...),
    subject: Optional[str] = Form(None),
    time_limit: int = Form(60),
    negative_marking: float = Form(0.25),
    marks_per_question: float = Form(1.0),
    is_grand_test: bool = Form(False),
    is_pyq: bool = Form(False),
    is_free: bool = Form(False),
    is_active: bool = Form(True),
    question_ids: List[str] = Form([]),  # List of IDs from form
    pdf_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Create a new mock test.
    """
    test = MockTest(
        title=title,
        description=description,
        exam_type=exam_type,
        subject=subject,
        time_limit=time_limit,
        negative_marking=negative_marking,
        marks_per_question=marks_per_question,
        is_grand_test=is_grand_test,
        is_pyq=is_pyq,
        is_free=is_free,
        is_active=is_active,
        created_by_id=current_user.id
    )
    
    if pdf_file:
        file_path = f"media/pdfs/{pdf_file.filename}"
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(pdf_file.file.read())
        test.pdf_file = file_path

    db.add(test)
    db.commit()
    db.refresh(test)
    
    if question_ids:
        for q_id in question_ids:
            link = MockTestQuestionLink(mock_test_id=test.id, question_id=int(q_id))
            db.add(link)
        test.total_questions = len(question_ids)
        db.add(test)
        db.commit()
        db.refresh(test)
        
    # Create broadcast notification for students
    notif_title = "New Mock Test Available"
    if is_grand_test:
        notif_title = "New Grand Test Live!"
    elif is_pyq:
        notif_title = "New Previous Year Question Added"
        
    notif = Notification(
        user_id=None, # Global
        type="test",
        title=notif_title,
        message=f"'{title}' for {exam_type} is now live and ready for training.",
        link=f"/tests/{'mock' if not is_grand_test and not is_pyq else 'grand' if is_grand_test else 'pyq'}/{test.id}"
    )
    db.add(notif)
    db.commit()
        
    test_out = MockTestOut.model_validate(test)
    test_out.questions = [int(q_id) for q_id in question_ids] if question_ids else []
    return test_out


@router.post("/start/{test_id}/")
def start_test(
    *,
    db: Session = Depends(get_db),
    test_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Start a mock test attempt.
    """
    test = db.get(MockTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")
        
    # Prevent Concurrent Sessions
    active_attempt = db.exec(
        select(TestAttempt).where(
            TestAttempt.student_id == current_user.id,
            TestAttempt.is_completed == False
        )
    ).first()
    if active_attempt:
        raise HTTPException(
            status_code=400, 
            detail=f"You already have an active test attempt (ID: {active_attempt.id}). Please complete it or wait for it to expire."
        )

    # Enforce Multi-Tier Limits
    user_plan = current_user.current_plan
    counts = current_user.test_counts
    total_attempts = current_user.total_test_attempts
    
    # 1. No Plan / Free Tier Limit (3 total)
    if user_plan == "No Plan":
        if not test.is_free:
            raise HTTPException(
                status_code=403, 
                detail="This is a premium test. Please upgrade your plan to access it."
            )
        if total_attempts >= 3:
            raise HTTPException(
                status_code=403, 
                detail="No active plan. You can only attempt 3 free exams in total. Please upgrade to a paid plan for unlimited access."
            )
    
    # 2. Paid Plan Category Limits
    elif user_plan == "Starter":
        if test.is_grand_test:
            if counts["grand"] >= 30:
                raise HTTPException(status_code=403, detail="Starter Plan limit reached for Grand Tests (30). Please upgrade to Pro or Elite.")
        elif test.is_pyq:
            if counts["pyq"] >= 40:
                raise HTTPException(status_code=403, detail="Starter Plan limit reached for PYQs (40). Please upgrade to Pro or Elite.")
        else: # Mock Test
            if counts["mock"] >= 50:
                raise HTTPException(status_code=403, detail="Starter Plan limit reached for Mock Tests (50). Please upgrade to Pro or Elite.")
                
    elif user_plan == "Pro":
        if test.is_grand_test:
            if counts["grand"] >= 60:
                raise HTTPException(status_code=403, detail="Pro Plan limit reached for Grand Tests (60). Please upgrade to Elite.")
        elif test.is_pyq:
            if counts["pyq"] >= 80:
                raise HTTPException(status_code=403, detail="Pro Plan limit reached for PYQs (80). Please upgrade to Elite.")
        else: # Mock Test
            if counts["mock"] >= 100:
                raise HTTPException(status_code=403, detail="Pro Plan limit reached for Mock Tests (100). Please upgrade to Elite.")
    
    # Elite and Admin have no limits
        
    attempt = TestAttempt(
        student_id=current_user.id,
        test_id=test_id,
        total_questions=test.total_questions
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Return attempt_id and questions (SANITIZED)
    q_ids = db.exec(select(MockTestQuestionLink.question_id).where(MockTestQuestionLink.mock_test_id == test_id)).all()
    questions = db.exec(select(Question).where(Question.id.in_(q_ids))).all()
    sanitized_questions = [QuestionTestOut.model_validate(q) for q in questions]
    
    return {
        "success": True,
        "data": {
            "attempt_id": attempt.id,
            "test": test,
            "questions": sanitized_questions,
            "time_limit": test.time_limit,
            "test_title": test.title
        }
    }


@router.post("/submit/{attempt_id}/")
def submit_test(
    *,
    db: Session = Depends(get_db),
    attempt_id: int,
    submission: SubmitTestIn,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Submit a mock test attempt.
    """
    attempt = db.get(TestAttempt, attempt_id)
    if not attempt or attempt.student_id != current_user.id:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.is_completed:
         raise HTTPException(status_code=400, detail="Test already submitted")
         
    test = db.get(MockTest, attempt.test_id)
    
    # SERVER-SIDE TIMER ENFORCEMENT
    buffer_seconds = 30 # Allowance for network latency
    allowed_time_seconds = (test.time_limit * 60) + buffer_seconds
    actual_time_seconds = (datetime.utcnow() - attempt.started_at).total_seconds()
    
    if actual_time_seconds > allowed_time_seconds:
         # Auto-fail or mark as late
         # For strict enforcement, we fail the attempt if it's way over the limit
         if actual_time_seconds > allowed_time_seconds + 300: # 5 min grace for extreme lag
             raise HTTPException(status_code=403, detail="Test submission period has expired.")

    correct_count = 0
    wrong_count = 0
    unanswered_count = 0
    
    # Process answers
    for ans in submission.answers:
        q = db.get(Question, ans.question_id)
        if not q: continue
        
        is_correct = False
        if ans.selected_option:
            if ans.selected_option.upper() == q.correct_option.upper():
                is_correct = True
                correct_count += 1
            else:
                wrong_count += 1
        else:
            unanswered_count += 1
            
        q_attempt = QuestionAttempt(
            attempt_id=attempt_id,
            question_id=ans.question_id,
            selected_option=ans.selected_option,
            is_correct=is_correct,
            time_spent=ans.time_spent,
            is_marked=ans.is_marked
        )
        db.add(q_attempt)
        
    score = (correct_count * test.marks_per_question) - (wrong_count * test.negative_marking)
    
    attempt.score = score
    attempt.correct = correct_count
    attempt.wrong = wrong_count
    attempt.unanswered = unanswered_count
    attempt.time_taken = submission.time_taken
    attempt.is_completed = True
    attempt.submitted_at = datetime.utcnow()
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Create notification for student performance
    accuracy = (correct_count / test.total_questions * 100) if test.total_questions > 0 else 0
    notif = Notification(
        user_id=current_user.id,
        type="rank",
        title="Test Attempt Completed",
        message=f"You completed {test.title} with {accuracy:.1f}% accuracy ({correct_count}/{test.total_questions}). Check your rank on the leaderboard!",
        link="/leaderboard"
    )
    db.add(notif)
    db.commit()
    
    return {
        "success": True,
        "data": TestAttemptOut.model_validate(attempt)
    }


@router.get("/history/", response_model=List[TestAttemptOut])
def read_test_history(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get user's test history with test titles.
    """
    statement = (
        select(TestAttempt, MockTest.title.label("test_title"))
        .join(MockTest, TestAttempt.test_id == MockTest.id)
        .where(TestAttempt.student_id == current_user.id)
        .order_by(TestAttempt.started_at.desc())
    )
    results = db.exec(statement).all()
    
    # Map results to include test_title in the attempt object
    out = []
    for row in results:
        attempt, title = row
        obj = TestAttemptOut.model_validate(attempt)
        obj.test_title = title
        out.append(obj)
        
    return out


@router.get("/attempt/{attempt_id}/details", response_model=AttemptDetailOut)
def get_attempt_details(
    *,
    db: Session = Depends(get_db),
    attempt_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get detailed results for a test attempt, including question/answer breakdown and explanations.
    """
    attempt = db.get(TestAttempt, attempt_id)
    if not attempt or (attempt.student_id != current_user.id and not current_user.is_superuser):
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    q_attempts = db.exec(select(QuestionAttempt).where(QuestionAttempt.attempt_id == attempt_id)).all()
    
    # Only reveal answers if test is completed
    is_completed = attempt.is_completed
    
    review_questions = []
    for qa in q_attempts:
        q = db.get(Question, qa.question_id)
        if q:
            review_questions.append(QuestionReviewOut(
                id=q.id,
                text=q.text,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                correct_option=q.correct_option if is_completed else "",
                explanation=q.explanation if is_completed else "",
                selected_option=qa.selected_option,
                is_correct=qa.is_correct if is_completed else False
            ))
            
    test = db.get(MockTest, attempt.test_id)
    attempt_out = TestAttemptOut.model_validate(attempt)
    if test:
        attempt_out.test_title = test.title
            
    return AttemptDetailOut(
        attempt=attempt_out,
        questions=review_questions
    )


@router.delete("/mock/{test_id}/")
def delete_mock_test(
    *,
    db: Session = Depends(get_db),
    test_id: int,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    test = db.get(MockTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")
    db.delete(test)
    db.commit()
    return {"message": "Mock test deleted"}


@router.patch("/mock/{test_id}/", response_model=MockTestOut)
def update_mock_test(
    *,
    db: Session = Depends(get_db),
    test_id: int,
    mock_in: MockTestUpdate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    test = db.get(MockTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Mock test not found")
    
    update_data = mock_in.model_dump(exclude_unset=True)
    if "question_ids" in update_data:
        q_ids = update_data.pop("question_ids")
        # Clear existing links
        from sqlmodel import delete
        db.exec(delete(MockTestQuestionLink).where(MockTestQuestionLink.mock_test_id == test_id))
        # Add new links
        for q_id in q_ids:
            link = MockTestQuestionLink(mock_test_id=test_id, question_id=int(q_id))
            db.add(link)
        test.total_questions = len(q_ids)
        
    for k, v in update_data.items():
        setattr(test, k, v)
        
    db.add(test)
    db.commit()
    db.refresh(test)
    
    q_ids = db.exec(select(MockTestQuestionLink.question_id).where(MockTestQuestionLink.mock_test_id == test.id)).all()
    test_out = MockTestOut.model_validate(test)
    test_out.questions = q_ids
    return test_out
