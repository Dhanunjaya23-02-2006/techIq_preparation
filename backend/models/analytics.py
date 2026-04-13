from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class VisitorRecord(SQLModel, table=True):
    __tablename__ = "visitor_records"

    id: Optional[int] = Field(default=None, primary_key=True)
    ip_address: str = Field(index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", ondelete="CASCADE")
    path: str
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
