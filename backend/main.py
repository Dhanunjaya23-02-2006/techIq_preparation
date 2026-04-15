from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlmodel import SQLModel
from sqlalchemy import text
from api.v1.api import api_router
from core.config import settings
from core.db import engine
from core.middleware import SecurityHeadersMiddleware, RateLimitMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

# Import all models so SQLModel knows about them
from models import users, questions, tests, content, subscriptions, pdf, notifications, analytics, verification  # noqa


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    # Fix: Drop the foreign key constraint on login_attempts.username
    # The column should NOT be a foreign key because we need to log
    # login attempts for usernames/emails that don't exist in the users table.
    try:
        with engine.connect() as conn:
            conn.execute(text(
                "ALTER TABLE login_attempts DROP CONSTRAINT IF EXISTS login_attempts_username_fkey"
            ))
            
            # DB Migration: Add missing is_elite columns
            try:
                conn.execute(text("ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_elite BOOLEAN DEFAULT FALSE"))
            except Exception as inner_e:
                print(f"Skipping plans.is_elite addition (might exist): {inner_e}")
                
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_elite BOOLEAN DEFAULT FALSE"))
            except Exception as inner_e:
                print(f"Skipping users.is_elite addition (might exist): {inner_e}")

            conn.commit()
            print("DB Migration: login_attempts FK constraint and missing columns check complete.")
    except Exception as e:
        print(f"DB Migration note (non-critical): {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# ========================================================================
# CORS configuration
# ========================================================================
_ALWAYS_ALLOWED_ORIGINS = {
    "https://tech-iq-preparation.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5188",
    "http://127.0.0.1:5188",
}

if settings.BACKEND_CORS_ORIGINS:
    _env_origins = {str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS}
else:
    _env_origins = set()

_all_origins = list(_ALWAYS_ALLOWED_ORIGINS | _env_origins)

# ========================================================================
# Exception Handlers
# ========================================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors safely to avoid UnicodeDecodeError when binary data 
    (like multipart/form-data with images) is involved.
    """
    errors = exc.errors()
    sanitized_errors = []
    for error in errors:
        safe_error = dict(error)
        if "input" in safe_error and isinstance(safe_error["input"], bytes):
            try:
                # Try to decode if it might be text
                safe_error["input"].decode('utf-8')
            except UnicodeDecodeError:
                safe_error["input"] = f"<binary data: {len(safe_error['input'])} bytes>"
        sanitized_errors.append(safe_error)
        
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": sanitized_errors}),
    )

@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Ensure CORS headers are appended to all HTTP exceptions (like 401 Unauthorized).
    """
    origin = request.headers.get("origin")
    headers = dict(exc.headers) if exc.headers else {}
    
    if origin and (origin in _ALWAYS_ALLOWED_ORIGINS or origin in _env_origins or "*" in _all_origins):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
        
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
    )

# ========================================================================
# Middleware setup
# IMPORTANT: FastAPI/Starlette executes middleware in REVERSE order of addition.
# The LAST middleware added is the FIRST to execute (outermost wrapper).
# CORSMiddleware MUST be the LAST added so it wraps everything.
# ========================================================================

# 1. Inner middleware (added first)
if os.getenv("DISABLE_RATE_LIMIT", "false").lower() != "true" and not settings.DEBUG:
    app.add_middleware(RateLimitMiddleware, limit=200, window=60)

app.add_middleware(SecurityHeadersMiddleware)

# 2. Outermost middleware (added last) - CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_all_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Ensure media directories exist
os.makedirs("media/avatars", exist_ok=True)
os.makedirs("media/pdfs", exist_ok=True)

# Mount media directory for serving files
app.mount("/media", StaticFiles(directory="media"), name="media")


@app.on_event("startup")
def on_startup():
    import tempfile
    
    lock_dir = os.path.join(tempfile.gettempdir(), "techiq_startup.lock")
    
    try:
        os.mkdir(lock_dir)
        is_main_worker = True
    except FileExistsError:
        is_main_worker = False
    
    if is_main_worker:
        create_db_and_tables()
        
        # Synchronize plans - idempotent operation ensuring only one of each plan is active
        try:
            from seed_plans import seed_plans
            print("Synchronizing subscription plans...")
            seed_plans()
        except Exception as e:
            print(f"Error synchronizing plans: {e}")
    else:
        # Other workers can briefly yield to allow the main worker 
        # to execute the schema alterations first.
        import time
        time.sleep(2)


app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to Railway Exam FastAPI Backend"}
