"""FastAPI dependencies that decide who a request is and what they may do."""

from dataclasses import dataclass

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings
from app.core.db import Database, DatabaseUnavailable
from app.core.security import InvalidToken, verify_token

bearer = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    id: str
    email: str
    full_name: str | None
    role: str
    status: str
    aal: str


def get_db(settings: Settings = Depends(get_settings)) -> Database:
    if not (settings.supabase_url and settings.supabase_service_role_key):
        raise HTTPException(
            503,
            detail={
                "code": "NOT_CONFIGURED",
                "message": "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
            },
        )
    return Database(settings)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    settings: Settings = Depends(get_settings),
    db: Database = Depends(get_db),
) -> CurrentUser:
    if creds is None:
        raise HTTPException(401, detail={"code": "UNAUTHENTICATED", "message": "Login required."})
    try:
        claims = verify_token(creds.credentials, settings)
    except InvalidToken:
        raise HTTPException(401, detail={"code": "INVALID_TOKEN", "message": "Invalid or expired session."})

    try:
        profile = db.get_profile(claims["sub"])
    except DatabaseUnavailable:
        raise HTTPException(503, detail={"code": "DB_UNAVAILABLE", "message": "Database unavailable."})
    if profile is None:
        raise HTTPException(403, detail={"code": "NO_PROFILE", "message": "Account profile not found."})
    if profile["status"] == "suspended":
        raise HTTPException(403, detail={"code": "SUSPENDED", "message": "This account is suspended."})

    # Role comes from the database, never from the token or the request.
    return CurrentUser(
        id=profile["id"],
        email=profile["email"],
        full_name=profile.get("full_name"),
        role=profile["role"],
        status=profile["status"],
        aal=claims.get("aal", "aal1"),
    )


def require_admin(
    user: CurrentUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(403, detail={"code": "FORBIDDEN", "message": "Admin access required."})
    if settings.admin_require_mfa and user.aal != "aal2":
        raise HTTPException(
            403, detail={"code": "MFA_REQUIRED", "message": "Multi-factor authentication required."}
        )
    return user
