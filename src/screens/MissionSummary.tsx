import type { ReactNode } from "react";
import type { Profile } from "../../shared/types";
import type { Mission, Session } from "../game/mission";
import { MODES } from "../game/content";
import { rankName } from "../state/progress";
import { ActivityHeader } from "../components/ActivityHeader";
import { Mascot } from "../components/Mascot";

/** Presentation only: the existing Mission component still owns all rounds and scoring. */
export function MissionSummary({ state, profile, session, onBack, children }: {
  state: Mission; profile: Profile; session: Session; onBack: () => void; children: ReactNode;
}) {
  return <main className="shell learn-shell">
    <ActivityHeader title={MODES[session.mode].name} xp={profile.xp} onBack={onBack} />
    <section className="flow-summary panel" aria-labelledby="flow-result-title">
      <Mascot mood="happy" />
      <div><p className="field-label">{MODES[session.mode].name}</p><h1 id="flow-result-title">Mission complete.</h1>
        <p>You finished {state.done} {state.done === 1 ? "round" : "rounds"}. Ready for another adventure?</p>
        <p className="flow-earned">+{state.points} XP</p>
        <p className="flow-progress-note">{rankName(profile.rank)} · {profile.xp} total XP · {profile.streak} day streak</p>
        {session.mode === "roadtrip" && <p>Player 1: {state.players[0]} · Player 2: {state.players[1]}</p>}
      </div>
    </section>
    {children}
  </main>;
}
