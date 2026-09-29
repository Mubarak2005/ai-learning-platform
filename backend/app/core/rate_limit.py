"""
Phase 12 — basic rate limiting for auth endpoints.

In-memory sliding-window limiter keyed by (client IP, path). This is
adequate for a single-process demo/small deployment; a real production
deployment behind multiple workers or replicas needs a shared store
(Redis) instead, since this dict is per-process and resets on restart.
That swap is isolated to this one file — call sites don't change.
"""

import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings

settings = get_settings()

# path -> (max requests, window seconds)
RATE_LIMITS = {
    "/api/v1/auth/login": (10, 60),
    "/api/v1/auth/login-json": (10, 60),
    "/api/v1/auth/register": (5, 60),
    "/api/v1/auth/otp/send": (5, 300),
    "/api/v1/auth/otp/verify": (10, 300),
    "/api/v1/auth/password-reset/request": (5, 300),
    "/api/v1/auth/password-reset/confirm": (10, 300),
}

_hits: dict[str, deque] = defaultdict(deque)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Disabled under the automated test suite so tests can exercise
        # auth endpoints repeatedly without tripping the limiter — the
        # limiter's own behavior is covered by test_rate_limit.py instead.
        if settings.ENVIRONMENT == "test":
            return await call_next(request)

        limit_config = RATE_LIMITS.get(request.url.path)
        if limit_config:
            max_requests, window_seconds = limit_config
            client_ip = request.client.host if request.client else "unknown"
            key = f"{client_ip}:{request.url.path}"

            now = time.time()
            bucket = _hits[key]
            while bucket and bucket[0] < now - window_seconds:
                bucket.popleft()

            if len(bucket) >= max_requests:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again shortly."},
                )
            bucket.append(now)

        return await call_next(request)
