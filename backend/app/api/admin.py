"""Admin API. Every route here requires an authenticated admin (enforced on the router)."""

import uuid
from collections import Counter
from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.db import Database, DatabaseUnavailable, is_uuid
from app.core.deps import CurrentUser, get_db, require_admin

# dependencies=[...] makes require_admin run for EVERY route in this router.
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

PAGE_SIZE_MAX = 100


def _iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _now() -> datetime:
    return datetime.now(UTC)


def _db_error() -> HTTPException:
    return HTTPException(503, detail={"code": "DB_UNAVAILABLE", "message": "Database unavailable."})


# ---------------------------------------------------------------- overview
@router.get("/overview")
def overview(db: Database = Depends(get_db)) -> dict:
    now = _now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month = today.replace(day=1)
    try:
        total = db.count_users()
        pro_ids = set(db.active_pro_user_ids())
        trial_ids = set(db.active_trial_user_ids(_iso(now)))
        paid_or_trial = pro_ids | trial_ids
        users = {
            "total": total,
            "new_today": db.count_users({"created_at": f"gte.{_iso(today)}"}),
            "new_this_month": db.count_users({"created_at": f"gte.{_iso(month)}"}),
            # Effective plan: Pro if an active paid subscription; Trial if an unexpired trial; else Free.
            "free": max(total - len(paid_or_trial), 0),
            "pro": len(pro_ids),
            "trial": len(trial_ids - pro_ids),
            "suspended": db.count_users({"status": "eq.suspended"}),
            "admins": db.count_users({"role": "eq.admin"}),
        }
        subscriptions = {
            "active_pro": len(pro_ids),
            "active_trials": len(trial_ids),
            "expired_trials": db.count_trials({"expires_at": f"lte.{_iso(now)}"}),
            "cancelled": db.count_subscriptions({"status": "eq.cancelled"}),
            "failed": db.count_subscriptions({"status": "eq.failed"}),
        }
    except DatabaseUnavailable:
        raise _db_error()
    unavailable = "Not available until the payments phase is built."
    return {
        "generated_at": _iso(now),
        "users": users,
        "subscriptions": subscriptions,
        "revenue": {"available": False, "reason": unavailable},
        "ai": {"available": False, "reason": "Not available until the AI assistant phase is built."},
    }


@router.get("/analytics/signups")
def signups(days: int = Query(30, ge=7, le=90), db: Database = Depends(get_db)) -> dict:
    start = (_now() - timedelta(days=days - 1)).replace(hour=0, minute=0, second=0, microsecond=0)
    try:
        stamps = db.signup_timestamps_since(_iso(start))
    except DatabaseUnavailable:
        raise _db_error()
    per_day = Counter(s[:10] for s in stamps)
    series = []
    for i in range(days):
        d = (start + timedelta(days=i)).strftime("%Y-%m-%d")
        series.append({"date": d, "signups": per_day.get(d, 0)})
    return {"days": days, "total": len(stamps), "series": series}


# ---------------------------------------------------------------- users
def _effective_plan(user_id: str, plans: dict[str, str], trials: dict[str, dict], now_iso: str) -> str:
    if plans.get(user_id) == "pro":
        return "pro"
    t = trials.get(user_id)
    if t and t["expires_at"] > now_iso:
        return "trial"
    return "free"


@router.get("/users")
def list_users(
    q: str | None = Query(None, max_length=100),
    status: Literal["active", "suspended"] | None = None,
    plan: Literal["free", "pro", "trial"] | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=PAGE_SIZE_MAX),
    db: Database = Depends(get_db),
) -> dict:
    now_iso = _iso(_now())
    include: list[str] | None = None
    exclude: list[str] | None = None
    try:
        if plan == "pro":
            include = db.active_pro_user_ids()
        elif plan == "trial":
            pro = set(db.active_pro_user_ids())
            include = [u for u in db.active_trial_user_ids(now_iso) if u not in pro]
        elif plan == "free":
            exclude = list(set(db.active_pro_user_ids()) | set(db.active_trial_user_ids(now_iso)))
        rows, total = db.list_profiles(q, status, include, exclude, (page - 1) * page_size, page_size)
        ids = [r["id"] for r in rows]
        plans = db.active_plans_for_users(ids)
        trials = db.trials_for_users(ids)
    except DatabaseUnavailable:
        raise _db_error()
    items = [
        {
            **r,
            "plan": _effective_plan(r["id"], plans, trials, now_iso),
            "trial_expires_at": trials.get(r["id"], {}).get("expires_at"),
        }
        for r in rows
    ]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/users/{user_id}")
