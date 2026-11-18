import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Log in" };

// Placeholder. The working form (Supabase Auth) is built in Phase 3.
export default function LoginPage() {
  return (
    <div className="text-center">
      <h1 className="text-xl font-bold">Log in</h1>
      <p className="mt-3 text-sm text-slate-600">Login opens when authentication is set up (Phase 3).</p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">Back to home</Link>
    </div>
  );
}
