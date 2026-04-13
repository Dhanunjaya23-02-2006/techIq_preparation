from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlmodel import SQLModel
from api.v1.api import api_router
from core.config import settings
from core.db import engine
from core.middleware import SecurityHeadersMiddleware, RateLimitMiddleware

# Import all models so SQLModel knows about them
from models import users, questions, tests, content, subscriptions, pdf, notifications, analytics, verification  # noqa


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


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


# Middleware setup
app.add_middleware(SecurityHeadersMiddleware)

# Only add rate limiting if not explicitly disabled (for performance testing)
if os.getenv("DISABLE_RATE_LIMIT", "false").lower() != "true":
    app.add_middleware(RateLimitMiddleware, limit=100, window=60)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Fallback for development if no origins specified
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5188",
            "http://127.0.0.1:5188",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to Railway Exam FastAPI Backend"}
