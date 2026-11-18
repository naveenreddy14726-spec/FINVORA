"""One-time, local admin provisioning.

Usage (from the backend folder, after the user has signed up AND verified their email):
    .\\.venv\\Scripts\\python scripts\\provision_admin.py --email you@example.com

It reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the repo-root .env.
It refuses to run if the email is not verified. No password is ever handled here.
"""

import argparse
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import Settings
from app.core.db import Database


def main() -> int:
    parser = argparse.ArgumentParser(description="Grant the admin role to an existing, verified user.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--yes", action="store_true", help="skip the confirmation prompt")
    args = parser.parse_args()

    settings = Settings()
    if not (settings.supabase_url and settings.supabase_service_role_key):
        print("ERROR: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the repo-root .env first.")
        return 1

    db = Database(settings)
    headers = db._headers
    base = settings.supabase_url.rstrip("/")

    rows = db._get("profiles", {"email": f"eq.{args.email.lower()}", "select": "id,email,role"})
    if not rows:
        print("ERROR: no account with that email. Sign up on the website and verify the email first.")
        return 1
    profile = rows[0]

    auth_user = httpx.get(f"{base}/auth/v1/admin/users/{profile['id']}", headers=headers, timeout=10)
    auth_user.raise_for_status()
    if not auth_user.json().get("email_confirmed_at"):
        print("ERROR: this email is not verified yet. Verify it, then run this again.")
        return 1

    if profile["role"] == "admin":
        print("Already an admin. Nothing to do.")
        return 0

    if not args.yes:
        answer = input(f"Grant ADMIN role to {profile['email']}? Type 'yes' to continue: ")
        if answer.strip().lower() != "yes":
            print("Cancelled.")
            return 1

    r = httpx.patch(
        f"{base}/rest/v1/profiles",
        params={"id": f"eq.{profile['id']}"},
        json={"role": "admin"},
        headers=headers,
        timeout=10,
    )
    r.raise_for_status()
    db.write_audit_log(
        admin_id=profile["id"],
        action="admin.provision",
        resource_type="profile",
        resource_id=profile["id"],
        previous_value={"role": profile["role"]},
        new_value={"role": "admin"},
        reason="Initial admin provisioning via local script",
    )
    print(f"Done. {profile['email']} is now an admin (audit log written).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
