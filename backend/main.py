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
            conn.commit()
            print("DB Migration: login_attempts FK constraint check complete.")
    except Exception as e:
        print(f"DB Migration note (non-critical): {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Custom exception handler to fix UnicodeDecodeError on validation errors with binary data
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors safely to avoid UnicodeDecodeError when binary data 
    (like multipart/form-data with images) is involved.
    """
    errors = exc.errors()
    
    # Sanitize errors to ensure no raw bytes are passed to jsonable_encoder
    # primarily targeting the 'input' field in Pydantic V2 errors
    sanitized_errors = []
    for error in errors:
        safe_error = dict(error)
        if "input" in safe_error and isinstance(safe_error["input"], bytes):
            try:
                # Try to decode if it might be text
                safe_error["input"].decode('utf-8')
            except UnicodeDecodeError:
                # If it's binary, replace with a placeholder or truncated hex
                safe_error["input"] = f"<binary data: {len(safe_error['input'])} bytes>"
        sanitized_errors.append(safe_error)
        
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder({"detail": sanitized_errors}),
    )

# Ensure media directories exist
os.makedirs("media/avatars", exist_ok=True)
os.makedirs("media/pdfs", exist_ok=True)

# Mount media directory for serving files
app.mount("/media", StaticFiles(directory="media"), name="media")


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


# ========================================================================
# Middleware setup
# IMPORTANT: FastAPI/Starlette executes middleware in REVERSE order of addition.
# The LAST middleware added is the FIRST to execute (outermost wrapper).
# CORSMiddleware MUST be the LAST added so it wraps everything and
# always injects CORS headers, even on error/exception responses.
# ========================================================================

# 1. Inner middleware (added first, executed last)
# Only add rate limiting if not explicitly disabled (for performance testing)
if os.getenv("DISABLE_RATE_LIMIT", "false").lower() != "true":
    app.add_middleware(RateLimitMiddleware, limit=100, window=60)

app.add_middleware(SecurityHeadersMiddleware)

# 2. Outermost middleware (added last, executed first) — CORS
# Always include production + dev origins, merged with any env-var origins.
# This guarantees CORS works even if BACKEND_CORS_ORIGINS env var is missing or
# mis-formatted on Railway.
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
print(f"CORS allowed origins: {_all_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_all_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to Railway Exam FastAPI Backend"}
