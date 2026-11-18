# Finvora: Architecture (Phase 0)

The repository was empty, so there was no existing architecture to preserve. This design follows the stack in the brief.

## Overview

```
Browser (Next.js, React, TypeScript)
   |  1. Login via Supabase Auth (JWT)
   |  2. Calls FastAPI with "Authorization: Bearer <JWT>"
   v
FastAPI backend (Python)  ---> Supabase Postgres (RLS on; service role used only here)
   |-- entitlements service  (single place that decides what a user may do)
   |-- market data adapters  (swappable providers + cache)
   |-- news adapters
   |-- LLM adapters          (swappable providers)
   |-- payment adapter       (Razorpay: orders, verify, webhooks)
   v
External providers
```

## Folder layout (created in Phase 1)

```
finvora/
  frontend/        Next.js app (App Router, TypeScript)
  backend/         FastAPI app
    app/
      api/         route modules (thin)
      core/        config, security, auth dependencies
      services/    business logic (entitlements, subscriptions, usage)
      providers/   market/, news/, llm/, payments/  (each behind an interface)
      schemas/     Pydantic models
    tests/
  supabase/
    migrations/    SQL migrations (additive only)
  docs/
```

## Key decisions (plain-language reasons)

1. **Backend verifies the Supabase JWT.** The frontend never decides access. Every protected FastAPI route calls `get_current_user`, then `require_feature("pdf_export")` or `check_limit("ai_questions_per_day")`.
2. **One entitlement service.** It reads `plans` + `feature_entitlements` (limits and flags) and the user's `subscriptions`/`trial_records` to compute the *effective plan*. Changing a feature's tier is a database edit, not a code change.
3. **Effective plan is computed, not stored as a flag.** Pro = (active paid subscription) OR (trial with `expires_at > now()`). Expiry therefore needs no cron to be correct. A scheduled job later only sends reminders and tidies status.
4. **Provider adapters.** Each provider implements an interface (e.g. `MarketDataProvider.search / quote / history / fundamentals`). Responses carry `source`, `as_of`, `currency`, `freshness`. Swapping providers touches one file.
5. **Caching.** Responses are cached (in-memory first, then a Postgres table or Redis) with TTLs to cut provider cost and respect rate limits.
6. **RLS plus backend checks.** RLS ensures users read only their own rows if the frontend queries Supabase directly. Writes to billing and entitlements go through the backend with the service role.
7. **Payments.** Backend creates the Razorpay order/subscription, verifies the signature, and processes webhooks idempotently (unique `event_id` in `payment_events`). The frontend "success" callback is never trusted.
8. **Admin.** `profiles.role` can be `user` or `admin`. It can only be changed with the service role (a provisioning script), is checked in the backend, and every admin action writes to `admin_audit_logs`.

## Data model (Phase 3/4 migrations)

profiles, plans, feature_entitlements, subscriptions, trial_records, payment_orders, payment_events, usage_records, watchlists, watchlist_stocks, saved_research, research_reports, stock_alerts, notifications, ai_conversations, ai_messages, admin_audit_logs. All have foreign keys to `auth.users` or their parent, timestamps, indexes on lookup columns, and RLS enabled. Migrations are additive and nothing is dropped without your approval.

## Frontend components planned
`UpgradeModal`, `PremiumFeatureCard`, `PremiumBadge`, `PlanComparison`, `UsageLimitIndicator`, `SubscriptionStatus`, `TrialCountdown`. The upgrade modal is triggered by a `useEntitlement(feature)` hook and by backend `403 {code: "PLAN_REQUIRED", feature}` responses, so frontend and backend stay in sync. It opens only on a user's click on a locked feature, never on page load.

## Environment variables (`.env.example` created in Phase 1)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), market data key(s), news key, LLM key, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.

## Charting
Proposed: TradingView **Lightweight Charts** (open source, Apache-2.0, built for financial time series, small bundle). Indicators (SMA, EMA, RSI, MACD, Bollinger) are computed on the backend with pandas/NumPy for consistency and testability.

## Testing stack
Backend: pytest + httpx. Frontend: Vitest + React Testing Library, Playwright for end-to-end and mobile viewport checks. RLS tests run SQL against a local Supabase instance.
