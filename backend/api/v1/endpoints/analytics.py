from datetime import datetime
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func, desc
from core.db import get_db
from models.tests import TestAttempt, QuestionAttempt, MockTest
from models.users import User
from models.questions import Question
from models.subscriptions import Subscription, SubscriptionTransaction, Plan
from api.deps import get_current_active_user, get_current_active_superuser, get_db
from models.analytics import VisitorRecord
from models.notifications import Notification
from datetime import timedelta
from fastapi import Request

router = APIRouter()

@router.post("/visit")
async def log_visit(
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """Log a site visit."""
    client_host = request.client.host if request.client else "unknown"
    
    # Check if a visit from this IP is already logged today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing_visit = db.exec(
        select(VisitorRecord).where(
            VisitorRecord.ip_address == client_host,
            VisitorRecord.timestamp >= today_start
        )
    ).first()
    
    if existing_visit:
        return {"success": True, "message": "Already visited today"}
        
    # Try to get user from token if present (optional)
    user_id = None
    display_name = "A guest"
    
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from jose import jwt
            from core.config import settings
            token = auth_header.split(" ")[1]
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("sub")
            if user_id:
                user = db.get(User, user_id)
                if user:
                    display_name = f"User {user.username}"
        except Exception:
            # Token might be invalid or expired, just proceed as guest
            pass

    record = VisitorRecord(
        ip_address=client_host,
        path="/", # Root of the app
        user_id=user_id
    )
    db.add(record)
    
    # Dispatch an admin notification for the visit
    notif = Notification(
        type="admin_alert",
        title="New Visit",
        message=f"{display_name} visited the application."
    )
    db.add(notif)
    
    db.commit()
    return {"success": True}


