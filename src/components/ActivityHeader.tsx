import { createContext, useContext, type ReactNode } from "react";

export const ActivityXp = createContext<number | undefined>(undefined);

export function ActivityHeader({ title, xp, onBack, backHref, backDisabled, children }: {
  title: string; xp?: number; onBack?: () => void; backHref?: string; backDisabled?: boolean; children?: ReactNode;
}) {
  const profileXp = useContext(ActivityXp);
  const total = xp ?? profileXp;
  return (
    <header className="topbar activity-header">
      <div>
        {onBack && <button type="button" className="quiet-button" disabled={backDisabled} onClick={onBack}>
          <span aria-hidden="true">←</span> Back
        </button>}
        {backHref && <a className="quiet-button" href={backHref}>← Back</a>}
      </div>
      <span className="activity-header-title">{title}</span>
      <div className="activity-header-actions">
        {total !== undefined && <span className="xp-chip">{total} XP</span>}
        {children}
      </div>
    </header>
  );
}
