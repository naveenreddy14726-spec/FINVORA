"use client";

import { useState } from "react";

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
    </div>
  );
}

export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <div role="status" className="animate-pulse space-y-3" aria-label={label}>
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="h-24 rounded bg-slate-200" />
      <div className="h-24 rounded bg-slate-200" />
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 rounded-md border border-red-300 px-3 py-1 font-medium hover:bg-red-100">
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function StatCard({ label, value, note }: { label: string; value: number | string | null; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value ?? "Unavailable"}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

export function Unavailable({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">Data not available. {reason}</p>
    </div>
  );
}

const BADGES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-800",
  pro: "bg-indigo-100 text-indigo-800",
  trial: "bg-amber-100 text-amber-800",
  free: "bg-slate-100 text-slate-700",
  admin: "bg-purple-100 text-purple-800",
  user: "bg-slate-100 text-slate-700",
  cancelled: "bg-slate-200 text-slate-700",
  expired: "bg-slate-200 text-slate-700",
  failed: "bg-red-100 text-red-800",
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BADGES[value] ?? "bg-slate-100 text-slate-700"}`}>
      {value}
    </span>
  );
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "Data not available";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "Data not available" : d.toLocaleString();
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>
        {total} result{total === 1 ? "" : "s"} · page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40">
          Previous
        </button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}

// Table wrapper: scrolls sideways on small screens instead of breaking the layout.
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}
export const th = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50";
export const td = "px-4 py-3 border-t border-slate-100 align-top";

// Confirmation dialog that also collects a reason (required for audited actions).
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 5;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="dlg-title" className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Reason (required, recorded in the audit log)
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!valid || busy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
