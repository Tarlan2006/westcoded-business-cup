"use client";

import { useEffect, useState } from "react";
import { product } from "@/config/product";
import { addUse, getUses, isPro, track } from "@/lib/client";
import type { AnalysisResult, AnalyzeResponse } from "@/lib/types";
import ResultCard from "@/components/ResultCard";
import Paywall from "@/components/Paywall";

export default function ToolPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [demo, setDemo] = useState(false);
  const [uses, setUses] = useState(0);
  const [pro, setProState] = useState(false);

  useEffect(() => {
    setUses(getUses());
    setProState(isPro());
    track("tool_view");
  }, []);

  // Paywall: the first N checks show the full report, afterwards the report is partially locked.
  const locked = !pro && uses > product.pricing.freeUses;

  async function run() {
    setError(null);
    setLoading(true);
    track("analyze_submit", { chars: text.length });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: AnalyzeResponse = await res.json();
      if (!data.ok || !data.result) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setResult(data.result);
        setDemo(Boolean(data.demo));
        setUses(addUse());
        track("analyze_success", { demo: Boolean(data.demo) });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{product.input.label}</h1>
        <p className="mt-1 text-sm text-slate-500">No account needed. Nothing is stored.</p>
      </div>

      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          maxLength={product.input.maxChars}
          placeholder={product.input.placeholder}
          className="w-full rounded-xl border bg-white p-3 font-mono text-sm outline-none focus:border-brand"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={loading || text.trim().length < 20}
            className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          <button
            onClick={() => {
              setText(product.input.sampleText);
              track("sample_click");
            }}
            className="rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-100"
          >
            {product.input.sampleLabel}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          {demo && (
            <p className="text-xs text-amber-700">Demo mode: showing a sample result (no AI key configured or the model was unavailable).</p>
          )}
          <ResultCard result={result} locked={locked} />
          {locked && <Paywall onUnlock={() => setProState(true)} />}
        </div>
      )}
    </div>
  );
}
