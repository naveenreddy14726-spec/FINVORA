import { Suspense } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Health = {
  status: string;
  environment: string;
  integrations: Record<string, boolean>;
  missing_configuration: string[];
};

async function getHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function BackendStatus() {
  const health = await getHealth();
  if (!health) {
    return (
      <p className="mt-2 text-sm text-red-600">
        Backend not reachable at {API_URL}. Start it with uvicorn.
      </p>
    );
  }
  return (
    <ul className="mt-2 space-y-1 text-sm">
      <li>
        API: {health.status} ({health.environment})
      </li>
      {Object.entries(health.integrations).map(([name, ok]) => (
        <li key={name}>
          {name}: {ok ? "configured" : "not configured"}
        </li>
      ))}
    </ul>
  );
}

// Temporary Phase 1 page. The real landing page is built in Phase 2.
export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-3xl font-bold">Finvora</h1>
      <p className="mb-6 text-gray-600">Research Deeper. Understand Better.</p>
      <h2 className="font-semibold">Backend status</h2>
      <Suspense fallback={<p className="mt-2 text-sm">Checking backend...</p>}>
        <BackendStatus />
      </Suspense>
    </main>
  );
}
