import { NextRequest, NextResponse } from "next/server";
import { product } from "@/config/product";
import { callLLM, extractJson } from "@/lib/llm";
import { rateLimit } from "@/lib/ratelimit";
import type { AnalysisResult, AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`min:${ip}`, 8, 60_000) || !rateLimit(`hour:${ip}`, 40, 3_600_000)) {
    return NextResponse.json<AnalyzeResponse>(
      { ok: false, error: "Too many requests. Please wait a minute." },
      { status: 429 },
    );
  }

  let text = "";
  try {
    const body = await req.json();
    text = String(body?.text ?? "").trim();
  } catch {
    return NextResponse.json<AnalyzeResponse>({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (text.length < 20) {
    return NextResponse.json<AnalyzeResponse>(
      { ok: false, error: "Please paste a bit more text so we can analyze it." },
      { status: 400 },
    );
  }
  if (text.length > product.input.maxChars) {
    text = text.slice(0, product.input.maxChars);
  }

  try {
    const raw = await callLLM(product.systemPrompt, text);
    if (raw === null) {
      // No API key configured: DEMO mode keeps the live URL working.
      return NextResponse.json<AnalyzeResponse>({ ok: true, demo: true, result: product.sampleResult });
    }
    const parsed = extractJson<AnalysisResult>(raw);
    if (!parsed || !Array.isArray(parsed.findings)) {
      return NextResponse.json<AnalyzeResponse>({ ok: true, demo: true, result: product.sampleResult });
    }
    return NextResponse.json<AnalyzeResponse>({ ok: true, result: parsed });
  } catch (err) {
    console.error("analyze failed", err);
    // Never show an empty screen on stage: fall back to the sample result.
    return NextResponse.json<AnalyzeResponse>({ ok: true, demo: true, result: product.sampleResult });
  }
}
