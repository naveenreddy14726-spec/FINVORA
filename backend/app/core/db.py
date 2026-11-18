"""Minimal server-side Supabase access (PostgREST) using the service-role key.

The service-role key bypasses RLS, so it must only ever be used here on the server,
and every caller must do its own authorization first.
"""

import re
import uuid

import httpx

from app.core.config import Settings


class DatabaseUnavailable(Exception):
    pass


# One shared client reuses TLS connections instead of re-handshaking on every query.
_client = httpx.Client(timeout=httpx.Timeout(15.0, connect=10.0))


_UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
_FILTER_UNSAFE = re.compile(r"[,()*%\\:\"'<>;]")
MAX_ID_LIST = 5000


def is_uuid(value: str) -> bool:
    return bool(_UUID_RE.match(value))


def clean_search(text: str) -> str:
    """Remove characters that have meaning inside PostgREST filter syntax."""
    return _FILTER_UNSAFE.sub("", text).strip()[:100]


def in_list(ids: list[str]) -> str:
    return "(" + ",".join(ids) + ")"


class Database:
    def __init__(self, settings: Settings):
        self._base = f"{settings.supabase_url.rstrip('/')}/rest/v1"
        key = settings.supabase_service_role_key
        headers = {"apikey": key}
        if key.startswith("eyJ"):  # legacy JWT-style keys also go in Authorization
            headers["Authorization"] = f"Bearer {key}"
        self._headers = headers

    # ---------- low-level helpers ----------
    def _get(self, table: str, params: dict) -> list[dict]:
        try:
            r = _client.get(f"{self._base}/{table}", params=params, headers=self._headers, timeout=10)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError as exc:
            raise DatabaseUnavailable(str(exc)) from exc

    def _get_page(self, table: str, params: dict, offset: int, limit: int) -> tuple[list[dict], int]:
        """Return (rows, total_matching_rows)."""
        headers = {**self._headers, "Prefer": "count=exact"}
        query = {**params, "limit": str(limit), "offset": str(offset)}
        try:
            r = _client.get(f"{self._base}/{table}", params=query, headers=headers, timeout=10)
            r.raise_for_status()
            total = int(r.headers.get("content-range", "*/0").rsplit("/", 1)[-1] or 0)
            return r.json(), total
        except (httpx.HTTPError, ValueError) as exc:
            raise DatabaseUnavailable(str(exc)) from exc

    def count(self, table: str, filters: dict | None = None) -> int:
        _, total = self._get_page(table, {"select": "id", **(filters or {})}, 0, 1)
        return total

    def _patch(self, table: str, params: dict, body: dict) -> None:
        try:
            r = _client.patch(
                f"{self._base}/{table}", params=params, json=body, headers=self._headers, timeout=10
            )
            r.raise_for_status()
        except httpx.HTTPError as exc:
            raise DatabaseUnavailable(str(exc)) from exc

    # ---------- auth/identity ----------
    def get_profile(self, user_id: str) -> dict | None:
        rows = self._get("profiles", {"id": f"eq.{user_id}", "select": "id,email,full_name,role,status"})
        return rows[0] if rows else None

    def get_active_plan(self, user_id: str) -> str:
        rows = self._get(
            "subscriptions",
            {"user_id": f"eq.{user_id}", "status": "eq.active", "select": "plan_id", "limit": "1"},
        )
        return rows[0]["plan_id"] if rows else "free"

    # ---------- admin: users ----------
    def count_users(self, filters: dict | None = None) -> int:
        return self.count("profiles", filters)

    def count_trials(self, filters: dict) -> int:
        _, total = self._get_page("trial_records", {"select": "user_id", **filters}, 0, 1)
        return total

    def active_pro_user_ids(self) -> list[str]:
        rows = self._get(
            "subscriptions",
            {"select": "user_id", "plan_id": "eq.pro", "status": "eq.active", "limit": str(MAX_ID_LIST)},
        )
        return [r["user_id"] for r in rows]

    def active_trial_user_ids(self, now_iso: str) -> list[str]:
        rows = self._get(
            "trial_records",
            {"select": "user_id", "expires_at": f"gt.{now_iso}", "limit": str(MAX_ID_LIST)},
        )
        return [r["user_id"] for r in rows]

    def list_profiles(
        self,
        search: str | None,
        status: str | None,
        include_ids: list[str] | None,
        exclude_ids: list[str] | None,
        offset: int,
        limit: int,
    ) -> tuple[list[dict], int]:
        params: dict[str, str] = {
            "select": "id,email,full_name,role,status,created_at",
            "order": "created_at.desc",
        }
        if status:
            params["status"] = f"eq.{status}"
        if search:
            term = clean_search(search)
            if term:
                clauses = [f"email.ilike.*{term}*", f"full_name.ilike.*{term}*"]
                if is_uuid(term):
                    clauses.append(f"id.eq.{term}")
                params["or"] = "(" + ",".join(clauses) + ")"
        conditions = []
        if include_ids is not None:
            # An empty include list must match nothing.
            ids = include_ids or ["00000000-0000-0000-0000-000000000000"]
            conditions.append(f"id.in.{in_list(ids)}")
        if exclude_ids:
            conditions.append(f"id.not.in.{in_list(exclude_ids)}")
        if conditions:
            params["and"] = "(" + ",".join(conditions) + ")"
        return self._get_page("profiles", params, offset, limit)

    def get_user_subscriptions(self, user_id: str) -> list[dict]:
        return self._get(
            "subscriptions",
            {
                "user_id": f"eq.{user_id}",
                "select": "id,plan_id,status,provider,current_period_end,created_at,updated_at",
                "order": "created_at.desc",
            },
        )

    def get_user_trial(self, user_id: str) -> dict | None:
        rows = self._get("trial_records", {"user_id": f"eq.{user_id}", "select": "started_at,expires_at"})
        return rows[0] if rows else None

    def set_profile_status(self, user_id: str, status: str) -> None:
        self._patch("profiles", {"id": f"eq.{user_id}"}, {"status": status})

    def trials_for_users(self, ids: list[str]) -> dict[str, dict]:
        if not ids:
            return {}
        rows = self._get(
            "trial_records", {"select": "user_id,started_at,expires_at", "user_id": f"in.{in_list(ids)}"}
        )
        return {r["user_id"]: r for r in rows}

    def active_plans_for_users(self, ids: list[str]) -> dict[str, str]:
        if not ids:
            return {}
        rows = self._get(
            "subscriptions",
            {"select": "user_id,plan_id", "status": "eq.active", "user_id": f"in.{in_list(ids)}"},
        )
        return {r["user_id"]: r["plan_id"] for r in rows}

    def emails_for_users(self, ids: list[str]) -> dict[str, str]:
        ids = [i for i in set(ids) if i]
        if not ids:
            return {}
        rows = self._get("profiles", {"select": "id,email", "id": f"in.{in_list(ids)}"})
        return {r["id"]: r["email"] for r in rows}

    def signup_timestamps_since(self, since_iso: str) -> list[str]:
        rows = self._get(
            "profiles",
            {"select": "created_at", "created_at": f"gte.{since_iso}", "limit": "10000"},
        )
        return [r["created_at"] for r in rows]

    # ---------- admin: subscriptions, plans, audit ----------
    def list_subscriptions(self, status: str | None, offset: int, limit: int) -> tuple[list[dict], int]:
        params = {
            "select": "id,user_id,plan_id,status,provider,provider_subscription_id,current_period_end,created_at,updated_at",
            "order": "created_at.desc",
        }
        if status:
            params["status"] = f"eq.{status}"
        return self._get_page("subscriptions", params, offset, limit)

    def list_plans(self) -> list[dict]:
        return self._get("plans", {"select": "id,name,price_inr,description,updated_at", "order": "price_inr.asc"})

    def count_subscriptions(self, filters: dict) -> int:
        return self.count("subscriptions", filters)

    def list_audit_logs(self, action: str | None, offset: int, limit: int) -> tuple[list[dict], int]:
        params = {
            "select": "id,admin_id,action,resource_type,resource_id,previous_value,new_value,reason,request_id,created_at",
            "order": "created_at.desc",
        }
        if action:
            params["action"] = f"eq.{clean_search(action)}"
        return self._get_page("admin_audit_logs", params, offset, limit)

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
            r = _client.post(
                f"{self._base}/admin_audit_logs", json=body, headers=self._headers, timeout=10
            )
            r.raise_for_status()
        except httpx.HTTPError as exc:
            raise DatabaseUnavailable(str(exc)) from exc
