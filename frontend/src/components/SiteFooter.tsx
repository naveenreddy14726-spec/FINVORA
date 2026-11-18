import Link from "next/link";
import Logo from "./Logo";
import { NAV_LINKS, SITE } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-slate-600">{SITE.tagline}</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm text-slate-600">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Legal" className="flex flex-col gap-2 text-sm text-slate-600">
          <Link href="/privacy" className="hover:text-slate-900">Privacy policy</Link>
          <Link href="/terms" className="hover:text-slate-900">Terms and conditions</Link>
          <Link href="/disclaimer" className="hover:text-slate-900">Financial disclaimer</Link>
        </nav>
      </div>
      <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
        Finvora provides research information only and is not investment advice. © Finvora.
      </div>
    </footer>
  );
}
