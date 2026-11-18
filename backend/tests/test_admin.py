"""Admin API tests: authorization on every route, audited actions, query safety, no secret leaks."""

import uuid

import pytest
from fastapi.testclient import TestClient
from test_auth import PRIVATE, URL, make_token

from app.core import security
from app.core.config import Settings, get_settings
from app.core.db import Database, DatabaseUnavailable, clean_search
from app.core.deps import get_db
from app.main import app

ADMIN = str(uuid.uuid4())
USER = str(uuid.uuid4())
OTHER_ADMIN = str(uuid.uuid4())
SECRET = "sb_secret_SHOULD_NEVER_APPEAR"


class FakeAdminDB:
    def __init__(self):
        self.profiles = {
            ADMIN: self._p(ADMIN, "admin@x.com", "admin"),
            USER: self._p(USER, "user@x.com", "user"),
            OTHER_ADMIN: self._p(OTHER_ADMIN, "admin2@x.com", "admin"),
        }
        self.audit: list[dict] = []
        self.pro: list[str] = []
        self.trials: dict[str, dict] = {}
        self.fail_audit = False

    @staticmethod
    def _p(uid, email, role):
        return {
            "id": uid, "email": email, "full_name": None, "role": role,
            "status": "active", "created_at": "2025-01-01T00:00:00Z",
        }

    # identity
    def get_profile(self, user_id):
        return self.profiles.get(user_id)

    def get_active_plan(self, user_id):
        return "pro" if user_id in self.pro else "free"

    # stats
    def count_users(self, filters=None):
        filters = filters or {}
        rows = list(self.profiles.values())
        if "status" in filters:
            rows = [r for r in rows if r["status"] == filters["status"].split(".")[1]]
        if "role" in filters:
            rows = [r for r in rows if r["role"] == filters["role"].split(".")[1]]
        return len(rows)

    def count_trials(self, filters):
        return 0

    def count_subscriptions(self, filters):
        return 0

    def active_pro_user_ids(self):
        return list(self.pro)

    def active_trial_user_ids(self, now_iso):
        return [u for u, t in self.trials.items() if t["expires_at"] > now_iso]

    def signup_timestamps_since(self, since_iso):
        return []

    # users
    def list_profiles(self, search, status, include_ids, exclude_ids, offset, limit):
        rows = list(self.profiles.values())
        if search:
            rows = [r for r in rows if search.lower() in r["email"]]
        if status:
            rows = [r for r in rows if r["status"] == status]
        if include_ids is not None:
            rows = [r for r in rows if r["id"] in include_ids]
        if exclude_ids:
            rows = [r for r in rows if r["id"] not in exclude_ids]
        return rows[offset : offset + limit], len(rows)

    def active_plans_for_users(self, ids):
        return {u: "pro" for u in ids if u in self.pro}

    def trials_for_users(self, ids):
        return {u: t for u, t in self.trials.items() if u in ids}

    def get_user_subscriptions(self, user_id):
        return []

    def get_user_trial(self, user_id):
        return self.trials.get(user_id)

    def set_profile_status(self, user_id, status):
        self.profiles[user_id]["status"] = status

    def write_audit_log(self, **kw):
        if self.fail_audit:
            raise DatabaseUnavailable("audit down")
        self.audit.append(kw)

    # lists
    def list_subscriptions(self, status, offset, limit):
        return [], 0

    def emails_for_users(self, ids):
        return {}

    def list_plans(self):
        return [{"id": "free", "name": "Free", "price_inr": 0}]

    def list_audit_logs(self, action, offset, limit):
        return [], 0


@pytest.fixture
def db():
    return FakeAdminDB()


@pytest.fixture
def client(db, monkeypatch):
    settings = Settings(_env_file=None, supabase_url=URL, supabase_service_role_key=SECRET)
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_db] = lambda: db
    monkeypatch.setattr(security, "get_signing_key", lambda token, s: PRIVATE.public_key())
    yield TestClient(app)
    app.dependency_overrides.clear()


def as_(uid):
    return {"Authorization": f"Bearer {make_token(uid)}"}


ROUTES = [
    ("GET", "/api/admin/overview"),
    ("GET", "/api/admin/analytics/signups"),
    ("GET", "/api/admin/users"),
    ("GET", f"/api/admin/users/{USER}"),
    ("POST", f"/api/admin/users/{USER}/status"),
    ("GET", "/api/admin/subscriptions"),
    ("GET", "/api/admin/plans"),
    ("GET", "/api/admin/audit-logs"),
    ("GET", "/api/admin/settings"),
]


@pytest.mark.parametrize("method,path", ROUTES)
def test_anonymous_gets_401(client, method, path):
    assert client.request(method, path).status_code == 401


@pytest.mark.parametrize("method,path", ROUTES)
def test_normal_user_gets_403(client, method, path):
    r = client.request(method, path, headers=as_(USER), json={"status": "suspended", "reason": "testing"})
    assert r.status_code == 403


