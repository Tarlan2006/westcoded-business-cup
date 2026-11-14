"use client";

import { useState } from "react";
import type { AnalysisResult, Severity } from "@/lib/types";

const sevStyle: Record<Severity, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function ResultCard({ result, locked }: { result: AnalysisResult; locked: boolean }) {
  const [copied, setCopied] = useState(false);
  const visible = locked ? result.findings.slice(0, 1) : result.findings;

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{result.headline}</h2>
      <p className="mt-1 text-slate-600">{result.summary}</p>
      {typeof result.totalUsd === "number" && result.totalUsd > 0 && (
        <p className="mt-4 inline-block rounded-lg bg-brand-light px-3 py-2 text-brand-dark">
          Potential impact: <strong>{usd(result.totalUsd)}</strong>
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {visible.map((f, i) => (
          <li key={i} className={`rounded-lg border p-3 ${sevStyle[f.severity] ?? sevStyle.low}`}>
            <div className="flex justify-between gap-3 font-medium">
              <span>{f.title}</span>
              {typeof f.amountUsd === "number" && f.amountUsd > 0 && <span>{usd(f.amountUsd)}</span>}
            </div>
            <p className="mt-1 text-sm opacity-90">{f.detail}</p>
          </li>
        ))}
        {locked && result.findings.length > 1 && (
          <li className="rounded-lg border border-dashed p-3 text-sm text-slate-500">
            + {result.findings.length - 1} more findings, next steps and the ready-to-send letter are in the full report.
          </li>
        )}
      </ul>

      {!locked && (
        <>
          <h3 className="mt-6 font-semibold">Next steps</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
            {result.nextSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>

          {result.draft && (
            <>
              <div className="mt-6 flex items-center justify-between">
                <h3 className="font-semibold">Ready-to-send draft</h3>
                <button
                  className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.draft ?? "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm">{result.draft}</pre>
            </>
          )}
        </>
      )}
    </section>
  );
}
