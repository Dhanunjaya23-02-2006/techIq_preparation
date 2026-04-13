from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: str = Field(default="student", index=True)
    target_exam: Optional[str] = None
    preferred_language: str = Field(default="en")
    is_premium: bool = Field(default=False)
    is_elite: bool = Field(default=False)
    avatar: Optional[str] = None
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    is_staff: bool = Field(default=False)
    is_superuser: bool = Field(default=False)
    date_joined: datetime = Field(default_factory=datetime.utcnow)
    mfa_secret: Optional[str] = None
    mfa_enabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: Optional[datetime] = Field(default=None)

    @property
    def current_plan(self) -> str:
        if self.is_superuser or self.role == "admin" or self.is_elite:
            return "Elite"
        
        from core.db import engine
        from sqlmodel import Session, select
        from models.subscriptions import Subscription, Plan
        with Session(engine) as session:
            sub = session.exec(
                select(Subscription, Plan.name)
                .select_from(Subscription)
                .join(Plan, Subscription.plan_id == Plan.id)
                .where(
                    Subscription.user_id == self.id, 
                    Subscription.status == "active",
                    Subscription.end_date > datetime.utcnow()
                )
            ).first()
            if sub:
                return sub[1]
        
        if self.is_premium:
            return "Pro"
            
        return "No Plan"

    @property
    def total_test_attempts(self) -> int:
        from core.db import engine
        from sqlmodel import Session, select, func
        from models.tests import TestAttempt
        with Session(engine) as session:
            count = session.exec(
                select(func.count())
                .select_from(TestAttempt)
                .where(TestAttempt.student_id == self.id)
            ).one()
            return count

    @property
    def test_counts(self) -> dict:
        from core.db import engine
        from sqlmodel import Session, select, func
        from models.tests import TestAttempt, MockTest
        counts = {"mock": 0, "grand": 0, "pyq": 0}
        with Session(engine) as session:
            # Mock Tests (not pyq, not grand)
            mock_count = session.exec(
                select(func.count())
                .select_from(TestAttempt)
                .join(MockTest, TestAttempt.test_id == MockTest.id)
                .where(TestAttempt.student_id == self.id, MockTest.is_pyq == False, MockTest.is_grand_test == False)
            ).one()
            counts["mock"] = mock_count
            
            # Grand Tests
            grand_count = session.exec(
                select(func.count())
                .select_from(TestAttempt)
                .join(MockTest, TestAttempt.test_id == MockTest.id)
                .where(TestAttempt.student_id == self.id, MockTest.is_grand_test == True)
            ).one()
            counts["grand"] = grand_count
            
            # PYQs
            pyq_count = session.exec(
                select(func.count())
                .select_from(TestAttempt)
                .join(MockTest, TestAttempt.test_id == MockTest.id)
                .where(TestAttempt.student_id == self.id, MockTest.is_pyq == True)
            ).one()
            counts["pyq"] = pyq_count
            
        return counts

    @property
    def last_login(self) -> Optional[datetime]:
        """Alias for last_seen to match frontend expectations."""
        return self.last_seen

    @property
    def total_time_spent(self) -> int:
        """Calculate total time spent in tests (in seconds)."""
        from core.db import engine
        from sqlmodel import Session, select, func
        from models.tests import TestAttempt
        with Session(engine) as session:
            total = session.exec(
                select(func.sum(TestAttempt.time_taken))
                .where(TestAttempt.student_id == self.id)
            ).one()
            return total or 0


    def __str__(self):
        return f"{self.username} ({self.role})"


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    expires_at: datetime
    is_revoked: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TokenBlacklist(SQLModel, table=True):
    __tablename__ = "token_blacklist"

    id: Optional[int] = Field(default=None, primary_key=True)
    jti: str = Field(index=True, unique=True)  # JWT ID
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LoginAttempt(SQLModel, table=True):
    __tablename__ = "login_attempts"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(foreign_key="users.username", ondelete="CASCADE", index=True)
    ip_address: str = Field(index=True)
    success: bool = Field(default=False)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
