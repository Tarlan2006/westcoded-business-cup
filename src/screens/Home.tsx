import { useState, type ReactNode } from "react";
import type { Activity } from "../../shared/types";
import { useSoundEnabled } from "../audio/sfx";
import { ActivityHeader } from "../components/ActivityHeader";
import { availableActivities, orderedGroups, startingActivity, type ActivitySuggestion } from "../components/activitySuggestions";
import { Garage } from "../components/Garage";
import { ActivityIcon, HubTile, LockedTile } from "../components/GameUI";
import { lockedGames } from "../game/premium";
import { Mascot } from "../components/Mascot";
import { PrototypeHeader } from "../components/PrototypeHeader";
import { APP_NAME } from "../brand";
import { codenameFor } from "../game/content";
import type { ActivityGroup, Preferences } from "../state/preferences";
import { rankName, type ChildProfile } from "../state/progress";

export function LearnPage({ title, onBack, backHref, children, wide = false, xp }: {
  title: string; onBack?: () => void; backHref?: string; children: ReactNode; wide?: boolean; xp?: number;
}) {
  return <main className={wide ? "shell" : "shell learn-shell"}>
    <ActivityHeader title={title} onBack={onBack} backHref={backHref} xp={xp} />
    <section className="learn-page" aria-label={title}>
      <h1>{title}</h1>
      {children}
    </section>
  </main>;
}

const groups = { active: "Move", learn: "Learn", watch: "Watch" };
const tileTone: Partial<Record<Activity, "active" | "learn" | "watch" | "mint" | "sun">> = {
  hunt: "active", roadtrip: "sun", lava: "active", memory: "mint", "tic-tac-toe": "mint", sketch: "sun", video: "watch", balloons: "sun",
};

function groupOf(activity: Activity): ActivityGroup {
  if (activity === "video" || activity === "toddler") return "watch";
  if (activity === "hunt" || activity === "roadtrip" || activity === "lava") return "active";
  return "learn";
}

export function Hub({ profile, preferences, onToggleSound, onParent, onPrivacy, onActivity, onPlans }: {
  profile: ChildProfile; preferences: Preferences; onToggleSound: () => void; onParent: () => void; onPrivacy: () => void; onPlans: () => void;
  onActivity: (activity: Activity, topic?: string) => void;
}) {
  const [garage, setGarage] = useState(false);
  const sound = useSoundEnabled();
  const name = preferences.nickname ?? codenameFor(profile.codenameId);
  const options = availableActivities(profile, preferences);
  const ordered = orderedGroups(profile, preferences);
  const first = startingActivity(profile, preferences);
  const open = (activity: ActivitySuggestion) => onActivity(activity.activity, activity.topic);

  return <main className="prototype-screen prototype-hub relative w-full max-w-4xl mx-auto px-4 py-4 z-10" aria-label="Activities">
    <PrototypeHeader name={name} label={`${profile.xp} XP`} detail={`${rankName(profile.rank)} · ${profile.streak}-Day Streak`}
      onParents={onParent}>
      <button type="button" className="prototype-parent-button" aria-pressed={sound} onClick={onToggleSound}>Sound {sound ? "on" : "off"}</button>
      <button type="button" className="prototype-parent-button" onClick={() => setGarage(true)}>🛸 Garage</button>
    </PrototypeHeader>
    <div className="learn-page">
      <section className="hub-greeting" aria-label={`${APP_NAME} says hello`}>
        <Mascot pose="wave" size={72} />
        <p className="hub-greeting-bubble">Hi, {name}! What shall we do today?</p>
      </section>
      <section className="flow-start panel" aria-labelledby="flow-start-title">
        <div className="flow-start-icon flow-start-mascot" aria-hidden="true"><Mascot pose="tablet" size={72} /></div>
        <div><p className="field-label" id="flow-start-title">Start here</p><h1 className="font-display text-2xl sm:text-3xl font-bold">{first.title}</h1><p>{first.description}</p></div>
        <button type="button" className="btn-game btn-mint rounded-2xl min-h-12 px-5 py-3 font-display font-bold text-[#062C1E]" onClick={() => open(first)}>
          Start <span aria-hidden="true">→</span><span className="sr-only"> {first.title}</span>
        </button>
      </section>
      {ordered.map((group) => <section className="activity-section" key={group} aria-labelledby={`group-${group}`}>
        <h2 id={`group-${group}`} className="font-display text-2xl font-bold">{groups[group]}</h2>
        <div className="activity-grid" data-group={group}>
          {options.filter((item) => groupOf(item.activity) === group).map((item) => <HubTile key={item.activity}
            tone={tileTone[item.activity] ?? "learn"} icon={<ActivityIcon item={item} />} title={item.title} onClick={() => open(item)}>{item.description}</HubTile>)}
        </div>
      </section>)}
      <section className="activity-section" aria-labelledby="group-plus">
        <h2 id="group-plus" className="font-display text-2xl font-bold">Unlock more <span className="plus-badge">{APP_NAME.toUpperCase()} PLUS</span></h2>
        <div className="locked-hint">
          <Mascot pose="point" size={84} />
          <p className="hub-greeting-bubble">These games are still locked up. Ask a grown-up!</p>
        </div>
        <div className="activity-grid locked-grid">
          {lockedGames.map((game) => <LockedTile key={game.id} icon={game.icon} title={game.title} onClick={onPlans}>{game.description}</LockedTile>)}
        </div>
      </section>
      <a className="quiet-button" href="/privacy" onClick={(event) => { event.preventDefault(); onPrivacy(); }}>Privacy</a>
    </div>
    {garage && <Garage name={name} sessions={profile.garageSessions ?? 0} onClose={() => setGarage(false)} />}
  </main>;
}
