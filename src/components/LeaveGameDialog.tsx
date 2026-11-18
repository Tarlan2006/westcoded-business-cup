import { t } from "../i18n/index";
import { useEffect, useRef } from "react";

export function LeaveGameDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stay = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    stay.current?.focus();
    return () => element?.close();
  }, []);
  return <dialog className="flow-leave-dialog" ref={dialog} aria-labelledby="flow-leave-title" aria-describedby="flow-leave-description"
    onCancel={(event) => { event.preventDefault(); onStay(); }}>
    <span className="flow-leave-icon" aria-hidden="true">☁</span>
    <h2 id="flow-leave-title">{t("leaveGameDialog.leaveThisGame")}</h2>
    <p id="flow-leave-description">{t("leaveGameDialog.itSOkayToTakeABreak")}</p>
    <div className="flow-form-actions">
      <button ref={stay} type="button" className="primary-button" onClick={onStay}>{t("leaveGameDialog.keepPlaying")}</button>
      <button type="button" className="secondary-button" onClick={onLeave}>{t("leaveGameDialog.leaveGame")}</button>
    </div>
  </dialog>;
}
