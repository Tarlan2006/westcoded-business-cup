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
    <h2 id="flow-leave-title">Leave this game?</h2>
    <p id="flow-leave-description">It's okay to take a break. Your finished activities are saved, but this round will start over.</p>
    <div className="flow-form-actions">
      <button ref={stay} type="button" className="primary-button" onClick={onStay}>Keep playing</button>
      <button type="button" className="secondary-button" onClick={onLeave}>Leave game</button>
    </div>
  </dialog>;
}
