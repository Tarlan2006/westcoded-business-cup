import { useEffect, useRef } from "react";
import { inventory } from "../state/garage";

export function Garage({ sessions, name, onClose }: { sessions: number; name?: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const modal = dialog.current;
    const trigger = document.activeElement as HTMLElement | null;
    modal?.showModal();
    return () => { modal?.close(); trigger?.focus({ preventScroll: true }); };
  }, []);

  return <dialog ref={dialog} id="garageModal" className="prototype-garage w-[calc(100%-2rem)] max-w-md bg-[#1C145C] border-4 border-[#FFD13B] rounded-3xl p-6 text-center space-y-4 shadow-2xl" aria-labelledby="garage-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="text-5xl" aria-hidden="true">🛸</div>
    <h2 id="garage-title" className="font-display font-bold text-white">{name ? `${name}'s Spaceship Garage` : "Spaceship Garage"}</h2>
    <p>{sessions ? `${sessions} ship ${sessions === 1 ? "part" : "parts"} earned` : "Finish an activity to earn your first ship part."}</p>
    <ul className="garage-list">{inventory(sessions).map((part) => (
      <li key={part.id} data-earned={part.count > 0}><span aria-hidden="true">{part.icon}</span>
        <strong>{part.name}</strong><span>{part.count ? `×${part.count}` : "Locked"}</span></li>
    ))}</ul>
    <button type="button" className="w-full py-3 rounded-2xl btn-game btn-purple text-white font-display font-bold text-base cursor-pointer" onClick={onClose}>AWESOME!</button>
  </dialog>;
}
