import type { ReactNode } from "react";

export function PrototypeFrame({ children }: { children: ReactNode }) {
  return <div className="prototype min-h-svh">
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden opacity-35 z-0">
      <div className="absolute top-12 left-10 w-3 h-3 bg-white rotate-45 rounded-xs" />
      <div className="absolute top-28 right-16 w-4 h-4 bg-[#FFD13B] rotate-45 rounded-xs" />
      <div className="absolute bottom-24 left-1/4 w-3 h-3 bg-[#38BDF8] rotate-45 rounded-xs" />
      <div className="absolute top-1/2 right-10 w-2.5 h-2.5 bg-[#FF7849] rotate-45 rounded-xs" />
    </div>
    {children}
  </div>;
}
