from typing import List, Optional
from pydantic import BaseModel

class PlanBase(BaseModel):
    name: str
    ui_slug: Optional[str] = None
    badge: Optional[str] = None
    description: Optional[str] = None
    price: float
    duration_days: int = 30
    features: List[str] = []
    is_active: bool = True
    is_elite: bool = False

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    ui_slug: Optional[str] = None
    badge: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration_days: Optional[int] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_elite: Optional[bool] = None
