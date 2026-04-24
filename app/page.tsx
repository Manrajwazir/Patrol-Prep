// app/page.tsx
// Placeholder smoke test — confirms the frontend can reach the backend.
// Gets replaced on April 25 with real guard/supervisor routes.

import { api } from "@/lib/api";

async function fetchHealthCheck() {
  try {
    return await api.listIncidents();
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export default async function Home() {
  const data = await fetchHealthCheck();

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-6xl font-semibold tracking-tight">
          patrolprep<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p className="mt-4 text-sm text-[var(--fg-secondary)] font-mono">
          ca-central-1 · online
        </p>
        <pre className="mt-8 text-xs text-[var(--fg-tertiary)] font-mono p-4 rounded-lg bg-[var(--bg-surface)] text-left max-w-lg overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </main>
  );
}