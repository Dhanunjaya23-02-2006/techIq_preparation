from sqlmodel import Session, select
from core.db import engine
from models.subscriptions import Plan

def check_plans():
    with Session(engine) as session:
        plans = session.exec(select(Plan)).all()
        print(f"Total plans: {len(plans)}")
        for plan in plans:
            print(f"ID: {plan.id}, Name: {plan.name}, Active: {plan.is_active}")

if __name__ == "__main__":
    check_plans()
