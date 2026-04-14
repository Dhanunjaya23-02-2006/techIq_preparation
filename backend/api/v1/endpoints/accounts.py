from datetime import datetime, timedelta
from typing import Any, List, Optional
import csv
import io
import os
import httpx
import pyotp
import qrcode
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body, Request, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import Session, select, func, delete
from core import security
from core.config import settings
from core.db import get_db
from models.users import User, RefreshToken, TokenBlacklist, LoginAttempt
from models.notifications import Notification
from models.subscriptions import Subscription, Plan
from schemas.users import UserCreate, UserUpdate, UserOut, Token, MFASetupOut, MFALoginIn
from api.deps import get_current_active_user, get_current_active_superuser
from sqlalchemy.exc import IntegrityError

router = APIRouter()

@router.get("/admin-exists")
def check_admin_exists(
    db: Session = Depends(get_db)
) -> Any:
    """Check if any admin user exists in the system."""
    admin_id = db.exec(select(User.id).where(User.role == "admin").limit(1)).first()
    return {"exists": admin_id is not None}



@router.post("/register/otp")
def send_register_otp(
    *,
    db: Session = Depends(get_db),
    email: str = Body(..., embed=True),
    background_tasks: BackgroundTasks,
) -> Any:
    """Send OTP for registration verification."""
    user = db.exec(select(User.id).where(User.email == email).limit(1)).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    from models.verification import VerificationCode
    
    # Check for recent OTP (cooldown)
    # We allow bypass if the global rate limit is disabled (for testing)
    is_rate_limit_disabled = os.getenv("DISABLE_RATE_LIMIT", "false").lower() == "true"
    
    if not is_rate_limit_disabled:
        cooldown_seconds = 10 # Shortened for better dev experience
        cooldown_ago = datetime.utcnow() - timedelta(seconds=cooldown_seconds)
        recent_otp = db.exec(
            select(VerificationCode).where(
                VerificationCode.email == email,
                VerificationCode.created_at > cooldown_ago
            ).limit(1)
        ).first()
        if recent_otp:
            raise HTTPException(
                status_code=429, 
                detail=f"Please wait {cooldown_seconds} seconds before requesting another OTP."
            )
    
    import random
    import string
    code = ''.join(random.choices(string.digits, k=6))
    
    from utils.email import send_otp_email
    background_tasks.add_task(send_otp_email, email, code)
    
    vc = VerificationCode(email=email, code=code)
    db.add(vc)
    db.commit()
    
    return {"message": "Verification code sent to your email"}


@router.post("/register", response_model=UserOut)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate
) -> Any:
    """Register a new user (student)."""
    # 1. Faster preliminary checks
    user = db.exec(select(User.id).where(User.email == user_in.email).limit(1)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    # Check if username exists
    username = user_in.username or user_in.email.split('@')[0]
    existing_username = db.exec(select(User.id).where(User.username == username).limit(1)).first()
    if existing_username:
        import random
        username = f"{username}_{random.randint(100, 999)}"

    # 2. Verify OTP
    from models.verification import VerificationCode
    
    # Check via External OTP Service if configured
    if settings.OTP_SERVICE_URL:
        import httpx
        logger.info(f"Verifying real-time OTP for {user_in.email} via external service...")
        try:
            with httpx.Client(timeout=10) as client:
                # Get the base URL (remove any trailing paths if user provided the full generate URL)
                base_url = settings.OTP_SERVICE_URL.rstrip('/')
                if "/api/otp/generate" in base_url:
                    base_url = base_url.replace("/api/otp/generate", "")
                
                verify_url = f"{base_url.rstrip('/')}/api/otp/verify"
                resp = client.post(verify_url, json={
                    "email": user_in.email,
                    "otp": user_in.otp
                })
                if resp.status_code not in [200, 201]:
                    # If external fails, we fallback to local DB check just in case
                    logger.warning("External verification failed, checking local DB...")
                    vc = db.exec(
                        select(VerificationCode).where(
                            VerificationCode.email == user_in.email,
                            VerificationCode.code == user_in.otp,
                            VerificationCode.is_used == False,
                            VerificationCode.expires_at > datetime.utcnow()
                        )
                    ).first()
                    if not vc:
                        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
                else:
                    logger.info("External verification successful.")
                    vc = None # We treat it as valid
        except Exception as e:
            logger.error(f"OTP Service verification error: {e}")
            raise HTTPException(status_code=500, detail="OTP Verification service unavailable")
    else:
        # Standard local verification
        vc = db.exec(
            select(VerificationCode).where(
                VerificationCode.email == user_in.email,
                VerificationCode.code == user_in.otp,
                VerificationCode.is_used == False,
                VerificationCode.expires_at > datetime.utcnow()
            )
        ).first()
        
        if not vc:
            raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    new_user = User(
        email=user_in.email,
        username=username,
        password=security.get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        phone=user_in.phone,
        role="student",
        is_active=True,
        is_verified=True, # Mark as verified after successful OTP check
    )
    
    # 3. Add with IntegrityError safety net
    try:
        db.add(new_user)
        if vc:
            vc.is_used = True
            db.add(vc)
        
        # Create notification
        notif = Notification(
            user_id=None, # System/Admin notification
            type="admin_alert",
            title="New Registration",
            message=f"New student {username} has registered."
        )
        db.add(notif)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A user with this email or username already exists.",
        )
        
    return new_user


