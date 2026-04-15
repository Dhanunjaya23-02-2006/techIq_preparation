from typing import Generator
from sqlmodel import create_engine, Session
from core.config import settings

engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URL, 
    echo=False, 
    pool_size=10, 
    max_overflow=5,
    pool_pre_ping=True
)

def get_db() -> Generator:
    with Session(engine) as session:
        yield session
