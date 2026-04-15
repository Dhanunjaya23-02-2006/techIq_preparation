from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response as StarletteResponse
import time
import redis.asyncio as redis
from fastapi.responses import JSONResponse
from core.config import settings


class SecurityHeadersMiddleware:
    """
    Pure ASGI middleware for security headers.
    
    Unlike BaseHTTPMiddleware, this does NOT interfere with
    CORSMiddleware's ability to inject CORS headers on error responses.
    """
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                extra_headers = [
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                    (b"x-xss-protection", b"1; mode=block"),
                    (b"strict-transport-security", b"max-age=31536000; includeSubDomains"),
                    (b"referrer-policy", b"strict-origin-when-cross-origin"),
                ]
                existing = list(message.get("headers", []))
                existing.extend(extra_headers)
                message["headers"] = existing
            await send(message)

        await self.app(scope, receive, send_with_headers)


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
                    socket_connect_timeout=0.5,
                    socket_timeout=0.5
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
