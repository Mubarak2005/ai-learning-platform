from fastapi import APIRouter

from app import __version__
from app.config import get_settings
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", environment=settings.ENVIRONMENT, version=__version__)
