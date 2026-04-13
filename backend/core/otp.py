import random
import string
from datetime import datetime
from sqlmodel import Session, select
from models.verification import VerificationCode
from core.email import send_otp_email

def generate_otp(db: Session, email: str) -> str:
    # 6-digit numeric OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Check for existing valid code and mark as used/expired
    existing_codes = db.exec(
        select(VerificationCode).where(
            VerificationCode.email == email,
            VerificationCode.is_used == False,
            VerificationCode.expires_at > datetime.utcnow()
        )
    ).all()
    for code in existing_codes:
        code.is_used = True
        db.add(code)
    
    db_code = VerificationCode(email=email, code=otp_code)
    db.add(db_code)
    db.commit()
    
    # Send via email
    send_otp_email(email, otp_code)
    
    return otp_code

def verify_otp(db: Session, email: str, otp_code: str) -> bool:
    db_code = db.exec(
        select(VerificationCode).where(
            VerificationCode.email == email,
            VerificationCode.code == otp_code,
            VerificationCode.is_used == False,
            VerificationCode.expires_at > datetime.utcnow()
        )
    ).first()
    
    if db_code:
        db_code.is_used = True
        db.add(db_code)
        db.commit()
        return True
    return False