@router.get("/performance/")
def get_performance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    # Fetch attempts with test titles
    attempts_query = db.exec(
        select(TestAttempt, MockTest.title)
        .join(MockTest, TestAttempt.test_id == MockTest.id)
        .where(
            TestAttempt.student_id == current_user.id,
            TestAttempt.is_completed == True
        )
        .order_by(TestAttempt.submitted_at.desc())
        .limit(10)
    ).all()
    
    # Format recent attempts for the battle log
    recent_attempts_formatted = [
        {
            "id": row[0].id,
            "score": row[0].score,
            "total_questions": row[0].total_questions,
            "correct": row[0].correct,
            "wrong": row[0].wrong,
            "rank": row[0].rank,
            "percentile": row[0].percentile,
            "submitted_at": row[0].submitted_at,
            "test_title": row[1]
        } for row in attempts_query
    ]
    
    # Fetch all attempts for global stats and trends
    total_stats_attempts = db.exec(
        select(TestAttempt).where(
            TestAttempt.student_id == current_user.id,
            TestAttempt.is_completed == True
        ).order_by(TestAttempt.submitted_at.desc())
    ).all()
    
    # For trends (compare last 5 with previous 5 if available)
    last_5 = total_stats_attempts[:5]
    prev_5 = total_stats_attempts[5:10]
    
    accuracy_trend = "0%"
    score_trend = "0"
    
    if len(last_5) > 0 and len(prev_5) > 0:
        last_5_total_q = sum((a.total_questions or 0) for a in last_5)
        last_5_acc = (sum((a.correct or 0) for a in last_5) / last_5_total_q * 100) if last_5_total_q > 0 else 0
        
        prev_5_total_q = sum((a.total_questions or 0) for a in prev_5)
        prev_5_acc = (sum((a.correct or 0) for a in prev_5) / prev_5_total_q * 100) if prev_5_total_q > 0 else 0
        
        acc_diff = last_5_acc - prev_5_acc
        accuracy_trend = f"{'+' if acc_diff >= 0 else ''}{acc_diff:.1f}%"
        
        last_5_avg = sum((a.score or 0) for a in last_5) / len(last_5)
        prev_5_avg = sum((a.score or 0) for a in prev_5) / len(prev_5)
        score_diff = last_5_avg - prev_5_avg
        score_trend = f"{'+' if score_diff >= 0 else ''}{score_diff:.1f} pts"

    total_tests = len(total_stats_attempts)
    if total_tests == 0:
        return {
            "success": True,
            "data": {
                "total_tests": 0, 
                "message": "No tests attempted yet.",
                "recent_attempts": [],
                "subject_stats": [],
                "weak_topics": [],
                "strong_topics": [],
                "accuracy": 0,
                "average_score": 0
            },
            "message": ""
        }

    total_correct = sum((a.correct or 0) for a in total_stats_attempts)
    total_wrong = sum((a.wrong or 0) for a in total_stats_attempts)
    total_questions = sum((a.total_questions or 0) for a in total_stats_attempts)
    accuracy = (total_correct / total_questions * 100) if total_questions > 0 else 0
    avg_score = sum((a.score or 0) for a in total_stats_attempts) / total_tests

    # Subject-wise stats
    subject_stats_query = db.exec(
        select(
            Question.subject,
            func.count(QuestionAttempt.id).label("total"),
            func.count(QuestionAttempt.id).filter(QuestionAttempt.is_correct == True).label("correct")
        )
        .join(Question, QuestionAttempt.question_id == Question.id)
        .join(TestAttempt, QuestionAttempt.attempt_id == TestAttempt.id)
        .where(TestAttempt.student_id == current_user.id)
        .group_by(Question.subject)
    ).all()

    # Topic-wise stats for strengths/weaknesses
    topic_stats = db.exec(
        select(
            Question.topic,
            func.count(QuestionAttempt.id).label("total"),
            func.count(QuestionAttempt.id).filter(QuestionAttempt.is_correct == True).label("correct")
        )
        .join(Question, QuestionAttempt.question_id == Question.id)
        .join(TestAttempt, QuestionAttempt.attempt_id == TestAttempt.id)
        .where(TestAttempt.student_id == current_user.id)
        .group_by(Question.topic)
    ).all()

    processed_topics = []
    for t in topic_stats:
        topic_name, total, correct = t
        if not topic_name or topic_name.strip() == "":
            continue
        topic_accuracy = (correct / total * 100) if total > 0 else 0
        processed_topics.append({
            "question__topic": topic_name,
            "accuracy": float(round(topic_accuracy, 2))
        })

    weak_topics = [t for t in processed_topics if t["accuracy"] < 50]
    strong_topics = [t for t in processed_topics if t["accuracy"] >= 80]

    # Calculate XP and Level
    # XP = total correct answers * 10
    total_xp = total_correct * 10
    level = (total_xp // 500) + 1  # Every 500 XP is a level
    xp_in_current_level = total_xp % 500
    xp_percentage = (xp_in_current_level / 500) * 100

    # Calculate Streak
    streak = 0
    if total_tests > 0:
        # Get all submission dates (distinct days)
        submission_days = db.exec(
            select(func.date(TestAttempt.submitted_at))
            .where(TestAttempt.student_id == current_user.id, TestAttempt.is_completed == True)
            .group_by(func.date(TestAttempt.submitted_at))
            .order_by(desc(func.date(TestAttempt.submitted_at)))
        ).all()
        
        from datetime import date, timedelta
        today = date.today()
        
        # Check if they had an attempt today or yesterday to continue the streak
        if submission_days:
            last_day = submission_days[0]
            if last_day == today or last_day == today - timedelta(days=1):
                streak = 1
                current_day = last_day
                for i in range(1, len(submission_days)):
                    if submission_days[i] == current_day - timedelta(days=1):
                        streak += 1
                        current_day = submission_days[i]
                    else:
                        break

    return {
        "success": True,
        "data": {
            "total_tests": total_tests,
            "average_score": round(avg_score, 2),
            "accuracy": round(accuracy, 2),
            "total_correct": total_correct,
            "total_wrong": total_wrong,
            "total_questions_attempted": total_questions,
            "total_xp": total_xp,
            "level": level,
            "streak": streak,
            "xp_percentage": round(xp_percentage, 2),
            "next_level_xp": 500,
            "accuracy_trend": accuracy_trend,
            "score_trend": score_trend,
            "recent_attempts": recent_attempts_formatted,
            "subject_stats": [
                {"subject": s[0], "total": s[1], "correct": s[2]} for s in subject_stats_query
            ],
            "weak_topics": weak_topics[:5],
            "strong_topics": strong_topics[:5],
            "daily_quests": [
                {
                    "title": "Solve 10 Questions",
                    "progress": db.exec(
                        select(func.count(QuestionAttempt.id))
                        .join(TestAttempt, QuestionAttempt.attempt_id == TestAttempt.id)
                        .where(TestAttempt.student_id == current_user.id, TestAttempt.submitted_at >= today_start)
                    ).one(),
                    "total": 10,
                    "xp": 50,
                    "type": "questions"
                },
                {
                    "title": "Take 1 Mock Test",
                    "progress": db.exec(
                        select(func.count(TestAttempt.id))
                        .where(TestAttempt.student_id == current_user.id, TestAttempt.submitted_at >= today_start, TestAttempt.is_completed == True)
                    ).one(),
                    "total": 1,
                    "xp": 100,
                    "type": "test"
                }
            ],
            "peer_feed": [
                {
                    "user": u.username,
                    "action": f"completed {a.total_questions or 0} question test",
                    "time": a.submitted_at,
                    "score": f"{a.score or 0}/{a.total_questions}" if a.total_questions else str(a.score or 0)
                }
                for a, u in db.exec(
                    select(TestAttempt, User)
                    .join(User, TestAttempt.student_id == User.id)
                    .where(TestAttempt.student_id != current_user.id)
                    .order_by(desc(TestAttempt.submitted_at))
                    .limit(5)
                ).all()
            ],
            "recent_achievements": [
                {"title": "Perfect Score", "icon": "🎯", "desc": "100% accuracy in a test"} if any(a.correct == a.total_questions for a in total_stats_attempts if a.total_questions and a.total_questions > 0) else None,
                {"title": "Speed Demon", "icon": "⚡", "desc": "Completed test in record time"} if any(a.time_taken is not None and a.time_taken < 300 for a in total_stats_attempts) else None,
            ],
            "recommendation": {
                "text": f"Agent, your current {accuracy:.1f}% accuracy is impressive. To breach the elite ranks, focus on {weak_topics[0]['question__topic'] if weak_topics else 'Mock Tests'} modules. Your {streak}-day streak grants a Level UP bonus." if accuracy > 70 else f"Focus on {weak_topics[0]['question__topic'] if weak_topics else 'Basic Concepts'} to improve your accuracy. Consistent practice will help you level up faster.",
                "target_topic": weak_topics[0]['question__topic'] if weak_topics else "General"
            }
        },
        "message": ""
    }



@router.get("/admin-dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    # User Stats
    total_students = db.exec(select(func.count(User.id)).where(User.role == "student")).one()
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    new_students_today = db.exec(
        select(func.count(User.id)).where(User.role == "student", User.date_joined >= today_start)
    ).one()

    # Subscription Stats
    active_subscriptions = db.exec(
        select(func.count(Subscription.id)).where(Subscription.status == "active")
    ).one()
    
    # Revenue from successful transactions
    total_revenue = db.exec(
        select(func.sum(SubscriptionTransaction.amount)).where(SubscriptionTransaction.status == "completed")
    ).one() or 0

    # Plan Distribution
    plan_distribution = db.exec(
        select(Plan.name, func.count(Subscription.id))
        .join(Plan, Subscription.plan_id == Plan.id)
        .where(Subscription.status == "active")
        .group_by(Plan.name)
    ).all()

    # Engagement Stats
    total_attempts = db.exec(select(func.count(TestAttempt.id))).one()
    total_time_minutes = db.exec(select(func.sum(TestAttempt.time_taken))).one() or 0
    total_time_minutes = round(total_time_minutes / 60, 2)

    # Visitor Stats
    total_visits = db.exec(select(func.count(VisitorRecord.id))).one()
    today_visits = db.exec(
        select(func.count(func.distinct(VisitorRecord.ip_address))).where(VisitorRecord.timestamp >= today_start)
    ).one()
    
    # Live Students (last seen in last 2 minutes)
    two_minutes_ago = datetime.utcnow() - timedelta(minutes=2)
    live_users = db.exec(
        select(func.count(User.id)).where(
            User.role == "student",
            User.last_seen >= two_minutes_ago
        )
    ).one()

    # Users who registered today (already calculated as new_students_today, but let's be explicit)
    # The request mentioned "no of users register or login after visiting"
    # This usually means conversion. For now, we'll provide new registrations today.

    return {
        "success": True,
        "data": {
            "user_stats": {
                "total_students": total_students,
                "new_students_today": new_students_today,
                "live_users": live_users,
            },
            "visitor_stats": {
                "total_visits": total_visits,
                "today_visits": today_visits,
                "conversion_rate": round((new_students_today / today_visits * 100), 2) if today_visits > 0 else 0
            },
            "subscription_stats": {
                "active_subscriptions": active_subscriptions,
                "total_revenue": float(total_revenue),
                "plan_distribution": [
                    {"plan__name": p[0], "count": p[1]} for p in plan_distribution
                ]
            },
            "engagement_stats": {
                "total_attempts": total_attempts,
                "total_test_time_minutes": total_time_minutes,
            }
        },
        "message": ""
    }
