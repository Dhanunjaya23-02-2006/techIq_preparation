from fastapi import APIRouter, Request, HTTPException, Depends, Header
from sqlmodel import Session, select
import razorpay
import json
from core.config import settings
from core.db import get_db
from core.payments import upgrade_user_subscription
from models.subscriptions import SubscriptionTransaction
from models.users import User

router = APIRouter()

@router.post("/razorpay")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_razorpay_signature: str = Header(None)
):
    """
    Handle incoming Razorpay webhooks for payment resilience.
    Verifies signature and processes payment.captured or order.paid events.
    """
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    raw_body = await request.body()
    
    # 1. Verify Signature
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    try:
        client.utility.verify_webhook_signature(
            raw_body.decode("utf-8"), 
            x_razorpay_signature, 
            settings.RAZORPAY_WEBHOOK_SECRET
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # 2. Parse Event
    try:
        data = json.loads(raw_body)
        event = data.get("event")
        payload = data.get("payload", {})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # 3. Handle Supported Events
    if event in ["payment.captured", "order.paid"]:
        payment_entity = payload.get("payment", {}).get("entity", {})
        order_entity = payload.get("order", {}).get("entity", {})
        
        payment_id = payment_entity.get("id")
        order_id = payment_entity.get("order_id") or order_entity.get("id")
        
        if not order_id:
            return {"status": "ignored", "message": "No order_id found"}

        # Find the transaction in our DB
        transaction = db.exec(
            select(SubscriptionTransaction).where(
                SubscriptionTransaction.transaction_id == order_id
            )
        ).first()
        
        if not transaction:
            # Maybe it's a direct payment or we missed the local transaction creation
            # In a real app, we might log this for manual reconciliation
            return {"status": "error", "message": f"Transaction {order_id} not found in DB"}

        if transaction.status == "completed":
            return {"status": "success", "message": "Already processed"}

        # Upgrade the user
        success = upgrade_user_subscription(
            db=db,
            user_id=transaction.user_id,
            plan_id=transaction.plan_id,
            payment_id=payment_id,
            transaction_id=order_id,
            payment_type=transaction.extra_metadata.get("payment_type", "full")
        )
        
        if success:
            return {"status": "success"}
        else:
            return {"status": "error", "message": "Failed to upgrade user"}

    return {"status": "ignored", "message": f"Event {event} not handled"}
