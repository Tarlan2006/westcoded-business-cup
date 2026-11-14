import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** Minimal analytics sink: appears in Vercel logs. Replace with a real tool if time allows. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[event]", JSON.stringify(body).slice(0, 500));
  } catch {}
  return NextResponse.json({ ok: true });
}
