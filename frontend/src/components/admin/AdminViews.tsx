"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { Badge, Empty, ErrorBox, fmtDate, Loading, PageTitle, Pagination, StatCard, TableWrap, td, th } from "./ui";

type Page<T> = { items: T[]; total: number; page: number; page_size: number };
const select = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

// ---------------------------------------------------------------- subscriptions
type Sub = {
  id: string; user_id: string; user_email: string | null; plan_id: string; status: string;
  provider: string | null; provider_subscription_id: string | null; current_period_end: string | null; created_at: string;
};

export function SubscriptionsView() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page: String(page), page_size: "25" });
  if (status) qs.set("status", status);
  const { loading, data, error, reload } = useApi<Page<Sub>>(`/api/admin/subscriptions?${qs}`);
  return (
    <>
      <PageTitle title="Subscriptions" subtitle="Every user starts on an active Free subscription. Paid subscriptions arrive with the payments phase." />
      <div className="mb-4">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status" className={select}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <Empty title="No subscriptions found." />}
      {data && data.items.length > 0 && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>User</th><th className={th}>Plan</th><th className={th}>Status</th>
                <th className={th}>Provider</th><th className={th}>Renews / ends</th><th className={th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.id}>
                  <td className={`${td} break-all`}>{s.user_email ?? s.user_id}</td>
                  <td className={td}><Badge value={s.plan_id} /></td>
                  <td className={td}><Badge value={s.status} /></td>
                  <td className={td}>{s.provider ?? "None"}</td>
                  <td className={td}>{fmtDate(s.current_period_end)}</td>
                  <td className={td}>{fmtDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- plans
type Plan = { id: string; name: string; price_inr: number; description: string | null; active_subscriptions: number };

export function PlansView() {
  const { loading, data, error, reload } = useApi<{ items: Plan[]; note: string }>("/api/admin/plans");
  return (
    <>
      <PageTitle title="Plans" subtitle="Read-only for now." />
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {data.items.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{p.name}</h2>
                  <Badge value={p.id} />
                </div>
                <p className="mt-2 text-3xl font-bold">₹{p.price_inr}<span className="text-sm font-normal text-slate-500">/month</span></p>
                <p className="mt-2 text-sm text-slate-600">{p.description ?? "Data not available"}</p>
                <p className="mt-3 text-sm"><span className="font-semibold">{p.active_subscriptions}</span> active subscription{p.active_subscriptions === 1 ? "" : "s"}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">{data.note}</p>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- analytics
type Signups = { days: number; total: number; series: { date: string; signups: number }[] };

export function AnalyticsView() {
  const [days, setDays] = useState(30);
  const { loading, data, error, reload } = useApi<Signups>(`/api/admin/analytics/signups?days=${days}`);
  const max = data ? Math.max(1, ...data.series.map((s) => s.signups)) : 1;
  return (
    <>
      <PageTitle title="Analytics" subtitle="Signups are real. Revenue and AI charts need data from later phases." />
      <div className="mb-4">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Date range" className={select}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-4">
          <StatCard label={`Signups, last ${data.days} days (UTC)`} value={data.total} />
          {data.total === 0 ? (
            <Empty title="No signups in this period." />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-40 items-end gap-0.5" role="img" aria-label={`Daily signups, ${data.total} total`}>
                {data.series.map((s) => (
                  <div
                    key={s.date}
                    title={`${s.date}: ${s.signups}`}
                    className="flex-1 rounded-t bg-indigo-500"
                    style={{ height: `${(s.signups / max) * 100}%`, minHeight: s.signups ? 2 : 0 }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>{data.series[0].date}</span>
                <span>{data.series[data.series.length - 1].date}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- audit logs
type Audit = {
  id: string; admin_id: string | null; admin_email: string | null; action: string; resource_type: string;
  resource_id: string | null; previous_value: unknown; new_value: unknown; reason: string | null;
  request_id: string | null; created_at: string;
};

export function AuditLogsView() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page: String(page), page_size: "25" });
  if (action) qs.set("action", action);
  const { loading, data, error, reload } = useApi<Page<Audit>>(`/api/admin/audit-logs?${qs}`);
  return (
    <>
      <PageTitle title="Audit logs" subtitle="Every sensitive admin action is recorded here. Entries cannot be edited from the app." />
      <div className="mb-4">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} aria-label="Filter by action" className={select}>
          <option value="">All actions</option>
          <option value="admin.provision">admin.provision</option>
          <option value="user.suspend">user.suspend</option>
          <option value="user.restore">user.restore</option>
        </select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <Empty title="No audit entries yet." />}
      {data && data.items.length > 0 && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th className={th}>When</th><th className={th}>Admin</th><th className={th}>Action</th>
                <th className={th}>Resource</th><th className={th}>Change</th><th className={th}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id}>
                  <td className={td}>{fmtDate(a.created_at)}</td>
                  <td className={`${td} break-all`}>{a.admin_email ?? a.admin_id ?? "Data not available"}</td>
                  <td className={`${td} font-mono text-xs`}>{a.action}</td>
                  <td className={`${td} break-all text-xs`}>{a.resource_type}{a.resource_id ? ` ${a.resource_id}` : ""}</td>
                  <td className={`${td} font-mono text-xs`}>
                    {a.previous_value ? JSON.stringify(a.previous_value) : "None"} → {a.new_value ? JSON.stringify(a.new_value) : "None"}
                  </td>
                  <td className={td}>{a.reason ?? "None"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- settings
type SettingsData = { environment: string; admin_require_mfa: boolean; integrations: Record<string, boolean> };

export function SettingsView() {
  const { loading, data, error, reload } = useApi<SettingsData>("/api/admin/settings");
  return (
    <>
      <PageTitle title="Settings" subtitle="Read-only status. Secret values are never shown." />
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Environment" value={data.environment} />
            <StatCard label="Admin MFA required" value={data.admin_require_mfa ? "Yes" : "No"} note={data.admin_require_mfa ? undefined : "Enable ADMIN_REQUIRE_MFA after enrolling MFA"} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">Integrations</h2>
            <ul className="space-y-1 text-sm">
              {Object.entries(data.integrations).map(([name, ok]) => (
                <li key={name} className="flex items-center justify-between">
                  <span>{name}</span>
                  <span className={ok ? "text-emerald-700" : "text-slate-500"}>{ok ? "Configured" : "Not configured"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
