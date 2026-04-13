from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True, ondelete="CASCADE")
    title: str
    message: str
    type: str = Field(index=True)  # 'test', 'material', 'leaderboard', 'rank'
    link: Optional[str] = None
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        schema_extra = {
            "example": {
                "title": "New Mock Test Available",
                "message": "RRB NTPC Grand Test 2026 is now live!",
                "type": "test",
                "link": "/tests/mock/1",
                "is_read": False
            }
        }
