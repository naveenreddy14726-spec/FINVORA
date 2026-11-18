# Finvora: Admin Dashboard (Stage 1)

## How access works (plain language)
1. You log in with Supabase. The browser gets a signed token.
2. Every admin page asks the backend `GET /api/admin/me`. The backend checks the token's signature, loads your row from `profiles`, and allows you in only if `profiles.role = 'admin'` and the account is not suspended.
3. Every admin API route lives in one router (`backend/app/api/admin.py`) created with `dependencies=[Depends(require_admin)]`, so a route cannot be added there without the admin check. Tests call every route as anonymous (401) and as a normal user (403).
4. The frontend only hides or shows things. Even if someone edited the page in their browser, the API would still refuse.

The role is read from the database, never from the token. It can only be set by the service role (the provisioning script `backend/scripts/provision_admin.py`).

## Pages
| Page | Route | Data source |
|---|---|---|
| Dashboard | `/admin` | Counts from `profiles`, `subscriptions`, `trial_records` |
| Users | `/admin/users` | `profiles` + active subscription + trial. Search, plan/status filters, details, suspend/restore |
| Subscriptions | `/admin/subscriptions` | `subscriptions` |
| Plans | `/admin/plans` | `plans` (read-only) + active subscription counts |
| Analytics | `/admin/analytics` | Signups per day from `profiles.created_at` |
| Audit Logs | `/admin/audit-logs` | `admin_audit_logs` |
| Settings | `/admin/settings` | Which integrations are configured (no secret values) |

## Definitions used on the dashboard
- **Pro**: has an active `pro` subscription.
- **Trial**: has an unexpired `trial_records` row and is not Pro.
- **Free**: everyone else.
- Dates "today" and "this month" use UTC.

## Audited actions
Suspend and restore require a written reason (5+ characters). The backend refuses to act on your own account or on another admin. It changes the status, then writes the audit entry (admin, action, previous and new value, reason, request id). If the audit write fails, the status change is undone. A suspended user is rejected by the backend on their next request.

## API list (all admin-only)
`GET /api/admin/overview`, `/analytics/signups`, `/users`, `/users/{id}`, `POST /users/{id}/status`, `/subscriptions`, `/plans`, `/audit-logs`, `/settings`.

## Known limitations (honest list)
- Revenue, AI usage, provider health, announcements and CSV exports are not built. The dashboard says "Data not available" for revenue and AI instead of showing numbers.
- Plans are read-only. Editing limits, prices and feature flags needs the entitlement engine (Phase 4).
- Watchlist, saved research and AI usage per user show "Data not available" until those tables exist.
- Suspension blocks the backend immediately but does not revoke the Supabase login session itself.
- Plan filters fetch up to 5000 user ids server-side. That is fine for early stage and needs a SQL view or function at larger scale.
- MFA enrollment screen is not built. `ADMIN_REQUIRE_MFA` stays false until it is.
- The admin UI has not been tested in a real browser or on a real phone by the developer. Only build, lint and API tests were run.

## Testing
Backend: `cd backend; .\.venv\Scripts\python -m pytest -q`
Frontend: `cd frontend; npm run lint; npm run build`
