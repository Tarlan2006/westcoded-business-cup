import { useState } from "react";

export default function App() {
  const [result, setResult] = useState("");
  const [pending, setPending] = useState(false);

  async function checkHealth() {
    setPending(true);
    setResult("");

    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed (HTTP ${response.status}).`);
      }
      setResult(JSON.stringify(await response.json(), null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Could not reach the Worker.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-6 py-12 text-slate-100">
      <section className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mission Control</h1>
        <button
          type="button"
          className="mt-6 rounded-lg bg-sky-300 px-4 py-2.5 font-semibold text-slate-950 hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 disabled:opacity-60"
          disabled={pending}
          onClick={checkHealth}
        >
          {pending ? "Checking…" : "Check API health"}
        </button>
        <pre
          role="status"
          className={result ? "mt-4 rounded-lg bg-slate-950 p-4 text-sm break-words whitespace-pre-wrap" : "sr-only"}
        >
          {result}
        </pre>
      </section>
    </main>
  );
}
