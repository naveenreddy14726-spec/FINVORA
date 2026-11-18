"use client";

import { useApi } from "@/lib/useApi";
import { ErrorBox, fmtDate, Loading, PageTitle, StatCard, Unavailable } from "./ui";

type Overview = {
  generated_at: string;
  users: { total: number; new_today: number; new_this_month: number; free: number; pro: number; trial: number; suspended: number; admins: number };
  subscriptions: { active_pro: number; active_trials: number; expired_trials: number; cancelled: number; failed: number };
  revenue: { available: boolean; reason: string };
  ai: { available: boolean; reason: string };
};

export default function OverviewView() {
  const { loading, data, error, reload } = useApi<Overview>("/api/admin/overview");
  return (
    <>
      <PageTitle title="Dashboard" subtitle={data ? `Live from the database. Updated ${fmtDate(data.generated_at)}.` : "Live from the database."} />
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-8">
          <section aria-labelledby="h-users">
            <h2 id="h-users" className="mb-3 text-sm font-semibold text-slate-700">Users</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total users" value={data.users.total} />
              <StatCard label="New today (UTC)" value={data.users.new_today} />
              <StatCard label="New this month (UTC)" value={data.users.new_this_month} />
              <StatCard label="Suspended" value={data.users.suspended} />
              <StatCard label="Free" value={data.users.free} note="Neither Pro nor on an active trial" />
              <StatCard label="Pro" value={data.users.pro} note="Active paid subscription" />
              <StatCard label="On trial" value={data.users.trial} note="Unexpired trial, not paid" />
              <StatCard label="Admins" value={data.users.admins} />
            </div>
          </section>
          <section aria-labelledby="h-subs">
            <h2 id="h-subs" className="mb-3 text-sm font-semibold text-slate-700">Subscriptions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Active Pro" value={data.subscriptions.active_pro} />
              <StatCard label="Active trials" value={data.subscriptions.active_trials} />
              <StatCard label="Expired trials" value={data.subscriptions.expired_trials} />
              <StatCard label="Cancelled" value={data.subscriptions.cancelled} />
              <StatCard label="Failed" value={data.subscriptions.failed} />
            </div>
          </section>
          <section aria-labelledby="h-more" className="grid gap-4 md:grid-cols-2">
            <h2 id="h-more" className="sr-only">Revenue and AI</h2>
            <Unavailable title="Revenue" reason={data.revenue.reason} />
            <Unavailable title="AI usage" reason={data.ai.reason} />
          </section>
        </div>
      )}
    </>
  );
}
