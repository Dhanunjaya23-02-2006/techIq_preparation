from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlmodel import Session, select, func
from core.db import get_db
from models.questions import Question
from models.users import User
from schemas.questions import QuestionCreate, QuestionUpdate, QuestionOut, QuestionPublicOut, QuestionBulkAction
from api.deps import get_current_active_user, get_current_active_superuser

router = APIRouter()


@router.get("/", response_model=dict)
def read_questions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    page: Optional[int] = Query(None),
    page_size: Optional[int] = Query(None),
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve questions with pagination and filtering.
    """
    # Handle pagination params from different frontend components
    if page is not None and page_size is not None:
        limit = page_size
        skip = (page - 1) * page_size
    elif page_size is not None:
        limit = page_size

    statement = select(Question).where(Question.is_deleted == False)
    
    # Filtering logic
    if subject:
        statement = statement.where(Question.subject == subject)
    if difficulty:
        statement = statement.where(Question.difficulty == difficulty)
    
    # Students only see approved questions
    if not current_user.is_staff and current_user.role not in ['admin', 'content_creator']:
        statement = statement.where(Question.status == "approved")
    elif status:
        statement = statement.where(Question.status == status)

    if search:
        statement = statement.where(Question.text.contains(search))

    # Get total count for pagination metadata
    count_statement = select(func.count()).select_from(statement.subquery())
    total_count = db.exec(count_statement).one()

    # Get paginated results
    questions = db.exec(statement.offset(skip).limit(limit)).all()
    
    # Sanitize for students
    if not current_user.is_superuser and current_user.role not in ['admin', 'content_creator']:
        results = [QuestionPublicOut.model_validate(q) for q in questions]
    else:
        results = questions
        
    return {
        "count": total_count,
        "results": results,
        "page": page or (skip // limit + 1),
        "page_size": limit
    }


@router.post("/", response_model=QuestionOut)
def create_question(
    *, db: Session = Depends(get_db), question_in: QuestionCreate, current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create new question.
    """
    db_obj = Question.model_validate(question_in)
    db_obj.created_by_id = current_user.id
    db_obj.source = "manual"
    db_obj.status = "pending_review"
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.patch("/{question_id}/", response_model=QuestionOut)
def update_question(
    *,
    db: Session = Depends(get_db),
    question_id: int,
    question_in: QuestionUpdate,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Update a question.
    """
    db_obj = db.get(Question, question_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Question not found")
    update_data = question_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(db_obj, k, v)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.delete("/{question_id}/")
def delete_question(
    *,
    db: Session = Depends(get_db),
    question_id: int,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Delete a question.
    """
    db_obj = db.get(Question, question_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Question not found")
    db_obj.is_deleted = True
    db.add(db_obj)
    db.commit()
    return {"message": "Question soft-deleted"}

@router.post("/bulk_action/", response_model=dict)
def bulk_action(
    *, db: Session = Depends(get_db), action_in: QuestionBulkAction, current_user: User = Depends(get_current_active_superuser)
) -> Any:
    """
    Bulk approve, reject or delete questions.
    """
    if action_in.action == "delete":
        count = 0
        for q_id in action_in.question_ids:
            q = db.get(Question, q_id)
            if q:
                q.is_deleted = True
                db.add(q)
                count += 1
        db.commit()
        return {"message": f"{count} questions soft-deleted"}
    else:
        new_status = "approved" if action_in.action == "approve" else "rejected"
        updated_count = 0
        for q_id in action_in.question_ids:
            q = db.get(Question, q_id)
            if q:
                q.status = new_status
                db.add(q)
                updated_count += 1
        db.commit()
        return {"message": f"{updated_count} questions {new_status}"}


@router.get("/stats/")
def read_question_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Get question statistics.
    """
    total = db.exec(select(func.count(Question.id))).one()
    approved = db.exec(select(func.count(Question.id)).where(Question.status == "approved")).one()
    pending = db.exec(select(func.count(Question.id)).where(Question.status == "pending_review")).one()
    
    return {
        "total": total,
        "approved": approved,
        "pending": pending,
    }
