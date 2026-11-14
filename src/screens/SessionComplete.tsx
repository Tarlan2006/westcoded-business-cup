import { useEffect, useRef } from "react";
import { Mascot } from "../components/Mascot";

export function SessionComplete({ name, xp, streak, onBack }: {
  name: string; xp: number; streak: number; onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  return <main className="prototype-screen session-complete" aria-labelledby="session-complete-title">
    <div className="session-card space-y-4">
      <Mascot pose="jump" size={120} className="mx-auto" />
      <h1 className="text-3xl font-bold" id="session-complete-title" tabIndex={-1} ref={heading}>Session complete</h1>
      <p className="wrap-anywhere">Great job, {name}! See you next time!</p>
      <div className="flex flex-wrap justify-center gap-2">
        <span className="session-time">{xp} XP</span>
        <span className="session-time">{streak}-day streak</span>
      </div>
      <button type="button" className="session-button session-button-primary w-full" onClick={onBack}>Back to start</button>
    </div>
  </main>;
}
