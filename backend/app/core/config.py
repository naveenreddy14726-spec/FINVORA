"""Central configuration. All secrets come from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    app_env: str = "development"
    frontend_url: str = "http://localhost:3000"

    supabase_url: str = ""
    supabase_service_role_key: str = ""  # server only, never sent to the browser

    market_data_api_key: str = ""
    news_api_key: str = ""
    llm_api_key: str = ""

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    def integration_status(self) -> dict[str, bool]:
        """True only when the credentials for an integration are present."""
        return {
            "supabase": bool(self.supabase_url and self.supabase_service_role_key),
            "market_data": bool(self.market_data_api_key),
            "news": bool(self.news_api_key),
            "llm": bool(self.llm_api_key),
            "razorpay": bool(
                self.razorpay_key_id
                and self.razorpay_key_secret
                and self.razorpay_webhook_secret
            ),
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
