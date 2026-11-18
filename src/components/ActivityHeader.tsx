import { t } from "../i18n/index";
import { createContext, useContext, type ReactNode } from "react";
import { SessionHeaderActions } from "./SessionControls";

export const ActivityXp = createContext<number | undefined>(undefined);
export const ActivityNavigation = createContext<{
  onBack: () => void; onHome: () => void; breadcrumb: string; name?: string;
} | undefined>(undefined);

export function ActivityHeader({ title, xp, onBack, backHref, backDisabled, children, exitControl }: {
  title: string; xp?: number; onBack?: () => void; backHref?: string; backDisabled?: boolean; children?: ReactNode; exitControl?: ReactNode;
}) {
  const profileXp = useContext(ActivityXp);
  const navigation = useContext(ActivityNavigation);
  const total = xp ?? profileXp;
  return (
    <header className="topbar activity-header prototype-activity-header">
      <div className="flow-header-navigation">
        {exitControl ?? (!backHref && (navigation || onBack) && <button type="button" className="quiet-button" disabled={backDisabled} onClick={navigation?.onBack ?? onBack}>
          <span aria-hidden="true">←</span> {t("activityHeader.back")}</button>)}
        {backHref && <a className="quiet-button" href={backHref}>{t("activityHeader.backAlt")}</a>}
        {!exitControl && navigation && <button type="button" className="quiet-button flow-home-button" disabled={backDisabled} aria-label={t("activityHeader.homeBackToActivities")} onClick={navigation.onHome}>🏠</button>}
      </div>
      <div className="flow-header-location"><span className="activity-header-title">{title}</span>
        {navigation && <nav className="flow-breadcrumb" aria-label={t("activityHeader.breadcrumb")}>{navigation.breadcrumb}</nav>}
      </div>
      <div className="activity-header-actions">
        {navigation?.name && <span className="prototype-agent-name">{navigation.name}</span>}
        {total !== undefined && <span className="xp-chip">{total} XP</span>}
        {children}
        <SessionHeaderActions />
      </div>
    </header>
  );
}
