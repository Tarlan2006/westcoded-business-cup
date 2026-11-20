import { InlineSymbol } from "./InlineSymbol";
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Mascot } from "./Mascot";
import type { ActivitySuggestion } from "./activitySuggestions";

export type ButtonTone = "lime" | "mint" | "purple" | "coral" | "sky";

export function GameButton({ tone = "mint", className = "", type = "button", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return <button {...props} type={type} data-button-tone={tone} className={`game-button ${className}`} />;
}

export function HubTile({ icon, title, children, onClick, tone }: {
  icon: ReactNode; title: string; children: ReactNode; onClick: () => void; tone?: "active" | "learn" | "watch" | "mint" | "sun";
}) {
  return <button className="activity-tile hub-tile" type="button" onClick={onClick} data-tone={tone}>
    <span className="activity-icon" aria-hidden="true">{icon}</span>
    <strong>{title}</strong><span className="tile-description">{children}</span>
    <span aria-hidden="true" className="tile-arrow"><InlineSymbol mark="→" /></span>
  </button>;
}

/** Tile icon: Ask AIdos shows AIdos himself, every other activity its emoji. */
export function ActivityIcon({ item }: { item: ActivitySuggestion }) {
  return item.activity === "ask" ? <Mascot pose="point" className="tile-mascot" /> : item.icon;
}

export function Chip({ selected, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return <button {...props} type="button" className="game-chip" aria-pressed={selected}>{children}</button>;
}

export function SpeechBubble({ children, className = "", live }: { children: ReactNode; className?: string; live?: boolean }) {
  return <div className={`speech-bubble ${className}`} aria-live={live ? "polite" : undefined}>{children}</div>;
}

const sparks = ["✦", "★", "♥", "✧", "✦", "♥", "★", "✧"];
export function ParticlePop({ hearts = false }: { hearts?: boolean }) {
  return <span className="particle-pop" aria-hidden="true">{sparks.map((spark, i) => (
    <i key={i} style={{ rotate: `${i * 45}deg` }}><InlineSymbol mark={hearts ? "♥" : spark} /></i>
  ))}</span>;
}
