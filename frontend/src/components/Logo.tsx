import Link from "next/link";

// Text-based wordmark used until the owner supplies the approved logo file.
// To switch: put the file in /public (e.g. /public/finvora-logo.svg) and replace
// the <span> mark below with <Image src="/finvora-logo.svg" ... />.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label="Finvora home">
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white"
      >
        F
      </span>
      <span className="text-xl font-bold tracking-tight text-slate-900">Finvora</span>
    </Link>
  );
}