@router.post("/login", response_model=Token)
async def login_access_token(
    request: Request,
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Accepts email or username in the 'username' field.
    Includes rate limiting to prevent brute-force attacks.
    """
    ip_address = request.client.host
    
    # 1. Check Rate Limit (e.g., 5 failed attempts in 15 mins)
    # Bypass if rate limit is disabled (for testing environments)
    is_rate_limit_disabled = os.getenv("DISABLE_RATE_LIMIT", "false").lower() == "true"
    
    if not is_rate_limit_disabled:
        fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
        failed_attempts = db.exec(
            select(func.count()).select_from(LoginAttempt).where(
                (LoginAttempt.ip_address == ip_address) | (LoginAttempt.username == form_data.username),
                LoginAttempt.success == False,
                LoginAttempt.timestamp > fifteen_mins_ago
            )
        ).one()
        
        if failed_attempts >= 5:
            raise HTTPException(
                status_code=429, 
                detail="Too many failed login attempts. Please try again after 15 minutes."
            )

    # Note: Using custom body for MFA support, but keeping OAuth2 style for compatibility
    mfa_code = None
    try:
        # Check if it's a JSON body with mfa_code (for React)
        body = await request.json()
        mfa_code = body.get("mfa_code")
    except:
        pass

    # Try email first, then username
    user = db.exec(select(User).where(User.email == form_data.username)).first()
    if not user:
        user = db.exec(select(User).where(User.username == form_data.username)).first()
    
    is_valid = user and security.verify_password(form_data.password, user.password)
    
    # Record Login Attempt
    attempt = LoginAttempt(
        username=form_data.username,
        ip_address=ip_address,
        success=is_valid
    )
    db.add(attempt)
    db.commit()

    if not is_valid:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    elif not user.is_verified:
        raise HTTPException(status_code=401, detail="Email not verified. Please verify your email first.")

    # 2. MFA Check
    if user.mfa_enabled:
        if not mfa_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="MFA_REQUIRED"
            )
        
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(mfa_code):
            raise HTTPException(status_code=400, detail="Invalid MFA code")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    refresh_token_str = security.create_refresh_token(
        user.id, expires_delta=refresh_token_expires
    )
    
    # Store refresh token in DB
    db_refresh_token = RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=datetime.utcnow() + refresh_token_expires
    )
    db.add(db_refresh_token)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
    }


@router.get("/profile", response_model=UserOut)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    return current_user


@router.patch("/profile", response_model=UserOut)
async def update_user_me(
    *,
    db: Session = Depends(get_db),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    target_exam: Optional[str] = Form(None),
    preferred_language: Optional[str] = Form(None),
    old_password: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update current user profile."""
    if password:
        if not old_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not security.verify_password(old_password, current_user.password):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        current_user.password = security.get_password_hash(password)

    if first_name is not None: current_user.first_name = first_name
    if last_name is not None: current_user.last_name = last_name
    if phone is not None: current_user.phone = phone
    if target_exam is not None: current_user.target_exam = target_exam
    if preferred_language is not None: current_user.preferred_language = preferred_language
    
    if password:
        current_user.password = security.get_password_hash(password)
        
    if avatar:
        # Save avatar file
        file_extension = os.path.splitext(avatar.filename)[1]
        file_name = f"user_{current_user.id}_{int(datetime.utcnow().timestamp())}{file_extension}"
        file_path = f"media/avatars/{file_name}"
        
        # Ensure directory exists (redundant if main.py does it, but good for safety)
        os.makedirs("media/avatars", exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            content = await avatar.read()
            buffer.write(content)
            
        # Store path relative to root for serving via /media mount
        current_user.avatar = f"/media/avatars/{file_name}"
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/users", response_model=List[UserOut])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    users = db.exec(select(User).where(User.role == "student").offset(skip).limit(limit)).all()
    return users


@router.delete("/users/{user_id}", response_model=UserOut)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Delete a user and all related data (Cascading)."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 1. Handle non-cascading file cleanup (Avatars)
    if user.avatar and os.path.exists(user.avatar.lstrip("/")):
        try:
            os.remove(user.avatar.lstrip("/"))
        except Exception as e:
            print(f"Error removing avatar: {e}")

    # 2. Perform DB Deletion
    # The database will cleanly handle all relations (TestAttempts, Notifications, Subscriptions, etc.)
    # through native ondelete="CASCADE" and "SET NULL" constraints.
    db.delete(user)
    db.commit()
    return user


class BulkActivateRequest(BaseModel):
    user_ids: List[int]
    plan_type: Optional[str] = "pro"
    plan_id: Optional[int] = None


class BulkDeleteRequest(BaseModel):
    user_ids: List[int]

@router.post("/users/bulk-activate")
def bulk_activate_users(
    *,
    db: Session = Depends(get_db),
    request: BulkActivateRequest,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Activate and upgrade users to premium (Pro or Elite)."""
    if request.plan_id:
        plan = db.get(Plan, request.plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail=f"Plan ID {request.plan_id} not found")
    else:
        plan_name = "Elite Mastery" if request.plan_type.lower() == "elite" else "Pro Premium"
        # Try to find the specified plan, or any active plan if not found
        plan = db.exec(select(Plan).where(Plan.name == plan_name)).first()
        if not plan:
            # Try a partial match if exact name fails
            plan = db.exec(select(Plan).where(Plan.name.ilike(f"%{request.plan_type}%"), Plan.is_active == True)).first()
        
        if not plan:
            plan = db.exec(select(Plan).where(Plan.is_active == True)).first()
        
        if not plan:
            # Fallback: Create a default plan if none exist
            plan = Plan(
                name=plan_name,
                description=f"Default activated {request.plan_type} plan",
                price=0.0,
                duration_days=365,
                is_active=True,
                is_elite=(request.plan_type.lower() == "elite")
            )
            db.add(plan)
            db.commit()
            db.refresh(plan)

    users = db.exec(select(User).where(User.id.in_(request.user_ids))).all()
    for user in users:
        user.is_active = True
        
        user.is_premium = True
        user.is_elite = plan.is_elite
        
        # Create or update subscription
        existing_sub = db.exec(
            select(Subscription).where(
                Subscription.user_id == user.id,
                Subscription.status == "active"
            )
        ).first()
        
        if existing_sub:
            existing_sub.end_date = datetime.utcnow() + timedelta(days=plan.duration_days)
            existing_sub.plan_id = plan.id
            db.add(existing_sub)
        else:
            new_sub = Subscription(
                user_id=user.id,
                plan_id=plan.id,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=plan.duration_days),
                status="active"
            )
            db.add(new_sub)
        
        db.add(user)
    db.commit()
    return {"message": f"Successfully activated {len(users)} users to {plan.name}."}


@router.post("/users/bulk-delete")
def bulk_delete_users(
    *,
    db: Session = Depends(get_db),
    request: BulkDeleteRequest,
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """Delete multiple users and all related data (Cascading)."""
    users = db.exec(select(User).where(User.id.in_(request.user_ids))).all()
    deleted_count = 0
    
    for user in users:
        # 1. Handle non-cascading file cleanup (Avatars)
        if user.avatar and os.path.exists(user.avatar.lstrip("/")):
            try:
                os.remove(user.avatar.lstrip("/"))
            except Exception as e:
                print(f"Error removing avatar for user {user.id}: {e}")

        # 2. Perform DB Deletion
        db.delete(user)
        deleted_count += 1
        
    db.commit()
    return {"message": f"Successfully deleted {deleted_count} users."}


@router.post("/users/bulk-register")
async def bulk_register_users(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_superuser),
) -> Any:
    """
    Register multiple users from a CSV file.
    Expected CSV columns: email, first_name, last_name, phone
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    content = await file.read()
    decoded_content = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded_content))
    
    created_count = 0
    errors = []
    
    for row_idx, row in enumerate(csv_reader, start=2): # Row 1 is header
        email = row.get('email', '').strip()
        first_name = row.get('first_name', '').strip()
        last_name = row.get('last_name', '').strip()
        phone = row.get('phone', '').strip()
        
        if not email:
            errors.append(f"Row {row_idx}: Missing email")
            continue
            
        # Check if user already exists
        existing_user = db.exec(select(User.id).where(User.email == email).limit(1)).first()
        if existing_user:
            errors.append(f"Row {row_idx}: User with email {email} already exists")
            continue
            
        # Create username from email prefix
        username = email.split('@')[0]
        # Handle duplicates in username just in case
        existing_username = db.exec(select(User.id).where(User.username == username).limit(1)).first()
        if existing_username:
            username = f"{username}_{row_idx}"

        new_user = User(
            username=username,
            email=email,
            password=security.get_password_hash("Welcome123!"), # Default password
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role="student",
            is_active=True,
            is_premium=False
        )
        
        try:
            db.add(new_user)
            db.commit()
            
            # Dispatch admin notification for each registered user
            notif = Notification(
                type="admin_alert",
                title="New Registration",
                message=f"User {username} has successfully registered via bulk upload."
            )
            db.add(notif)
            db.commit()
            
            created_count += 1
        except IntegrityError:
            db.rollback()
            errors.append(f"Row {row_idx}: Database constraint violation (email or username already exists)")
        
    
    return {
        "message": f"Successfully registered {created_count} users.",
        "created_count": created_count,
        "errors": errors
    }


@router.post("/token/refresh", response_model=Token)
def refresh_token(
    *,
    db: Session = Depends(get_db),
    refresh_token_str: str = Body(..., embed=True),
) -> Any:
    """
    Refresh access token using a refresh token.
    Implements refresh token rotation.
    """
    # 1. Basic JWT validation
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(
            refresh_token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("token_type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # 2. Check DB for token existence and validity
    db_token = db.exec(
        select(RefreshToken).where(
            RefreshToken.token == refresh_token_str,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        )
    ).first()
    
    if not db_token:
        # Potential refresh token reuse attack! 
        # In a real system, we might revoke ALL refresh tokens for this user here.
        raise HTTPException(status_code=401, detail="Refresh token invalid or expired")

    # 3. Rotate tokens
    # Revoke old token
    db_token.is_revoked = True
    db.add(db_token)
    
    # Create new tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    new_access_token = security.create_access_token(
        user_id, expires_delta=access_token_expires
    )
    new_refresh_token_str = security.create_refresh_token(
        user_id, expires_delta=refresh_token_expires
    )
    
    # Store new refresh token
    new_db_token = RefreshToken(
        token=new_refresh_token_str,
        user_id=user_id,
        expires_at=datetime.utcnow() + refresh_token_expires
    )
    db.add(new_db_token)
    db.commit()
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token_str,
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    refresh_token: Optional[str] = Body(None, embed=True)
):
    """Logout current user and revoke refresh token."""
    if refresh_token:
        db.exec(
            delete(RefreshToken).where(
                RefreshToken.token == refresh_token,
                RefreshToken.user_id == current_user.id
            )
        )
        db.commit()
    return {"message": "Successfully logged out"}


def generate_qr_base64(uri: str) -> str:
    """Generate a base64 encoded QR code image from a URI."""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"


@router.post("/mfa/setup", response_model=MFASetupOut)
def setup_mfa(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Generate TOTP secret and provisioning URI for MFA setup."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email, 
        issuer_name=settings.PROJECT_NAME
    )
    
    return {
        "secret": secret,
        "provisioning_uri": provisioning_uri,
        "qr_code": generate_qr_base64(provisioning_uri)
    }


@router.post("/mfa/verify")
def verify_mfa(
    *,
    db: Session = Depends(get_db),
    secret: str = Body(..., embed=True),
    code: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Verify code and enable MFA for the user."""
    if current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
        
    totp = pyotp.TOTP(secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    current_user.mfa_secret = secret
    current_user.mfa_enabled = True
    db.add(current_user)
    db.commit()
    
    return {"message": "MFA enabled successfully"}


@router.post("/mfa/disable")
def disable_mfa(
    *,
    db: Session = Depends(get_db),
    code: str = Body(..., embed=True),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Disable MFA (requires current MFA code)."""
    if not current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled")
        
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")
        
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    db.add(current_user)
    db.commit()
    
    return {"message": "MFA disabled successfully"}


@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(get_db),
    email: str = Body(..., embed=True),
    background_tasks: BackgroundTasks,
) -> Any:
    """Generate and send/log password reset code."""
    user = db.exec(select(User.id).where(User.email == email).limit(1)).first()
    if not user:
        # Avoid user enumeration: same response if user doesn't exist
        return {"message": "If an account exists with this email, a reset code has been sent."}
    
    from models.verification import VerificationCode
    
    # Check for recent reset code (cooldown) to prevent spam
    is_rate_limit_disabled = os.getenv("DISABLE_RATE_LIMIT", "false").lower() == "true"
    
    if not is_rate_limit_disabled:
        cooldown_seconds = 10
        cooldown_ago = datetime.utcnow() - timedelta(seconds=cooldown_seconds)
        recent_otp = db.exec(
            select(VerificationCode.id).where(
                VerificationCode.email == email,
                VerificationCode.created_at > cooldown_ago
            ).limit(1)
        ).first()
        if recent_otp:
            raise HTTPException(
                status_code=429, 
                detail=f"Please wait {cooldown_seconds} seconds before requesting another code."
            )
    
    # Generate 6-digit code
    import random
    import string
    code = ''.join(random.choices(string.digits, k=6))
    
    # Store code
    vc = VerificationCode(email=email, code=code)
    db.add(vc)
    db.commit()
    
    # Send verification email
    from utils.email import send_otp_email
    background_tasks.add_task(send_otp_email, email, code)
    
    print(f"PASSWORD RESET CODE FOR {email}: {code}")
    
    return {"message": "If an account exists with this email, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(get_db),
    email: str = Body(..., embed=True),
    code: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
) -> Any:
    """Verify code and update password."""
    from models.verification import VerificationCode
    
    # Check for Master OTP bypass first
    is_master_otp = code == settings.MASTER_OTP and settings.MASTER_OTP != ""
    
    vc = None
    if not is_master_otp:
        vc = db.exec(
            select(VerificationCode).where(
                VerificationCode.email == email,
                VerificationCode.code == code,
                VerificationCode.is_used == False,
                VerificationCode.expires_at > datetime.utcnow()
            )
        ).first()
        
        if not vc:
            raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
    user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.password = security.get_password_hash(new_password)
    if vc:
        vc.is_used = True
        db.add(vc)
    db.commit()
    
    return {"message": "Password updated successfully"}
