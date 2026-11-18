"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Badge, ConfirmDialog, Empty, ErrorBox, fmtDate, Loading, PageTitle, Pagination, TableWrap, td, th } from "./ui";

type UserRow = {
  id: string; email: string; full_name: string | null; role: string; status: string;
  created_at: string; plan: string; trial_expires_at: string | null;
};
type UserList = { items: UserRow[]; total: number; page: number; page_size: number };
type Detail = {
  profile: { id: string; email: string; full_name: string | null; role: string; status: string };
  plan: string;
  subscriptions: { id: string; plan_id: string; status: string; provider: string | null; current_period_end: string | null; created_at: string }[];
  trial: { started_at: string; expires_at: string } | null;
  watchlist_count: number | null;
  saved_research_count: number | null;
  ai_usage: number | null;
};

const select = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

function DetailPanel({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged: () => void }) {
  const { loading, data, error, reload } = useApi<Detail>(`/api/admin/users/${userId}`);
  const [confirm, setConfirm] = useState<"suspended" | "active" | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function apply(reason: string) {
    if (!confirm) return;
    setBusy(true);
    setActionError(null);
    const r = await apiPost(`/api/admin/users/${userId}/status`, { status: confirm, reason });
    setBusy(false);
    if (!r.ok) {
      setActionError(r.message);
      return;
    }
    setConfirm(null);
    reload();
    onChanged();
  }

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5" aria-label="User details">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-bold">User details</h2>
        <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800" aria-label="Close details">Close</button>
      </div>
      {loading && <div className="mt-4"><Loading /></div>}
      {error && <div className="mt-4"><ErrorBox message={error} onRetry={reload} /></div>}
      {data && (
        <div className="mt-4 space-y-4 text-sm">
          <dl className="space-y-1">
            <div className="flex gap-2"><dt className="w-24 text-slate-500">Email</dt><dd className="break-all">{data.profile.email}</dd></div>
            <div className="flex gap-2"><dt className="w-24 text-slate-500">Name</dt><dd>{data.profile.full_name ?? "Data not available"}</dd></div>
            <div className="flex gap-2"><dt className="w-24 text-slate-500">ID</dt><dd className="break-all font-mono text-xs">{data.profile.id}</dd></div>
            <div className="flex gap-2"><dt className="w-24 text-slate-500">Role</dt><dd><Badge value={data.profile.role} /></dd></div>
            <div className="flex gap-2"><dt className="w-24 text-slate-500">Status</dt><dd><Badge value={data.profile.status} /></dd></div>
            <div className="flex gap-2"><dt className="w-24 text-slate-500">Plan</dt><dd><Badge value={data.plan} /></dd></div>
            {data.trial && (
              <div className="flex gap-2"><dt className="w-24 text-slate-500">Trial</dt><dd>{fmtDate(data.trial.started_at)} to {fmtDate(data.trial.expires_at)}</dd></div>
            )}
            <div className="flex gap-2"><dt className="w-24 text-slate-500">Watchlists</dt><dd>{data.watchlist_count ?? "Data not available"}</dd></div>
            <div className="flex gap-2"><dt className="w-24 text-slate-500">Saved research</dt><dd>{data.saved_research_count ?? "Data not available"}</dd></div>
            <div className="flex gap-2"><dt className="w-24 text-slate-500">AI usage</dt><dd>{data.ai_usage ?? "Data not available"}</dd></div>
          </dl>
          <div>
            <h3 className="mb-1 font-semibold">Subscription history</h3>
            {data.subscriptions.length === 0 ? (
              <p className="text-slate-500">No subscriptions recorded.</p>
            ) : (
              <ul className="space-y-1">
                {data.subscriptions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2">
                    <Badge value={s.plan_id} /> <Badge value={s.status} />
                    <span className="text-xs text-slate-500">since {fmtDate(s.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {data.profile.role === "admin" ? (
            <p className="text-xs text-slate-500">Admin accounts cannot be suspended from this screen.</p>
          ) : data.profile.status === "active" ? (
            <button onClick={() => setConfirm("suspended")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Suspend user
            </button>
          ) : (
            <button onClick={() => setConfirm("active")} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Restore user
            </button>
          )}
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm === "suspended" ? "Suspend this user?" : "Restore this user?"}
          description={
            confirm === "suspended"
              ? "The user will be blocked from the app and API immediately. This action is recorded in the audit log."
              : "The user will regain access. This action is recorded in the audit log."
          }
          confirmLabel={confirm === "suspended" ? "Suspend" : "Restore"}
          danger={confirm === "suspended"}
          busy={busy}
          error={actionError}
          onConfirm={apply}
          onCancel={() => { setConfirm(null); setActionError(null); }}
        />
      )}
    </aside>
  );
}

function UsersInner({ initialQ }: { initialQ: string }) {
  const [input, setInput] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), page_size: "25" });
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  if (plan) params.set("plan", plan);
  const { loading, data, error, reload } = useApi<UserList>(`/api/admin/users?${params}`);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQ(input.trim());
  }

  return (
    <>
      <PageTitle title="Users" subtitle="Search, filter and manage accounts. Passwords and card details are never shown." />
      <form onSubmit={submit} className="mb-4 flex flex-wrap gap-2" role="search">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={100}
          placeholder="Name, email or ID"
          aria-label="Search users"
          className={`${select} min-w-[200px] flex-1`}
        />
        <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} aria-label="Filter by plan" className={select}>
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="trial">Trial</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className={select}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Search</button>
      </form>

      <div className={selected ? "grid gap-6 xl:grid-cols-[1fr_380px]" : ""}>
        <div className="min-w-0">
          {loading && <Loading />}
          {error && <ErrorBox message={error} onRetry={reload} />}
          {data && data.items.length === 0 && <Empty title="No users match." hint="Try clearing the search or filters." />}
          {data && data.items.length > 0 && (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <th className={th}>User</th><th className={th}>Plan</th><th className={th}>Status</th>
                    <th className={th}>Joined</th><th className={th}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id} className={selected === u.id ? "bg-indigo-50" : ""}>
                      <td className={td}>
                        <div className="font-medium text-slate-900">{u.full_name ?? "Data not available"}</div>
                        <div className="break-all text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className={td}><Badge value={u.plan} /></td>
                      <td className={td}>
                        <Badge value={u.status} /> {u.role === "admin" && <Badge value="admin" />}
                      </td>
                      <td className={td}>{fmtDate(u.created_at)}</td>
                      <td className={td}>
                        <button onClick={() => setSelected(u.id)} className="font-medium text-indigo-600 hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={setPage} />
            </>
          )}
        </div>
        {selected && <DetailPanel key={selected} userId={selected} onClose={() => setSelected(null)} onChanged={reload} />}
      </div>
    </>
  );
}

export default function UsersView() {
  const q = useSearchParams().get("q") ?? "";
  // Re-mount when the URL search changes (top bar search) so the input and results follow it.
  return <UsersInner key={q} initialQ={q} />;
}
