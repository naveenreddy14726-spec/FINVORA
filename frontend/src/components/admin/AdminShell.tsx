"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { apiGet } from "@/lib/api";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/settings", label: "Settings" },
];

type Access = { s: "loading" } | { s: "denied" } | { s: "error"; message: string } | { s: "ok"; email: string };

function SidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [access, setAccess] = useState<Access>({ s: "loading" });
  const [menu, setMenu] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      // The backend decides. A non-admin gets 403 here and sees no admin UI at all.
      const r = await apiGet<{ email: string }>("/api/admin/me");
      if (cancelled) return;
      if (r.ok) setAccess({ s: "ok", email: r.data.email });
      else if (r.status === 401) router.replace("/login");
      else if (r.status === 403) setAccess({ s: "denied" });
      else setAccess({ s: "error", message: r.message });
    })();
    return () => {
      cancelled = true;
    };
  }, [configured, router]);

  async function logout() {
    await getSupabase().auth.signOut();
    router.push("/");
  }

  function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    router.push(q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users");
  }

  if (!configured) return <p className="p-8 text-sm">Authentication is not configured.</p>;
  if (access.s === "loading") return <p role="status" className="p-8 text-sm">Checking admin access...</p>;
  if (access.s === "denied") {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to view this page.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-indigo-600">Go to dashboard</Link>
      </div>
    );
  }
  if (access.s === "error") return <p role="alert" className="p-8 text-sm text-red-600">{access.message}</p>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
        <Logo className="mb-6" />
        <SidebarLinks />
      </aside>

      {/* Mobile drawer */}
      {menu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
          <aside className="relative h-full w-64 bg-white p-4 shadow-xl">
            <Logo className="mb-6" />
            <SidebarLinks onNavigate={() => setMenu(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <button
            className="rounded-md p-2 text-slate-700 md:hidden"
            aria-label="Open menu"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <form onSubmit={search} role="search" className="flex-1">
            <input
              name="q"
              type="search"
              maxLength={100}
              placeholder="Search users by name, email or ID"
              aria-label="Search users"
              className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </form>
          <span className="hidden text-sm text-slate-600 sm:inline" title="Signed in as">{access.email}</span>
          <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Log out</button>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
