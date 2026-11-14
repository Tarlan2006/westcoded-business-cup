import { useEffect, useState, type ReactNode } from "react";
import { useSoundEnabled, uiSound } from "../audio/sfx";
import { Garage } from "../components/Garage";
import { PrototypeParticles } from "../components/MissionStage";
import { codenameFor, outroLine } from "../game/content";
import { useBriefing } from "../game/useBriefing";
import { nextEpisode, partForSession } from "../state/garage";
import { rankName, type ChildProfile } from "../state/progress";

export function MissionSummary({ profile, points, onReplay, onHome, children }: {
  profile: ChildProfile; points: number; onReplay: () => void; onHome: () => void; children?: ReactNode;
}) {
  const [garage, setGarage] = useState(false);
  const sound = useSoundEnabled();
  const name = profile.preferences?.nickname ?? codenameFor(profile.codenameId);
  const sessions = profile.garageSessions ?? 0;
  const part = partForSession(sessions);
  useBriefing([outroLine], !sound, true);
  useEffect(() => uiSound("win", sound), [sound]);

  return <main id="screen-complete" className="prototype-screen relative flex-1 w-full max-w-3xl mx-auto px-4 py-4 flex flex-col items-center justify-center text-center z-10">
    <div className="bg-[#1C145C] rounded-3xl p-6 sm:p-8 border-4 border-[#FFD13B] shadow-[0_16px_48px_rgba(0,0,0,0.5)] w-full space-y-5">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2CE69B] text-[#062C1E] font-black text-sm">🎉 MISSION ACCOMPLISHED!</div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-white wrap-anywhere">Way to go, Agent {name}!</h1>

      {part && <button type="button" aria-label={`Open Spaceship Garage. New ship part: ${part.name}`} onClick={() => setGarage(true)}
        className="relative mx-auto w-44 h-44 rounded-3xl bg-linear-to-b from-[#6C47FF] to-[#2A1F8A] border-4 border-[#FFD13B] flex flex-col items-center justify-center p-4 shadow-lg">
        <span aria-hidden="true" className="text-6xl mb-1 animate-bounce">{part.icon}</span>
        <span className="text-xs font-black uppercase tracking-wider text-[#FFD13B]">New Ship Part</span>
        <span className="font-display font-bold text-base text-white">{part.name}</span>
      </button>}

      <div className="bg-[#2A1F8A] rounded-2xl p-4 border-2 border-[#5946E3]">
        <p className="text-xs font-extrabold uppercase text-[#38BDF8] mb-1">🔮 Tomorrow's Episode</p>
        <p className="font-bold text-white text-base sm:text-lg">“{nextEpisode(sessions)}”</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-black">
        <span className="px-4 py-2 rounded-xl bg-[#2A1F8A] border border-[#5946E3] text-[#FFD13B]">⭐ Agent Level {profile.rank + 1}</span>
        <span className="px-4 py-2 rounded-xl bg-[#2A1F8A] border border-[#5946E3] text-[#FF7849]">🔥 {profile.streak}-Day Streak</span>
      </div>
      <p className="text-xs text-indigo-200">{rankName(profile.rank)} · +{points} XP · {profile.xp} total XP</p>

      <button type="button" onClick={onReplay} className="w-full py-4 rounded-2xl btn-game btn-lime text-white font-display font-bold text-xl cursor-pointer">PLAY NEXT ADVENTURE 🚀</button>
      <button type="button" onClick={onHome} className="px-5 py-2.5 rounded-2xl bg-[#2A1F8A] hover:bg-[#3A2BB5] border-2 border-[#8B5CF6] text-white font-display font-bold text-base">More games</button>
    </div>
    {children && <div className="w-full text-left">{children}</div>}
    <PrototypeParticles icon="🌟" count={16} />
    {garage && <Garage name={name} sessions={sessions} onClose={() => setGarage(false)} />}
  </main>;
}
