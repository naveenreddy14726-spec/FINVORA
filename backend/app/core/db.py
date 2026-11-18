"""Minimal server-side Supabase access (PostgREST) using the service-role key.

The service-role key bypasses RLS, so it must only ever be used here on the server,
and every caller must do its own authorization first.
"""

import uuid

import httpx

from app.core.config import Settings


class DatabaseUnavailable(Exception):
    pass


class Database:
    def __init__(self, settings: Settings):
        self._base = f"{settings.supabase_url.rstrip('/')}/rest/v1"
        key = settings.supabase_service_role_key
        headers = {"apikey": key}
        if key.startswith("eyJ"):  # legacy JWT-style keys also go in Authorization
            headers["Authorization"] = f"Bearer {key}"
        self._headers = headers

    def _get(self, table: str, params: dict) -> list[dict]:
        try:
            r = httpx.get(f"{self._base}/{table}", params=params, headers=self._headers, timeout=10)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as exc:
            raise DatabaseUnavailable(str(exc)) from exc

    def get_profile(self, user_id: str) -> dict | None:
        rows = self._get("profiles", {"id": f"eq.{user_id}", "select": "id,email,full_name,role,status"})
        return rows[0] if rows else None

    def get_active_plan(self, user_id: str) -> str:
        rows = self._get(
            "subscriptions",
            {"user_id": f"eq.{user_id}", "status": "eq.active", "select": "plan_id", "limit": "1"},
        )
        return rows[0]["plan_id"] if rows else "free"

    def write_audit_log(
        self,
        admin_id: str,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        previous_value: dict | None = None,
        new_value: dict | None = None,
        reason: str | None = None,
        request_id: str | None = None,
    ) -> None:
        body = {
            "admin_id": admin_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "previous_value": previous_value,
            "new_value": new_value,
            "reason": reason,
            "request_id": request_id or str(uuid.uuid4()),
        }
        try:
            r = httpx.post(
                f"{self._base}/admin_audit_logs", json=body, headers=self._headers, timeout=10
            )
            r.raise_for_status()
        except httpx.HTTPError as exc:
            raise DatabaseUnavailable(str(exc)) from exc
