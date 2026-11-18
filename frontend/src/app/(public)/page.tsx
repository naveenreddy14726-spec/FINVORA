import Link from "next/link";
import { ComparisonTable, FaqList, PlanCards } from "@/components/PublicBlocks";
import { FEATURES, SITE, STEPS } from "@/lib/site";

function Section({ title, subtitle, children, tint }: { title: string; subtitle?: string; children: React.ReactNode; tint?: boolean }) {
  return (
    <section className={tint ? "bg-slate-50 py-16" : "py-16"}>
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mx-auto mt-2 max-w-2xl text-center text-slate-600">{subtitle}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-indigo-50 to-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center animate-fade-up">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">AI stock research</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight text-slate-900">{SITE.tagline}</h1>
          <p className="mt-5 text-lg text-slate-600">
            Finvora helps you research listed companies with sourced data, clear charts, recent news and an AI
            assistant that cites where its answers come from.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
              Start free
            </Link>
            <Link href="/pricing" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-800 hover:bg-white">
              View plans
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-500">Free forever. No card required.</p>
        </div>
      </section>

      <Section title="What is Finvora?" subtitle="A research tool for people who want to understand a company before they decide anything.">
        <p className="mx-auto max-w-3xl text-center text-slate-700">
          Finvora brings company profiles, price history, financial metrics, news and an AI research assistant into one
          place. It is built for beginners, students and retail investors. Every figure shows where it came from and when
          it was updated, and missing data is labelled as missing.
        </p>
      </Section>

      <Section title="Core features" tint>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="How Finvora works">
        <ol className="grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-slate-200 p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Free versus Pro" subtitle="Free gives you real research tools. Pro raises the limits and adds advanced tools." tint>
        <ComparisonTable />
      </Section>

      <Section title="AI research assistant" subtitle="Preview of how answers are structured. Live answers arrive with the AI phase.">
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <p className="font-medium text-slate-900">You can ask things like:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            <li>Summarize this company&apos;s financial performance.</li>
            <li>Explain what its debt-to-equity ratio means.</li>
            <li>Compare two companies on profitability.</li>
          </ul>
          <p className="mt-4 text-slate-600">
            Answers will cite their data sources with timestamps, separate facts from interpretation, and say when data
            is incomplete. They are informational and not personalized financial advice.
          </p>
        </div>
      </Section>

      <Section title="Stock analytics" subtitle="Charts and indicators are added in a later phase. No sample prices are shown here on purpose." tint>
        <p className="mx-auto max-w-2xl text-center text-slate-700">
          Finvora will show price charts, and for Pro users SMA, EMA, RSI, MACD and Bollinger Bands, all computed from
          provider data and labelled with source and freshness.
        </p>
      </Section>

      <Section title="Pricing" subtitle="Simple and honest. No hidden charges.">
        <PlanCards />
      </Section>

      <Section title="Frequently asked questions" tint>
        <FaqList limit={5} />
        <p className="mt-6 text-center text-sm">
          <Link href="/faq" className="font-medium text-indigo-600 hover:underline">See all questions</Link>
        </p>
      </Section>
    </>
  );
}
