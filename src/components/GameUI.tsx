import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonTone = "lime" | "mint" | "purple" | "coral" | "sky";

export function GameButton({ tone = "mint", className = "", type = "button", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return <button {...props} type={type} data-button-tone={tone} className={`game-button ${className}`} />;
}

export function HubTile({ icon, title, children, onClick, tone }: {
  icon: string; title: string; children: ReactNode; onClick: () => void; tone?: "active" | "learn" | "watch" | "mint" | "sun";
}) {
  return <button className="activity-tile hub-tile" type="button" onClick={onClick} data-tone={tone}>
    <span className="activity-icon" aria-hidden="true">{icon}</span>
    <strong>{title}</strong><span className="tile-description">{children}</span>
    <span aria-hidden="true" className="tile-arrow">→</span>
  </button>;
}

export function Chip({ selected, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return <button {...props} type="button" className="game-chip" aria-pressed={selected}>{children}</button>;
}

export function Segmented<T extends string | number>({ options, value, onChange, required }: {
  options: readonly { value: T; label: string; detail?: string }[];
  value: T | undefined; onChange: (value: T) => void; required?: boolean;
}) {
  const name = useId();
  return <div className="game-segmented">{options.map((option) => (
    <label className="game-segment" key={option.value}>
      <input type="radio" name={name} required={required} checked={value === option.value} onChange={() => onChange(option.value)} />
      <span>{option.label}{option.detail && <small>{option.detail}</small>}</span>
    </label>
  ))}</div>;
}

export function SpeechBubble({ children, className = "", live }: { children: ReactNode; className?: string; live?: boolean }) {
  return <div className={`speech-bubble ${className}`} aria-live={live ? "polite" : undefined}>{children}</div>;
}

const sparks = ["✦", "★", "♥", "✧", "✦", "♥", "★", "✧"];
export function ParticlePop({ hearts = false }: { hearts?: boolean }) {
  return <span className="particle-pop" aria-hidden="true">{sparks.map((spark, i) => (
    <i key={i} style={{ rotate: `${i * 45}deg` }}>{hearts ? "♥" : spark}</i>
  ))}</span>;
}

export function StarProgress({ count }: { count: number }) {
  return <span className="star-progress" aria-label={`Round ${count}`}><b aria-hidden="true">★</b> Round <strong>{count}</strong></span>;
}

export function CountdownRing({ progress, children }: { progress: number; children: ReactNode }) {
  const remaining = Math.max(0, Math.min(1, progress));
  return <div className="countdown" data-time-tone={remaining > .5 ? "mint" : remaining > .2 ? "gold" : "coral"}>
    <svg viewBox="0 0 200 200" aria-hidden="true">
      <circle className="countdown-track" cx="100" cy="100" r="92" />
      <circle className="countdown-fill" cx="100" cy="100" r="92" pathLength="100"
        strokeDasharray={`${remaining * 100} 100`} transform="rotate(-90 100 100)" />
    </svg>
    {children}
  </div>;
}
