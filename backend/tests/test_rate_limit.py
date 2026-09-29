from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.rate_limit import RateLimitMiddleware, _hits


def test_rate_limiter_blocks_after_threshold():
    # Build a tiny standalone app so this test isn't affected by the
    # ENVIRONMENT=test exemption used for the rest of the suite.
    tiny_app = FastAPI()
    tiny_app.add_middleware(RateLimitMiddleware)

    @tiny_app.post("/api/v1/auth/register")
    def fake_register():
        return {"ok": True}

    key_prefix = "testclient"
    for key in list(_hits.keys()):
        if key.startswith(key_prefix):
            del _hits[key]

    import app.core.rate_limit as rl_module

    original_env = rl_module.settings.ENVIRONMENT
    rl_module.settings.ENVIRONMENT = "production"
    try:
        client = TestClient(tiny_app)
        statuses = [client.post("/api/v1/auth/register").status_code for _ in range(6)]
    finally:
        rl_module.settings.ENVIRONMENT = original_env

    # register is limited to 5 requests per 60s in RATE_LIMITS
    assert statuses[:5] == [200] * 5
    assert statuses[5] == 429
