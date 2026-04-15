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


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp, limit: int = 100, window: int = 60):
        self.app = app
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

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] == "OPTIONS":
            await self.app(scope, receive, send)
            return

        # Attempt to get client IP from scope
        client_ip = "unknown"
        for host, port in [scope.get("client", [])]:
            client_ip = host
            break
            
        if not self.redis_client:
            await self.app(scope, receive, send)
            return

        key = f"rate_limit:{client_ip}"
        try:
            current_count = await self.redis_client.incr(key)
            if current_count == 1:
                await self.redis_client.expire(key, self.window)
            
            if current_count > self.limit:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )
                await response(scope, receive, send)
                return
        except Exception as e:
            print(f"RateLimitMiddleware Error: {e}")
            
        await self.app(scope, receive, send)
