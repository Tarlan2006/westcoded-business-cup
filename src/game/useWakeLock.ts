import { useEffect } from "react";

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !navigator.wakeLock) return;
    let stopped = false;
    let pending = false;
    let lock: WakeLockSentinel | undefined;

    async function acquire() {
      if (stopped || pending || document.hidden || (lock && !lock.released)) return;
      pending = true;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (stopped || document.hidden) await next.release();
        else lock = next;
      } catch {
        // The browser can decline a wake lock.
      } finally {
        pending = false;
      }
    }

    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}
