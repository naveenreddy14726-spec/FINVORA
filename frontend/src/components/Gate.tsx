"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type State =
  | { s: "loading" }
  | { s: "error"; message: string }
  | { s: "forbidden" }
  | { s: "ok"; data: Record<string, string | null> };

// Asks the backend who the user is. The backend decides; this only displays the answer.
export default function Gate({ endpoint, title }: { endpoint: "/api/me" | "/api/admin/me"; title: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ s: "loading" });
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
      const r = await apiGet<Record<string, string | null>>(endpoint);
      if (cancelled) return;
      if (r.ok) setState({ s: "ok", data: r.data });
      else if (r.status === 401) router.replace("/login");
      else if (r.status === 403) setState({ s: "forbidden" });
      else setState({ s: "error", message: r.message });
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint, router, configured]);

  async function logout() {
    await getSupabase().auth.signOut();
    router.push("/");
  }

  if (!configured) return <p className="p-8 text-sm">Authentication is not configured.</p>;
  if (state.s === "loading") return <p className="p-8 text-sm">Loading...</p>;
  if (state.s === "forbidden") {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to view this page.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-indigo-600">Go to dashboard</Link>
      </div>
    );
  }
  if (state.s === "error") return <p role="alert" className="p-8 text-sm text-red-600">{state.message}</p>;

  return (
    <div className="mx-auto max-w-xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Log out</button>
      </div>
      <dl className="mt-6 space-y-2 text-sm">
        {Object.entries(state.data).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-24 font-medium text-slate-500">{k}</dt>
            <dd>{v ?? "Data not available"}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs text-slate-500">Temporary page. The full page is built in a later phase.</p>
    </div>
  );
}
