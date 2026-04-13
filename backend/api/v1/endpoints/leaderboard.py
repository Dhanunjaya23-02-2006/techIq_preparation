from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, desc
from core.db import get_db
from models.tests import TestAttempt
from models.users import User
from models.questions import Question
from api.deps import get_current_active_user

router = APIRouter()


@router.get("/")
def get_leaderboard(
    db: Session = Depends(get_db),
    exam_type: Optional[str] = Query(None),
    test_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Global leaderboard with enriched statistics."""
    # Base query for students
    statement = select(
        User.id,
        User.username,
        User.first_name,
        User.last_name,
        User.avatar,
        func.max(TestAttempt.score).label("best_score"),
        func.count(TestAttempt.id).label("total_tests"),
        func.avg(TestAttempt.score).label("avg_score"),
        func.max(TestAttempt.submitted_at).label("last_active"),
        func.sum(TestAttempt.correct).label("total_correct")
    ).join(TestAttempt, TestAttempt.student_id == User.id).where(
        TestAttempt.is_completed == True,
        User.role == "student",
        User.is_superuser == False,
        User.is_staff == False
    )

    if test_id:
        statement = statement.where(TestAttempt.test_id == test_id)
    
    statement = statement.group_by(User.id).order_by(desc("total_correct")).limit(100) # Sort by total XP (total correct)
    
    results = db.exec(statement).all()
    
    leaderboard = []
    user_rank = None
    
    for idx, (user_id, username, first_name, last_name, avatar, best_score, total_tests, avg_score, last_active, total_correct) in enumerate(results, 1):
        student_name = f"{first_name or ''} {last_name or ''}".strip() or username
        total_xp = (total_correct or 0) * 10
        level = (total_xp // 500) + 1
        
        entry = {
            "rank": idx,
            "student_id": user_id,
            "student_name": student_name,
            "username": username,
            "avatar": avatar,
            "score": float(f"{best_score or 0:.2f}"),
            "total_tests": total_tests or 0,
            "avg_score": float(f"{avg_score or 0:.2f}"),
            "last_active": last_active,
            "total_xp": total_xp,
            "level": level
        }
        leaderboard.append(entry)
        
        if user_id == current_user.id:
            user_rank = entry

    # If current user is not in top 100, find their rank separately
    if not user_rank:
        # Get this user's stats
        user_stats = db.exec(
            select(func.sum(TestAttempt.correct), func.max(TestAttempt.score))
            .where(TestAttempt.student_id == current_user.id, TestAttempt.is_completed == True)
        ).first()
        
        if user_stats and user_stats[0] is not None:
            user_total_correct = user_stats[0]
            user_best_score = user_stats[1]
            
            better_count = db.exec(
                select(func.count(func.distinct(User.id)))
                .join(TestAttempt, TestAttempt.student_id == User.id)
                .where(
                    TestAttempt.is_completed == True,
                    User.role == "student"
                )
                .group_by(User.id)
                .having(func.sum(TestAttempt.correct) > user_total_correct)
            ).all()
            
            rank = len(better_count) + 1
            total_xp = user_total_correct * 10
            
            user_rank = {
                "rank": rank,
                "student_id": current_user.id,
                "student_name": f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.username,
                "score": float(f"{user_best_score or 0:.2f}"),
                "total_xp": total_xp,
                "level": (total_xp // 500) + 1,
                "is_personal": True
            }

    return {
        "success": True,
        "data": {
            "leaderboard": leaderboard,
            "user_rank": user_rank,
            "global_stats": {
                "total_participants": db.exec(select(func.count(func.distinct(TestAttempt.student_id))).where(TestAttempt.is_completed == True)).one(),
                "average_global_score": float(f"{db.exec(select(func.avg(TestAttempt.score)).where(TestAttempt.is_completed == True)).one() or 0:.2f}"),
            }
        },
        "message": ""
    }

