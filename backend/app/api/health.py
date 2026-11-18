from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    """Liveness check. Also reports which integrations are configured."""
    settings = get_settings()
    status = settings.integration_status()
    return {
        "status": "ok",
        "service": "finvora-backend",
        "environment": settings.app_env,
        "integrations": status,
        "missing_configuration": [name for name, ok in status.items() if not ok],
    }
