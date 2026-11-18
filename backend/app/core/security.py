"""Verifies Supabase access tokens (JWTs) using the project's public signing keys.

No secret is needed: Supabase publishes public keys at /auth/v1/.well-known/jwks.json.
"""

from functools import lru_cache

import jwt
from jwt import PyJWKClient

from app.core.config import Settings


class InvalidToken(Exception):
    pass


@lru_cache
def _jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(f"{url}/auth/v1/.well-known/jwks.json", cache_keys=True)


def get_signing_key(token: str, settings: Settings):
    """Separate function so tests can replace it with a local key."""
    return _jwks_client(settings.supabase_url.rstrip("/")).get_signing_key_from_jwt(token).key


def verify_token(token: str, settings: Settings) -> dict:
    base = settings.supabase_url.rstrip("/")
    try:
        key = get_signing_key(token, settings)
        return jwt.decode(
            token,
            key,
            algorithms=["ES256", "RS256"],  # asymmetric only; never accept "none" or HS*
            audience="authenticated",
            issuer=f"{base}/auth/v1",
            options={"require": ["exp", "sub", "iss", "aud"]},
        )
    except Exception as exc:  # any failure means "not authenticated"
        raise InvalidToken(str(exc)) from exc
