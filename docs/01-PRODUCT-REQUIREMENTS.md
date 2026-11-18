# Finvora: Product Requirements (Phase 0)

**Tagline:** Research Deeper. Understand Better.
**Category:** AI-powered stock research and financial intelligence SaaS (India-first, INR).

## Users
Beginners, retail investors, students, experienced investors.

## Plans

| State | Price | How a user gets it |
|---|---|---|
| Free | ₹0 forever | Default on signup. No payment details. |
| Pro Trial | 30 days, no card | One-time, user-initiated, if eligible. Unlocks Pro. |
| Pro | ₹299/month | Verified Razorpay payment (server-side). |

Rules:
- Trial expiry returns the user to Free unless a verified paid subscription exists.
- No automatic charge without explicit consent and a valid payment authorization.
- All limits are stored in the database and editable by admins (never hard-coded).
- Pro limits are caps, not "unlimited", because data and AI providers have cost and rate limits.

## Default limits (admin-configurable seed values)

| Limit key | Free | Pro |
|---|---|---|
| ai_questions_per_day | 5 | 100 |
| watchlists | 1 | 20 |
| stocks_per_watchlist | 5 | 100 |
| chart_history_days | 365 | provider max |
| compare_companies | 2 | 10 |
| saved_reports | 3 | 100 |
| saved_notes | 10 (proposed) | 500 (proposed) |
| alerts | 3 (proposed) | 100 (proposed) |
| news_articles_per_view | 10 (proposed) | 50 (proposed) |
| screener_filters | basic set | all |

"Proposed" rows were not specified in the brief. Please confirm or change them.

## Feature flags (boolean entitlements)
`advanced_ai_analysis`, `ai_reports`, `pdf_export`, `advanced_indicators`, `advanced_screener`, `multiple_watchlists`, `advanced_financials`, `financial_statements`, `ai_news_summaries`, `advanced_alerts`, `advanced_comparison`.

## Non-negotiable rules
1. No fabricated prices, news, financials, testimonials, user counts or discounts.
2. Every financial figure shows source, last-updated time, currency and freshness (real-time / delayed / historical / cached). Missing data shows "Data not available".
3. Premium access is enforced in the backend. The frontend only reflects it.
4. Pro unlocks only after server-side Razorpay signature/webhook verification.
5. Admin access comes only from secure provisioning (a database role set by a service-role script), never from the signup email.
6. Secrets stay on the server. Missing credentials produce a visible setup message, not a fake integration.
7. AI answers are grounded in retrieved data, cite real sources with timestamps, and carry an "informational, not financial advice" notice.

## Out of scope for now
Real-time streaming quotes, brokerage/trading, portfolio import, native mobile apps, non-INR billing.

## Acceptance criteria
See section 26 of the master brief. Each phase ends with a completion report and waits for approval.
