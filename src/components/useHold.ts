import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";

export interface HoldOptions {
  disabled?: boolean;
  talk?: boolean;
  duration?: number;
  hintKey: string;
  onBegin?: () => void;
  onRelease?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
}

export function useHold(options: HoldOptions) {
  const latest = useRef(options);
  latest.current = options;
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState(false);
  const [shake, setShake] = useState(false);
  const active = useRef<{ source: string; began: number } | null>(null);
  const frame = useRef(0);
  const hintTimer = useRef(0);
  const shakeTimer = useRef(0);
  const intro = useRef<{ key: string; until: number } | null>(null);
  const duration = options.duration ?? (options.talk ? 350 : 1500);

  function clearPress() {
    cancelAnimationFrame(frame.current);
    active.current = null;
    setHolding(false);
    setProgress(0);
  }
  function cancel() {
    if (!active.current) return;
    clearPress();
    latest.current.onCancel?.();
  }
  function release(source: string) {
    const press = active.current;
    if (!press || press.source !== source) return;
    const elapsed = performance.now() - press.began;
    clearPress();
    if (elapsed < duration) {
      latest.current.onCancel?.();
      setHint(true);
      setShake(true);
      clearTimeout(hintTimer.current);
      clearTimeout(shakeTimer.current);
      hintTimer.current = window.setTimeout(() => setHint(false), 2000);
      shakeTimer.current = window.setTimeout(() => setShake(false), 300);
    } else if (latest.current.talk) latest.current.onRelease?.();
    else latest.current.onComplete?.();
  }
  function begin(source: string) {
    if (latest.current.disabled || active.current) return;
    clearTimeout(hintTimer.current);
    intro.current = null;
    setHint(false);
    setShake(false);
    active.current = { source, began: performance.now() };
    setHolding(true);
    latest.current.onBegin?.();
    const tick = () => {
      if (!active.current) return;
      const value = Math.min(1, (performance.now() - active.current.began) / duration);
      setProgress(value);
      if (value === 1 && !latest.current.talk) {
        clearPress();
        latest.current.onComplete?.();
      } else if (value < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (options.disabled) { cancel(); setHint(false); clearTimeout(hintTimer.current); return; }
    const key = `mypal.hold-hint.${options.hintKey}`;
    try {
      if (sessionStorage.getItem(key) && intro.current?.key !== key) return;
      sessionStorage.setItem(key, "seen");
    } catch { /* The hint still works when storage is unavailable. */ }
    if (intro.current?.key !== key) intro.current = { key, until: Date.now() + 3000 };
    const remaining = intro.current.until - Date.now();
    if (remaining <= 0) return;
    setHint(true);
    hintTimer.current = window.setTimeout(() => setHint(false), remaining);
    return () => clearTimeout(hintTimer.current);
  }, [options.hintKey, options.disabled]);

  useEffect(() => {
    const hide = () => { if (document.hidden) cancel(); };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(hintTimer.current);
      clearTimeout(shakeTimer.current);
      if (active.current) latest.current.onCancel?.();
      active.current = null;
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  const handlers: ButtonHTMLAttributes<HTMLButtonElement> = {
    onClick: event => event.preventDefault(),
    onContextMenu: event => event.preventDefault(),
    onPointerDown: event => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      begin(`pointer:${event.pointerId}`);
    },
    onPointerUp: event => release(`pointer:${event.pointerId}`),
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
    onPointerLeave: cancel,
    onBlur: cancel,
    onKeyDown: event => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      if (!event.repeat) begin(event.key);
    },
    onKeyUp: event => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      release(event.key);
    },
  };
  return { handlers, holding, progress, hint, shake, remaining: Math.max(0, (duration * (1 - progress)) / 1000) };
}