def user_detail(user_id: str, db: Database = Depends(get_db)) -> dict:
    if not is_uuid(user_id):
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "User not found."})
    now_iso = _iso(_now())
    try:
        profile = db.get_profile(user_id)
        if profile is None:
            raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "User not found."})
        subs = db.get_user_subscriptions(user_id)
        trial = db.get_user_trial(user_id)
    except DatabaseUnavailable:
        raise _db_error()
    active = next((s["plan_id"] for s in subs if s["status"] == "active"), "free")
    plan = "pro" if active == "pro" else ("trial" if trial and trial["expires_at"] > now_iso else "free")
    return {
        "profile": profile,
        "plan": plan,
        "subscriptions": subs,
        "trial": trial,
        # These counts need tables built in later phases. Reported honestly as unavailable.
        "watchlist_count": None,
        "saved_research_count": None,
        "ai_usage": None,
    }


class StatusChange(BaseModel):
    status: Literal["active", "suspended"]
    reason: str = Field(min_length=5, max_length=500)


@router.post("/users/{user_id}/status")
def change_user_status(
    user_id: str,
    body: StatusChange,
    request: Request,
    admin: CurrentUser = Depends(require_admin),
    db: Database = Depends(get_db),
) -> dict:
    if not is_uuid(user_id):
        raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "User not found."})
    if user_id == admin.id:
        raise HTTPException(400, detail={"code": "SELF_ACTION", "message": "You cannot change your own status."})
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    try:
        target = db.get_profile(user_id)
        if target is None:
            raise HTTPException(404, detail={"code": "NOT_FOUND", "message": "User not found."})
        if target["role"] == "admin":
            raise HTTPException(
                403, detail={"code": "ADMIN_PROTECTED", "message": "Admin accounts cannot be suspended here."}
            )
        previous_status = target["status"]  # captured before the change, used for audit and rollback
        if previous_status == body.status:
            return {"id": user_id, "status": body.status, "changed": False}

        db.set_profile_status(user_id, body.status)
        try:
            db.write_audit_log(
                admin_id=admin.id,
                action="user.suspend" if body.status == "suspended" else "user.restore",
                resource_type="profile",
                resource_id=user_id,
                previous_value={"status": previous_status},
                new_value={"status": body.status},
                reason=body.reason,
                request_id=request_id,
            )
        except DatabaseUnavailable:
            # No audit record means no change: undo it.
            db.set_profile_status(user_id, previous_status)
            raise
    except DatabaseUnavailable:
        raise _db_error()
    return {"id": user_id, "status": body.status, "changed": True, "request_id": request_id}


# ---------------------------------------------------------------- subscriptions and plans
@router.get("/subscriptions")
def list_subscriptions(
    status: Literal["active", "cancelled", "expired", "failed"] | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=PAGE_SIZE_MAX),
    db: Database = Depends(get_db),
) -> dict:
    try:
        rows, total = db.list_subscriptions(status, (page - 1) * page_size, page_size)
        emails = db.emails_for_users([r["user_id"] for r in rows])
    except DatabaseUnavailable:
        raise _db_error()
    items = [{**r, "user_email": emails.get(r["user_id"])} for r in rows]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.get("/plans")
def list_plans(db: Database = Depends(get_db)) -> dict:
    try:
        plans = db.list_plans()
        counts = {p["id"]: db.count_subscriptions({"plan_id": f"eq.{p['id']}", "status": "eq.active"}) for p in plans}
    except DatabaseUnavailable:
        raise _db_error()
    return {
        "items": [{**p, "active_subscriptions": counts[p["id"]]} for p in plans],
        "note": "Plan limits and feature flags are configured in a later stage (entitlement engine).",
    }


# ---------------------------------------------------------------- audit logs
@router.get("/audit-logs")
def audit_logs(
    action: str | None = Query(None, max_length=60),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=PAGE_SIZE_MAX),
    db: Database = Depends(get_db),
) -> dict:
    try:
        rows, total = db.list_audit_logs(action, (page - 1) * page_size, page_size)
        emails = db.emails_for_users([r["admin_id"] for r in rows if r["admin_id"]])
    except DatabaseUnavailable:
        raise _db_error()
    items = [{**r, "admin_email": emails.get(r["admin_id"])} for r in rows]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ---------------------------------------------------------------- settings (read-only)
@router.get("/settings")
def settings_view(settings: Settings = Depends(get_settings)) -> dict:
    """Which integrations are configured. Never returns any key or secret value."""
    return {
        "environment": settings.app_env,
        "admin_require_mfa": settings.admin_require_mfa,
        "integrations": settings.integration_status(),
    }
