from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert set(body["integrations"]) == {
        "supabase", "market_data", "news", "llm", "razorpay"
    }


def test_missing_credentials_reported_not_faked(monkeypatch):
    from app.core import config

    config.get_settings.cache_clear()
    for var in ("SUPABASE_URL", "MARKET_DATA_API_KEY", "RAZORPAY_KEY_ID"):
        monkeypatch.delenv(var, raising=False)
    status = config.Settings(_env_file=None).integration_status()
    assert status["supabase"] is False
    assert status["razorpay"] is False
