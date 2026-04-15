from sqlmodel import Session, select
from core.db import engine
from models.subscriptions import Plan
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_plans():
    with Session(engine) as session:
        # 1. Define target plans
        target_plans_data = [
            {
                "name": "Starter",
                "ui_slug": "recruit",
                "description": "Perfect for basic training and fundamental concept clearance.",
                "price": 199.0,
                "duration_days": 30,
                "features": ["Basic Mock Tests", "Daily Quizzes", "Limited Study Material", "Performance Tracking"],
                "is_active": True,
                "is_elite": False,
                "badge": None
            },
            {
                "name": "Pro",
                "ui_slug": "veteran",
                "badge": "POPULAR",
                "description": "Become a battle-hardened aspirant with full test access.",
                "price": 499.0,
                "duration_days": 180,
                "features": [
                    "Unlimited Mock Tests", 
                    "Full Grand Test Access", 
                    "All Previous Year Questions", 
                    "Priority Current Affairs", 
                    "Advanced Analytics"
                ],
                "is_active": True,
                "is_elite": False
            },
            {
                "name": "Elite",
                "ui_slug": "legendary",
                "description": "Master every dimension of the exam with personal mentorship.",
                "price": 999.0,
                "duration_days": 365,
                "features": [
                    "Everything in Pro", 
                    "Personal Mentorship", 
                    "Weekly Strategy Calls", 
                    "Doubt Clearing Sessions", 
                    "Lifetime Updates",
                    "Elite Badge on Leaderboard"
                ],
                "is_active": True,
                "is_elite": True,
                "badge": None
            }
        ]

        logger.info("Starting idempotent seeding process...")
        
        target_names = [p["name"] for p in target_plans_data]
        
        # 2. Handle standard plans and their variants
        for plan_data in target_plans_data:
            name = plan_data["name"]
            # Include aliases for better cleanup
            aliases = {
                "Starter": ["Starter Plan"],
                "Pro": ["Pro Premium"],
                "Elite": ["Elite Mastery"]
            }.get(name, [])
            all_variant_names = [name] + aliases

            # Find all active plans with this name or its aliases
            existing_active = session.exec(select(Plan).where(Plan.name.in_(all_variant_names), Plan.is_active == True)).all()
            
            if existing_active:
                # Use the first one (preferring exact name match if possible)
                exact_match = next((p for p in existing_active if p.name == name), existing_active[0])
                primary = exact_match
                
                logger.info(f"Updating existing active plan: {name} (ID: {primary.id})")
                for key, value in plan_data.items():
                    setattr(primary, key, value)
                session.add(primary)
                
                # Deactivate all others
                for p in existing_active:
                    if p.id != primary.id:
                        logger.info(f"Deactivating duplicate/variant plan: {p.name} (ID: {p.id})")
                        p.is_active = False
                        session.add(p)
            else:
                # Try to find an inactive plan with this name to reactivate
                existing_inactive = session.exec(select(Plan).where(Plan.name == name, Plan.is_active == False)).first()
                if existing_inactive:
                    logger.info(f"Reactivating inactive plan: {name} (ID: {existing_inactive.id})")
                    for key, value in plan_data.items():
                        setattr(existing_inactive, key, value)
                    session.add(existing_inactive)
                else:
                    # Create new one
                    logger.info(f"Creating new plan: {name}")
                    new_plan = Plan(**plan_data)
                    session.add(new_plan)

        # 3. Deactivate any OTHER active plans not in our target list and not being a variant
        recognized_names = []
        for p_data in target_plans_data:
            recognized_names.append(p_data["name"])
            if p_data["name"] == "Starter": recognized_names.append("Starter Plan")
            if p_data["name"] == "Pro": recognized_names.append("Pro Premium")
            if p_data["name"] == "Elite": recognized_names.append("Elite Mastery")

        others = session.exec(select(Plan).where(Plan.is_active == True, Plan.name.notin_(recognized_names))).all()
        if others:
            logger.info(f"Deactivating {len(others)} unrecognized active plans.")
            for p in others:
                p.is_active = False
                session.add(p)
        
        session.commit()
        logger.info("Successfully synchronized plan configuration.")

if __name__ == "__main__":
    seed_plans()