def test_overview_counts_real_state(client, db):
    db.pro = [USER]
    r = client.get("/api/admin/overview", headers=as_(ADMIN))
    assert r.status_code == 200
    u = r.json()["users"]
    assert u["total"] == 3 and u["pro"] == 1 and u["free"] == 2 and u["admins"] == 2
    assert r.json()["revenue"]["available"] is False  # never faked


def test_list_users_filters(client, db):
    db.pro = [USER]
    assert client.get("/api/admin/users?plan=pro", headers=as_(ADMIN)).json()["total"] == 1
    assert client.get("/api/admin/users?plan=free", headers=as_(ADMIN)).json()["total"] == 2
    r = client.get("/api/admin/users?q=user@", headers=as_(ADMIN)).json()
    assert r["total"] == 1 and r["items"][0]["plan"] == "pro"


def test_page_size_limit_enforced(client):
    assert client.get("/api/admin/users?page_size=1000", headers=as_(ADMIN)).status_code == 422
    assert client.get("/api/admin/users?plan=enterprise", headers=as_(ADMIN)).status_code == 422


def test_suspend_writes_audit_and_blocks_user(client, db):
    r = client.post(
        f"/api/admin/users/{USER}/status",
        headers=as_(ADMIN),
        json={"status": "suspended", "reason": "Abuse report #12"},
    )
    assert r.status_code == 200 and r.json()["changed"] is True
    assert db.profiles[USER]["status"] == "suspended"
    entry = db.audit[-1]
    assert entry["action"] == "user.suspend"
    assert entry["admin_id"] == ADMIN
    assert entry["previous_value"] == {"status": "active"}
    assert entry["new_value"] == {"status": "suspended"}
    assert entry["reason"] == "Abuse report #12"
    assert entry["request_id"]
    # The suspended user is now rejected on normal API calls too.
    assert client.get("/api/me", headers=as_(USER)).status_code == 403


def test_restore_is_audited(client, db):
    db.profiles[USER]["status"] = "suspended"
    r = client.post(
        f"/api/admin/users/{USER}/status", headers=as_(ADMIN), json={"status": "active", "reason": "Resolved"}
    )
    assert r.status_code == 200
    assert db.audit[-1]["action"] == "user.restore"
    assert client.get("/api/me", headers=as_(USER)).status_code == 200


def test_reason_required(client, db):
    r = client.post(f"/api/admin/users/{USER}/status", headers=as_(ADMIN), json={"status": "suspended", "reason": "x"})
    assert r.status_code == 422
    assert db.profiles[USER]["status"] == "active" and db.audit == []


def test_cannot_suspend_self_or_other_admin(client, db):
    body = {"status": "suspended", "reason": "testing now"}
    assert client.post(f"/api/admin/users/{ADMIN}/status", headers=as_(ADMIN), json=body).status_code == 400
    assert client.post(f"/api/admin/users/{OTHER_ADMIN}/status", headers=as_(ADMIN), json=body).status_code == 403
    assert db.audit == []


def test_unknown_or_malformed_user_id_404(client):
    body = {"status": "suspended", "reason": "testing now"}
    assert client.post(f"/api/admin/users/{uuid.uuid4()}/status", headers=as_(ADMIN), json=body).status_code == 404
    assert client.post("/api/admin/users/not-a-uuid/status", headers=as_(ADMIN), json=body).status_code == 404
    assert client.get("/api/admin/users/not-a-uuid", headers=as_(ADMIN)).status_code == 404


def test_audit_failure_rolls_back_change(client, db):
    db.fail_audit = True
    r = client.post(
        f"/api/admin/users/{USER}/status", headers=as_(ADMIN), json={"status": "suspended", "reason": "testing now"}
    )
    assert r.status_code == 503
    assert db.profiles[USER]["status"] == "active"


def test_settings_never_returns_secrets(client):
    r = client.get("/api/admin/settings", headers=as_(ADMIN))
    assert r.status_code == 200
    assert SECRET not in r.text
    assert r.json()["integrations"]["supabase"] is True


# ---- query construction (no network): search text cannot inject PostgREST filter syntax ----
class _Resp:
    def __init__(self):
        self.headers = {"content-range": "0-0/0"}

    def raise_for_status(self):
        pass

    def json(self):
        return []


def test_clean_search_strips_filter_syntax():
    assert clean_search("a,b)(c*d%e") == "abcde"
    assert clean_search("x" * 500) == "x" * 100


def test_search_query_is_sanitized(monkeypatch):
    captured = {}

    def fake_get(url, params=None, headers=None, timeout=None):
        captured.update(params)
        return _Resp()

    from app.core import db as dbmod

    monkeypatch.setattr(dbmod._client, "get", fake_get)
    database = Database(Settings(_env_file=None, supabase_url=URL, supabase_service_role_key="k"))
    database.list_profiles("evil),id.neq.0,(x", None, None, None, 0, 25)
    assert captured["or"] == "(email.ilike.*evilid.neq.0x*,full_name.ilike.*evilid.neq.0x*)"
    assert captured["limit"] == "25" and captured["offset"] == "0"
