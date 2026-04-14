from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlmodel import SQLModel, Field, JSON


class Plan(SQLModel, table=True):
    __tablename__ = "plans"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    ui_slug: Optional[str] = None
    badge: Optional[str] = None
    description: Optional[str] = None
    price: float
    duration_days: int = Field(default=30)
    features: List[str] = Field(default=[], sa_type=JSON)
    is_active: bool = Field(default=True)
    is_elite: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    plan_id: int = Field(foreign_key="plans.id", ondelete="CASCADE")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str = Field(default="pending")
    payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SubscriptionTransaction(SQLModel, table=True):
    __tablename__ = "subscription_transactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    subscription_id: Optional[int] = Field(default=None, foreign_key="subscriptions.id", ondelete="CASCADE")
    plan_id: int = Field(foreign_key="plans.id", ondelete="CASCADE")
    amount: float
    provider: str = Field(default="mock_stripe")
    transaction_id: str = Field(unique=True)
    payment_id: Optional[str] = None
    status: str = Field(default="pending")
    error_message: Optional[str] = None
    extra_metadata: Dict[str, Any] = Field(default={}, sa_type=JSON)
    created_at: datetime = Field(default_factory=datetime.utcnow)
