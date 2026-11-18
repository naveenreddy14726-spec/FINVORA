import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading } from "@/components/PublicBlocks";

export const metadata: Metadata = { title: "System status" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Health = { status: string; integrations: Record<string, boolean> };

async function getHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as Health) : null;
  } catch {
    return null;
  }
}

async function BackendStatus() {
  const h = await getHealth();
  if (!h) {
    return <p className="text-sm text-red-600">Backend not reachable at {API_URL}.</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      <li>API: {h.status}</li>
      {Object.entries(h.integrations).map(([k, ok]) => (
        <li key={k}>
          {k}: {ok ? "configured" : "not configured"}
        </li>
      ))}
    </ul>
  );
}

export default function StatusPage() {
  return (
    <>
      <PageHeading title="System status" />
      <div className="mx-auto max-w-md px-4 pb-16">
        <Suspense fallback={<p className="text-sm">Checking backend...</p>}>
          <BackendStatus />
        </Suspense>
      </div>
    </>
  );
}
