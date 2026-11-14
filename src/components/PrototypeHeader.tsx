import type { ReactNode } from "react";
import { GrownUpsButton } from "./GrownUpsButton";
import { MascotHead } from "./Mascot";

export function PrototypeHeader({ name, label, detail, children, onParents, onHome }: {
  name: string; label?: string; detail?: string; children?: ReactNode; onParents: () => void; onHome?: () => void;
}) {
  return <header className="flex flex-wrap items-center justify-between gap-2 bg-[#1C145C]/90 px-4 py-2.5 rounded-2xl border-2 border-[#4C35DE]">
    <div className="flex items-center gap-2.5 min-w-0">
      <div aria-hidden="true" className="w-9 h-9 shrink-0 rounded-full bg-[#FFD13B] overflow-hidden border-2 border-white"><MascotHead size={32} /></div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="font-display font-bold text-base text-white wrap-anywhere">{name}</span>
          {label && <span className="px-2 py-0.5 rounded-full bg-[#2CE69B]/20 text-[#2CE69B] text-[10px] font-black uppercase">{label}</span>}
        </div>
        {detail && <span className="block text-xs font-bold text-indigo-300">{detail}</span>}
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-end gap-2">
      {children}
      {onHome && <button type="button" className="prototype-parent-button" aria-label="Home, back to activities" onClick={onHome}>🏠</button>}
      <GrownUpsButton variant="parents" onOpen={onParents} />
    </div>
  </header>;
}
