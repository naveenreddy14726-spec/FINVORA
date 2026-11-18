# Finvora: Provider Evaluation (Phase 0)

**Status: shortlist only. Prices, free-tier limits and licence terms below are NOT verified.** They change often, and I have not checked live pricing pages. Before Phase 7 (market data) and Phase 9 (AI), verify each item on the provider's official page, especially **commercial-use rights**, because a paid SaaS needs a licence that allows redistribution of data to end users.

## Market data (Indian equities, NSE/BSE)

| Candidate | Why consider | Things to verify |
|---|---|---|
| Twelve Data | Simple REST API, NSE/BSE coverage, fundamentals | Free-tier limits, whether free tier allows commercial display, Indian exchange data licensing |
| Alpha Vantage | Easy, well documented | Indian coverage quality, very low free rate limit, commercial terms |
| Financial Modeling Prep | Strong fundamentals/statements | Indian coverage, plan needed for commercial use |
| EODHD | Good global EOD and fundamentals | Plan for commercial use, NSE coverage |
| Exchange-licensed vendors (NSE/BSE data vendors) | Proper licences for real-time | Cost is usually high; likely out of reach early |
| yfinance (unofficial Yahoo scraping) | Free | **Do not use in production.** It is unofficial scraping and violates the "no unauthorized scraping" rule. Acceptable only for local learning experiments, labelled as such. |

Recommendation: build the adapter interface first, then start with one provider whose terms permit commercial use, delayed or end-of-day data, clearly labelled "delayed". Decide after verifying terms (Phase 7).

## News

| Candidate | Notes |
|---|---|
| NewsAPI.org | Free tier is development-only, so a paid plan is needed for production |
| GNews / Newsdata.io | Cheaper options; check commercial terms and Indian-source coverage |
| Provider bundled with market-data vendor (e.g. FMP, EODHD) | Fewer vendors to manage |

Show headline, publisher, time and link only. AI summaries are limited to what the licence permits. No full-article reproduction.

## LLM

| Candidate | Notes |
|---|---|
| Google Gemini (Flash tier) | Low cost, free tier useful for development |
| OpenAI (small models) | Reliable, good tool/JSON support |
| Anthropic Claude (Haiku/Sonnet) | Strong at grounded, cited answers |

All sit behind one `LLMProvider` interface. Cost control: per-user daily caps (the Free/Pro limits), prompt size limits, cached summaries, and token usage logged to `usage_records` for the admin cost view.

## Payments
Razorpay (as specified). Use test mode until launch. Verify current fee rates and whether Razorpay Subscriptions suit a ₹299 monthly plan with a 30-day no-card trial. The trial is handled by Finvora itself, so no mandate is needed until the user chooses to pay.

## Decision gates
- Phase 7: choose market data provider after confirming commercial licence.
- Phase 9: choose LLM after a small cost/quality test.
- Phase 10: choose news provider after confirming licence.
