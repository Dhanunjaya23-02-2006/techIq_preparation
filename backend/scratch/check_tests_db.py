
from sqlmodel import Session, select
from core.db import engine
from models.tests import MockTest
from models.users import User

def check_tests():
    with Session(engine) as session:
        tests = session.exec(select(MockTest)).all()
        print(f"Total Tests found: {len(tests)}")
        for t in tests:
            print(f"ID: {t.id}, Title: {t.title}, Active: {t.is_active}, Free: {t.is_free}, Grand: {t.is_grand_test}, PYQ: {t.is_pyq}, Exam: {t.exam_type}")
            
        users = session.exec(select(User)).all()
        print(f"\nTotal Users: {len(users)}")
        for u in users:
             print(f"User: {u.username}, Role: {u.role}, Plan: {u.current_plan}")

if __name__ == "__main__":
    check_tests()
