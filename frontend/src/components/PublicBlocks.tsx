import Link from "next/link";
import { COMPARISON, FAQS, FREE_POINTS, PRO_POINTS, PRO_PRICE_INR, TRIAL_DAYS } from "@/lib/site";

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-6 pt-14 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-3 text-lg text-slate-600">{subtitle}</p>}
    </div>
  );
}

function Check() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 011.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" />
    </svg>
  );
}

export function PlanCards() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold">Free</h3>
        <p className="mt-2 text-4xl font-bold">₹0<span className="text-base font-normal text-slate-500">/month</span></p>
        <p className="mt-1 text-sm text-slate-500">Free forever. No card needed.</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-700">
          {FREE_POINTS.map((p) => (
            <li key={p} className="flex gap-2"><Check />{p}</li>
          ))}
        </ul>
        <Link href="/signup" className="mt-6 block rounded-lg border border-slate-300 py-2 text-center text-sm font-semibold hover:bg-slate-50">
          Start free
        </Link>
      </div>
      <div className="rounded-2xl border-2 border-indigo-600 bg-white p-6">
        <h3 className="text-lg font-semibold text-indigo-700">Pro</h3>
        <p className="mt-2 text-4xl font-bold">₹{PRO_PRICE_INR}<span className="text-base font-normal text-slate-500">/month</span></p>
        <p className="mt-1 text-sm text-slate-500">{TRIAL_DAYS}-day trial for eligible users. No card for the trial.</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-700">
          {PRO_POINTS.map((p) => (
            <li key={p} className="flex gap-2"><Check />{p}</li>
          ))}
        </ul>
        <Link href="/signup" className="mt-6 block rounded-lg bg-indigo-600 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700">
          Create account to try Pro
        </Link>
      </div>
    </div>
  );
}

export function ComparisonTable() {
  return (
    <div className="mx-auto max-w-4xl overflow-x-auto px-4">
      <table className="w-full min-w-[480px] border-collapse text-left text-sm">
        <caption className="sr-only">Free versus Pro feature comparison</caption>
        <thead>
          <tr className="border-b border-slate-300">
            <th scope="col" className="py-3 pr-4 font-semibold">Feature</th>
            <th scope="col" className="py-3 pr-4 font-semibold">Free</th>
            <th scope="col" className="py-3 font-semibold text-indigo-700">Pro</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((r) => (
            <tr key={r.label} className="border-b border-slate-200">
              <th scope="row" className="py-3 pr-4 font-medium text-slate-800">{r.label}</th>
              <td className="py-3 pr-4 text-slate-600">{r.free}</td>
              <td className="py-3 text-slate-800">{r.pro}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">
        Limits are defaults and can change. The app always shows your current limits.
      </p>
    </div>
  );
}

export function FaqList({ limit }: { limit?: number }) {
  const items = limit ? FAQS.slice(0, limit) : FAQS;
  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200 px-4">
      {items.map((f) => (
        <details key={f.q} className="group py-4">
          <summary className="cursor-pointer list-none font-medium text-slate-900">
            <span className="mr-2 text-indigo-600 group-open:hidden">+</span>
            <span className="mr-2 hidden text-indigo-600 group-open:inline">−</span>
            {f.q}
          </summary>
          <p className="mt-2 pl-5 text-sm text-slate-600">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <PageHeading title={title} />
      <article className="mx-auto max-w-3xl space-y-4 px-4 pb-16 text-sm leading-relaxed text-slate-700">
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
          Draft for review. This text has not been reviewed by a lawyer. Have it reviewed before launch.
        </p>
        {children}
      </article>
    </>
  );
}
