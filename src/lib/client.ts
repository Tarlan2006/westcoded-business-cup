"use client";

/** Anonymous, no-login usage state kept in localStorage. */
const USES_KEY = "wc_uses";
const PRO_KEY = "wc_pro";

export function getUses(): number {
  try {
    return Number(localStorage.getItem(USES_KEY) || 0);
  } catch {
    return 0;
  }
}

export function addUse(): number {
  const n = getUses() + 1;
  try {
    localStorage.setItem(USES_KEY, String(n));
  } catch {}
  return n;
}

export function isPro(): boolean {
  try {
    return localStorage.getItem(PRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPro() {
  try {
    localStorage.setItem(PRO_KEY, "1");
  } catch {}
}

/** Fire-and-forget analytics. Logged server-side; swap for PostHog/Plausible later. */
export function track(event: string, props: Record<string, unknown> = {}) {
  try {
    navigator.sendBeacon?.(
      "/api/event",
      new Blob([JSON.stringify({ event, props, t: Date.now() })], { type: "application/json" }),
    );
  } catch {}
}
