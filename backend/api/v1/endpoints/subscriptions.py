from typing import Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from core.db import get_db
from core.config import settings
import razorpay
from models.subscriptions import Plan, Subscription, SubscriptionTransaction
from models.notifications import Notification
from models.users import User
from api.deps import get_current_active_user, get_current_active_superuser
from datetime import datetime, timedelta
from core.payments import upgrade_user_subscription

router = APIRouter()

PLAN_LEVELS = {
    "No Plan": 0,
    "Starter": 1,
    "Pro": 2,
    "Elite": 3
}

class CheckoutRequest(BaseModel):
    plan_id: int

@router.get("/plans/", response_model=List[Plan])
def read_plans(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    plans = db.exec(select(Plan).where(Plan.is_active == True).offset(skip).limit(limit)).all()
    return plans


@router.get("/my/")
def get_my_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    sub = db.exec(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).order_by(Subscription.created_at.desc())
    ).first()
    
    if not sub:
        return {
            "status": "none",
            "plan": None,
            "end_date": None
        }
    
    plan = db.get(Plan, sub.plan_id)
    return {
        "status": sub.status,
        "plan": plan,
        "end_date": sub.end_date
    }


@router.post("/checkout/")
def create_transaction(
    *,
    db: Session = Depends(get_db),
    checkout_data: CheckoutRequest,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    plan = db.get(Plan, checkout_data.plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    current_plan_name = current_user.current_plan
    current_level = PLAN_LEVELS.get(current_plan_name, 0)
    target_level = PLAN_LEVELS.get(plan.name, 0)

    if target_level <= current_level and current_level > 0:
        message = f"You already have an active {current_plan_name} plan."
        if target_level < current_level:
            message = f"You already have a higher tier ({current_plan_name}) plan."
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{message} Multiple or lower-tier active subscriptions are not allowed."
        )
        
    amount_to_pay = plan.price

    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        order_data = {
            "amount": int(amount_to_pay * 100),
            "currency": "INR",
            "receipt": f"rcpt_{current_user.id}_{plan.id}"
        }
        order = client.order.create(data=order_data)
        transaction_id = order["id"]
        
        transaction = SubscriptionTransaction(
            user_id=current_user.id,
            plan_id=checkout_data.plan_id,
            amount=amount_to_pay,
            provider="razorpay",
            transaction_id=transaction_id,
            status="pending"
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        return {
            "order_id": transaction_id,
            "amount": int(amount_to_pay * 100),
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-payment/")
def verify_payment(
    *,
    db: Session = Depends(get_db),
    payment_data: dict,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        client.utility.verify_payment_signature(payment_data)
        
        transaction = db.exec(
            select(SubscriptionTransaction).where(
                SubscriptionTransaction.transaction_id == payment_data.get("razorpay_order_id")
            )
        ).first()
        
        if not transaction:
             raise HTTPException(status_code=404, detail="Transaction not found")
             
        # Use shared utility to upgrade user
        success = upgrade_user_subscription(
            db=db,
            user_id=current_user.id,
            plan_id=transaction.plan_id,
            payment_id=payment_data.get("razorpay_payment_id"),
            transaction_id=payment_data.get("razorpay_order_id")
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to upgrade subscription")
            
        return {"status": "success", "message": "Payment verified and subscription activated"}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Signature Verification Failed")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
