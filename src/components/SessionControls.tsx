import { t } from "../i18n/index";
import { LanguageSwitch } from "../i18n/LanguageSwitch";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { GrownUpsButton } from "./GrownUpsButton";
import "./session.css";

export const SessionActivity = createContext<{
  endsAt: number;
  finishBy: number;
  finishing: boolean;
  canStartActivity: () => boolean;
  finishActivity: () => void;
  openParents: () => void;
} | null>(null);

const SessionSeconds = createContext<number | null>(null);

export function SessionClockProvider({ endsAt, children }: { endsAt: number | undefined; children: ReactNode }) {
  const [sample, setSample] = useState(() => ({ endsAt, now: Date.now() }));
  useEffect(() => {
    if (endsAt === undefined) return;
    const update = () => setSample({ endsAt, now: Date.now() });
    update();
    const interval = window.setInterval(update, 250);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, [endsAt]);

  const now = sample.endsAt === endsAt ? sample.now : Date.now();
  const seconds = endsAt === undefined ? null : Math.max(0, Math.ceil((endsAt - now) / 1000));
  return <SessionSeconds value={seconds}>{children}</SessionSeconds>;
}

export function SessionClock({ id, fallback }: { id?: string; fallback?: ReactNode }) {
  const seconds = useContext(SessionSeconds);
  if (seconds === null) return fallback ?? null;
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return <span className="session-time" id={id} role="timer" aria-label={t("sessionControls.sessionTimeLeft")}
    title={seconds === 0 ? t("sessionControls.finishingUp") : undefined}>{t("sessionControls.left", { time })}</span>;
}

export function SessionHeaderActions() {
  const session = useContext(SessionActivity);
  if (!session) return null;
  return <><SessionClock /><GrownUpsButton variant="parents" disabled={session.finishing} onOpen={session.openParents} /></>;
}

export function ParentSessionDialog({ onClose, onExtend, onEnd }: {
  onClose: () => void; onExtend: () => void; onEnd: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    continueButton.current?.focus();
    return () => element?.close();
  }, []);

  return <dialog className="session-dialog" ref={dialog} aria-labelledby="parent-session-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <LanguageSwitch />
        <h2 id="parent-session-title">{t("sessionControls.sessionSettings")}</h2>
    <SessionClock />
    <div className="session-dialog-actions">
      <button type="button" className="session-button" ref={continueButton} onClick={onClose}>{t("leaveGameDialog.keepPlaying")}</button>
      <button type="button" className="session-button" onClick={onExtend}>{t("sessionControls.5Min")}</button>
      <button type="button" className="session-button" onClick={onEnd}>{t("sessionControls.endSessionNow")}</button>
    </div>
  </dialog>;
}
