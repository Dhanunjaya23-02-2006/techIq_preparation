from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import redis.asyncio as redis
from fastapi.responses import JSONResponse
from core.config import settings

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://tech-iq-preparation.vercel.app http://localhost:5188; "
            "frame-ancestors 'none';"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.redis_client = None
        
        if settings.REDIS_URL:
            try:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL, 
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2
                )
            except Exception as e:
                print(f"RateLimitMiddleware Init Error: {e}")

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        if not self.redis_client:
            return await call_next(request)
            
        try:
            # Fixed window rate limiting
            current_count = await self.redis_client.incr(key)
            if current_count == 1:
                await self.redis_client.expire(key, self.window)
            
            if current_count > self.limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )
        except Exception as e:
            # Fallback: Allow request if Redis is unavailable, but log the error
            print(f"RateLimitMiddleware Error: {e}")
            
        return await call_next(request)
