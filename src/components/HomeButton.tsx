import { t } from "../i18n/index";

export function HomeButton({ onHome, className = "prototype-parent-button" }: {
  onHome: () => void; className?: string;
}) {
  const label = t("activityHeader.homeBackToActivities");
  return <button type="button" className={`${className} min-w-11 min-h-11`} aria-label={label} title={label} onClick={onHome}>
    <span className="inline-block align-middle text-xl leading-none" aria-hidden="true">🏠</span>
  </button>;
}
