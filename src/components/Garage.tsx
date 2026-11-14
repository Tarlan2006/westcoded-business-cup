import { useEffect, useRef } from "react";
import { inventory } from "../state/garage";
import { GameButton } from "./GameUI";

export function Garage({ sessions, onClose }: { sessions: number; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const modal = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    modal?.showModal();
    return () => { modal?.close(); trigger?.focus({ preventScroll: true }); };
  }, []);

  return <dialog ref={dialog} className="flow-leave-dialog garage-dialog" aria-labelledby="garage-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <h2 id="garage-title">🛸 Spaceship Garage</h2>
    <p>{sessions ? `${sessions} ship ${sessions === 1 ? "part" : "parts"} earned` : "Finish an activity to earn your first ship part."}</p>
    <ul className="garage-list">{inventory(sessions).map((part) => (
      <li key={part.id} data-earned={part.count > 0}><span aria-hidden="true">{part.icon}</span>
        <strong>{part.name}</strong><span>{part.count ? `×${part.count}` : "Locked"}</span></li>
    ))}</ul>
    <GameButton onClick={onClose}>Close Garage</GameButton>
  </dialog>;
}
