from sqlmodel import Session, select
from core.db import engine
from models.subscriptions import Plan
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_plans():
    with Session(engine) as session:
        # 1. Deactivate existing plans
        logger.info("Deactivating existing plans...")
        old_plans = session.exec(select(Plan).where(Plan.is_active == True)).all()
        for plan in old_plans:
            plan.is_active = False
            session.add(plan)
        session.commit()

        # 2. Add standard plans
        standard_plans = [
            Plan(
                name="Starter",
                ui_slug="recruit",
                description="Perfect for basic training and fundamental concept clearance.",
                price=199.0,
                duration_days=30,
                features=["Basic Mock Tests", "Daily Quizzes", "Limited Study Material", "Performance Tracking"],
                is_active=True
            ),
            Plan(
                name="Pro",
                ui_slug="veteran",
                badge="POPULAR",
                description="Become a battle-hardened aspirant with full test access.",
                price=499.0,
                duration_days=180,
                features=[
                    "Unlimited Mock Tests", 
                    "Full Grand Test Access", 
                    "All Previous Year Questions", 
                    "Priority Current Affairs", 
                    "Advanced Analytics"
                ],
                is_active=True
            ),
            Plan(
                name="Elite",
                ui_slug="legendary",
                description="Master every dimension of the exam with personal mentorship.",
                price=999.0,
                duration_days=365,
                features=[
                    "Everything in Pro", 
                    "Personal Mentorship", 
                    "Weekly Strategy Calls", 
                    "Doubt Clearing Sessions", 
                    "Lifetime Updates",
                    "Elite Badge on Leaderboard"
                ],
                is_active=True,
                is_elite=True
            )
        ]

        logger.info("Adding standard plans...")
        for plan in standard_plans:
            session.add(plan)
        
        session.commit()
        logger.info("Successfully seeded standard pricing plans.")

if __name__ == "__main__":
    seed_plans()
