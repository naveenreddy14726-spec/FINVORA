"""Auth and admin authorization tests using a locally generated signing key (no network)."""

import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient

from app.core import security
from app.core.config import Settings, get_settings
from app.core.deps import get_db
from app.main import app

URL = "https://test.supabase.co"
PRIVATE = ec.generate_private_key(ec.SECP256R1())


def make_token(sub="u1", **overrides):
    claims = {
        "sub": sub,
        "aud": "authenticated",
        "iss": f"{URL}/auth/v1",
        "exp": int(time.time()) + 600,
        "aal": "aal1",
    }
    claims.update(overrides)
    return jwt.encode(claims, PRIVATE, algorithm="ES256", headers={"kid": "k"})


class FakeDB:
    def __init__(self, profiles, plan="free"):
        self.profiles = profiles
        self.plan = plan

    def get_profile(self, user_id):
        return self.profiles.get(user_id)

    def get_active_plan(self, user_id):
        return self.plan


def profile(uid, role="user", status="active"):
    return {"id": uid, "email": f"{uid}@x.com", "full_name": None, "role": role, "status": status}


@pytest.fixture
def client(monkeypatch):
    settings = Settings(_env_file=None, supabase_url=URL, supabase_service_role_key="x")
    app.dependency_overrides[get_settings] = lambda: settings
    monkeypatch.setattr(security, "get_signing_key", lambda token, s: PRIVATE.public_key())
    yield TestClient(app)
    app.dependency_overrides.clear()


def use_db(db):
    app.dependency_overrides[get_db] = lambda: db


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_me_requires_login(client):
    use_db(FakeDB({}))
    assert client.get("/api/me").status_code == 401


def test_free_plan_for_new_user(client):
    use_db(FakeDB({"u1": profile("u1")}))
    r = client.get("/api/me", headers=auth(make_token("u1")))
    assert r.status_code == 200
    assert r.json()["plan"] == "free"
    assert r.json()["role"] == "user"


def test_expired_token_rejected(client):
    use_db(FakeDB({"u1": profile("u1")}))
    token = make_token("u1", exp=int(time.time()) - 10)
    assert client.get("/api/me", headers=auth(token)).status_code == 401


def test_wrong_issuer_rejected(client):
    use_db(FakeDB({"u1": profile("u1")}))
    token = make_token("u1", iss="https://evil.example/auth/v1")
    assert client.get("/api/me", headers=auth(token)).status_code == 401


def test_token_signed_by_other_key_rejected(client):
    use_db(FakeDB({"u1": profile("u1")}))
    other = ec.generate_private_key(ec.SECP256R1())
    forged = jwt.encode(
        {"sub": "u1", "aud": "authenticated", "iss": f"{URL}/auth/v1", "exp": int(time.time()) + 600},
        other,
        algorithm="ES256",
    )
    assert client.get("/api/me", headers=auth(forged)).status_code == 401


def test_suspended_user_blocked(client):
    use_db(FakeDB({"u1": profile("u1", status="suspended")}))
    r = client.get("/api/me", headers=auth(make_token("u1")))
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "SUSPENDED"


def test_normal_user_cannot_use_admin_api(client):
    use_db(FakeDB({"u1": profile("u1")}))
    assert client.get("/api/admin/me", headers=auth(make_token("u1"))).status_code == 403


def test_anonymous_cannot_use_admin_api(client):
    use_db(FakeDB({}))
    assert client.get("/api/admin/me").status_code == 401


def test_admin_can_use_admin_api(client):
    use_db(FakeDB({"a1": profile("a1", role="admin")}))
    r = client.get("/api/admin/me", headers=auth(make_token("a1")))
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_role_claim_in_token_is_ignored(client):
    """A user cannot make themselves admin by putting role=admin in the token."""
    use_db(FakeDB({"u1": profile("u1")}))
    token = make_token("u1", role="admin", user_metadata={"role": "admin"})
    assert client.get("/api/admin/me", headers=auth(token)).status_code == 403


def test_admin_mfa_enforced_when_enabled(monkeypatch):
    settings = Settings(
        _env_file=None, supabase_url=URL, supabase_service_role_key="x", admin_require_mfa=True
    )
    app.dependency_overrides[get_settings] = lambda: settings
    monkeypatch.setattr(security, "get_signing_key", lambda token, s: PRIVATE.public_key())
    use_db(FakeDB({"a1": profile("a1", role="admin")}))
    c = TestClient(app)
    try:
        assert c.get("/api/admin/me", headers=auth(make_token("a1"))).status_code == 403
        assert c.get("/api/admin/me", headers=auth(make_token("a1", aal="aal2"))).status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_not_configured_gives_clear_message():
    settings = Settings(_env_file=None)
    app.dependency_overrides[get_settings] = lambda: settings
    try:
        r = TestClient(app).get("/api/me")
        assert r.status_code == 503
        assert r.json()["detail"]["code"] == "NOT_CONFIGURED"
    finally:
        app.dependency_overrides.clear()
