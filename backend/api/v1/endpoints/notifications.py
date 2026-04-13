from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from core.db import get_db
from models.notifications import Notification
from models.users import User
from api.deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[Notification])
def read_notifications(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve notifications for the current user.
    If the user is an admin, they only see 'admin_alert' notifications.
    Otherwise, they see user-specific and broadcast (user_id=None) notifications.
    """
    if current_user.role == "admin" or current_user.is_superuser:
        statement = select(Notification).where(
            Notification.type == "admin_alert"
        ).order_by(Notification.created_at.desc())
    else:
        statement = select(Notification).where(
            (Notification.user_id == current_user.id) | (Notification.user_id == None),
            Notification.type != "admin_alert" # don't show admin alerts to regular users
        ).order_by(Notification.created_at.desc())
    
    notifications = db.exec(statement.offset(skip).limit(limit)).all()
    return notifications


@router.patch("/{id}/read")
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Mark a notification as read.
    """
    notification = db.get(Notification, id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    is_admin = current_user.role == "admin" or current_user.is_superuser
    
    # Check authorization
    if notification.type == "admin_alert":
        if not is_admin:
            raise HTTPException(status_code=403, detail="Not authorized")
    else:
        if notification.user_id and notification.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Mark all notifications for the current user as read.
    """
    is_admin = current_user.role == "admin" or current_user.is_superuser
    
    if is_admin:
        statement = select(Notification).where(
            Notification.type == "admin_alert",
            Notification.is_read == False
        )
    else:
        statement = select(Notification).where(
            (Notification.user_id == current_user.id) | (Notification.user_id == None),
            Notification.type != "admin_alert",
            Notification.is_read == False
        )
    notifications = db.exec(statement).all()
    for n in notifications:
        n.is_read = True
        db.add(n)
        
    db.commit()
    return {"message": "All notifications marked as read"}
