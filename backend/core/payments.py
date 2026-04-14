from datetime import datetime, timedelta
from sqlmodel import Session, select
from models.users import User
from models.subscriptions import Plan, Subscription, SubscriptionTransaction
from models.notifications import Notification

def upgrade_user_subscription(
    db: Session, 
    user_id: int, 
    plan_id: int, 
    payment_id: str, 
    transaction_id: str
):
    """
    Shared logic to upgrade a user's subscription after a successful payment.
    Used by both the manual verify-payment endpoint and the Razorpay Webhook.
    """
    user = db.get(User, user_id)
    plan = db.get(Plan, plan_id)
    if not user or not plan:
        return False

    # 1. Update Transaction
    transaction = db.exec(
        select(SubscriptionTransaction).where(
            SubscriptionTransaction.transaction_id == transaction_id
        )
    ).first()
    
    if transaction:
        transaction.status = "completed"
        transaction.payment_id = payment_id
        db.add(transaction)

    # 2. Update or create subscription
    active_subs = db.exec(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.status == "active"
        )
    ).all()
    
    for sub in active_subs:
        sub.status = "expired"
        
    end_date = datetime.utcnow() + timedelta(days=plan.duration_days)
    new_sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        start_date=datetime.utcnow(),
        end_date=end_date,
        status="active",
        payment_id=payment_id
    )
    
    user.is_premium = True
    user.is_elite = plan.is_elite
    
    db.add(new_sub)
    db.add(user)
    
    # 3. Dispatch admin notification
    notif = Notification(
        type="admin_alert",
        title="Subscription Payment",
        message=f"{user.username} paid for {plan.name}."
    )
    db.commit()
    return True
