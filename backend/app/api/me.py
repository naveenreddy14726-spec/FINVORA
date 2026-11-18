from fastapi import APIRouter, Depends, HTTPException

from app.core.db import Database, DatabaseUnavailable
from app.core.deps import CurrentUser, get_current_user, get_db, require_admin

router = APIRouter(tags=["account"])


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user), db: Database = Depends(get_db)) -> dict:
    try:
        plan = db.get_active_plan(user.id)
    except DatabaseUnavailable:
        raise HTTPException(503, detail={"code": "DB_UNAVAILABLE", "message": "Database unavailable."})
    # Phase 4 replaces this with the full entitlement engine (trial + paid + expiry).
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "plan": plan,
    }


@router.get("/admin/me")
def admin_me(admin: CurrentUser = Depends(require_admin)) -> dict:
    """Used by the frontend to decide whether to show /admin. The real protection is here."""
    return {"id": admin.id, "email": admin.email, "role": admin.role}
