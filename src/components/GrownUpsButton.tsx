import { useEffect, useRef, useState, type CSSProperties } from "react";

/** Accidental taps never open settings. Pointer and keyboard share one timer. */
export function GrownUpsButton({ onOpen, exit = false, variant = "default", disabled = false }: {
  onOpen: () => void; exit?: boolean; variant?: "default" | "parents" | "exit"; disabled?: boolean;
}) {
  const exiting = exit || variant === "exit";
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const source = useRef<string | null>(null);
  const open = useRef(onOpen);
  open.current = onOpen;

  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    source.current = null;
    setProgress(0);
  }
  function start(input: string) {
    if (source.current || disabled) return;
    source.current = input;
    const began = performance.now();
    const tick = (now: number) => {
      if (source.current !== input) return;
      const amount = Math.min(1, (now - began) / (exiting ? 1400 : 1500));
      setProgress(amount);
      if (amount === 1) { reset(); open.current(); }
      else frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }
  useEffect(() => {
    const hidden = () => { if (document.hidden) reset(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); document.removeEventListener("visibilitychange", hidden); };
  }, []);

  return <div className={variant === "default" ? "flow-grownups" : undefined}>
    <button type="button" className={variant === "default" ? "flow-hold-button" : "prototype-parent-button"} disabled={disabled}
      style={{ "--flow-hold-progress": `${progress * 360}deg` } as CSSProperties}
      aria-label={exiting ? "Hold: Exit" : variant === "parents" ? "Parents, press and hold" : "Grown-ups: hold for 1.5 seconds"}
      onClick={(event) => event.preventDefault()} onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        start(`pointer:${event.pointerId}`);
      }}
      onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset} onPointerLeave={reset}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!event.repeat) start(event.key);
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); reset(); }
      }} onBlur={reset}>
      <span>{exiting ? "Hold: Exit" : variant === "parents" ? "👨‍👩‍👧 Parents" : "🔒 Grown-ups"}</span>
      {variant !== "default" && <span className="absolute bottom-0 left-0 h-1 bg-[#FF7849]" style={{ width: `${progress * 100}%` }} aria-hidden="true" />}
    </button>
    {variant === "default" && !exiting && <span className="flow-hold-hint">Press and hold</span>}
  </div>;
}
