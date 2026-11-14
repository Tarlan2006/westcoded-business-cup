import type { ReactNode } from "react";
import type { Mission, Session } from "../game/mission";
import { MODES } from "../game/content";
import type { ChildProfile } from "../state/progress";
import { ActivityHeader } from "../components/ActivityHeader";
import { RewardCard } from "../components/RewardCard";

/** Presentation only: the existing Mission component still owns all rounds and scoring. */
export function MissionSummary({ state, profile, session, onBack, children }: {
  state: Mission; profile: ChildProfile; session: Session; onBack: () => void; children: ReactNode;
}) {
  return <main className="shell learn-shell">
    <ActivityHeader title={MODES[session.mode].name} xp={profile.xp} onBack={onBack} />
    <RewardCard profile={profile} points={state.points} mission>
      <p>You finished {state.done} {state.done === 1 ? "round" : "rounds"}.</p>
      {session.mode === "roadtrip" && <p>Player 1: {state.players[0]} · Player 2: {state.players[1]}</p>}
    </RewardCard>
    {children}
  </main>;
}
