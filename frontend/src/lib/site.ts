// Static marketing content. In Phase 4 the plan limits shown here will be read
// from the backend (plans / feature_entitlements tables) so admins can change them.

export const SITE = {
  name: "Finvora",
  tagline: "Research Deeper. Understand Better.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
};

export const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export const PRO_PRICE_INR = 299;
export const TRIAL_DAYS = 30;

export const FEATURES = [
  {
    title: "Stock search and company profiles",
    body: "Find listed companies by name or symbol and see a clear profile with the data source and update time on every figure.",
  },
  {
    title: "Charts and indicators",
    body: "Interactive price charts. Pro adds SMA, EMA, RSI, MACD, Bollinger Bands and longer history.",
  },
  {
    title: "AI research assistant",
    body: "Ask questions about a company. Answers are grounded in retrieved data, cite their sources, and separate facts from interpretation.",
  },
  {
    title: "News intelligence",
    body: "Recent company news with publisher, time and a link to the original article. Pro adds AI summaries where licensing permits.",
  },
  {
    title: "Watchlists and notes",
    body: "Track companies and save research notes. Pro supports multiple watchlists and more saved items.",
  },
  {
    title: "Screener and comparison",
    body: "Filter companies by metrics such as P/E, ROE and debt-to-equity, and compare companies side by side.",
  },
  {
    title: "Reports and PDF export",
    body: "Pro users can generate AI research reports with citations, timestamps and a disclaimer, then export them as PDF.",
  },
  {
    title: "Alerts",
    body: "Set price and movement alerts. Finvora only describes alerts as real-time when the data provider supports it.",
  },
];

export const STEPS = [
  { title: "Create a free account", body: "No card needed. Free is free forever." },
  { title: "Search a company", body: "Open its profile, chart, metrics and recent news." },
  { title: "Ask the AI", body: "Get a sourced explanation you can check yourself." },
  { title: "Save and compare", body: "Keep notes, build a watchlist, and compare companies." },
];

export type PlanRow = { label: string; free: string; pro: string };

// Values mirror docs/01-PRODUCT-REQUIREMENTS.md. "Proposed" rows await owner confirmation.
export const COMPARISON: PlanRow[] = [
  { label: "AI questions per day", free: "5", pro: "100" },
  { label: "Watchlists", free: "1", pro: "20" },
  { label: "Stocks per watchlist", free: "5", pro: "100" },
  { label: "Historical chart range", free: "1 year", pro: "Maximum from data provider" },
  { label: "Company comparison", free: "Up to 2", pro: "Up to 10" },
  { label: "Saved reports", free: "3", pro: "100" },
  { label: "Technical indicators", free: "Basic", pro: "SMA, EMA, RSI, MACD, Bollinger" },
  { label: "Stock screener", free: "Basic filters", pro: "All available filters" },
  { label: "AI research reports", free: "Not included", pro: "Included" },
  { label: "PDF export", free: "Not included", pro: "Included" },
  { label: "News", free: "Limited recent articles", pro: "More articles and AI summaries" },
  { label: "Alerts", free: "Limited", pro: "Higher limits, advanced alerts" },
];

export const FREE_POINTS = [
  "Basic stock research and company information",
  "Basic charts",
  "Limited AI questions",
  "One watchlist",
  "Limited news",
];

export const PRO_POINTS = [
  "Advanced AI research",
  "Advanced analytics and indicators",
  "Extended historical data",
  "Advanced stock screener",
  "Multiple watchlists",
  "AI reports and PDF exports",
  "Advanced company comparisons",
  "Higher usage limits",
];

export const FAQS = [
  {
    q: "Is Finvora really free?",
    a: "Yes. The Free plan costs nothing, needs no payment details, and does not expire. It has usage limits, which are shown in the app.",
  },
  {
    q: "What does Pro cost?",
    a: `Pro is ₹${PRO_PRICE_INR} per month. The price shown in the app is always the one you will be charged.`,
  },
  {
    q: "How does the 30-day trial work?",
    a: `Eligible users can start a ${TRIAL_DAYS}-day Pro trial without entering card details. When it ends you return to the Free plan unless you choose to subscribe.`,
  },
  {
    q: "Will I be charged automatically?",
    a: "No. Finvora only charges you after you explicitly choose to upgrade and authorize the payment.",
  },
  {
    q: "Can I cancel Pro?",
    a: "Yes, from your account settings. After cancelling you keep Pro access for the period you already paid for, then return to Free.",
  },
  {
    q: "Where does the data come from?",
    a: "From licensed data providers. Every figure shows its source, last-updated time, currency, and whether it is real-time, delayed, historical or cached. If data is missing, Finvora says \"Data not available\" instead of guessing.",
  },
  {
    q: "Is this financial advice?",
    a: "No. Finvora is a research tool. AI analysis is informational and is not personalized investment advice. See the financial disclaimer.",
  },
  {
    q: "Does the AI make mistakes?",
    a: "It can. Answers cite their sources so you can verify them, and the AI states when data is incomplete. Always check important facts yourself.",
  },
];
