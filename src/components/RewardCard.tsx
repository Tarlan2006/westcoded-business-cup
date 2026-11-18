import { t } from "../i18n/index";
import { useEffect, type ReactNode } from "react";
import { useBriefing } from "../game/useBriefing";
import { outroLine, codenameFor } from "../game/content";
import { useSoundEnabled, uiSound } from "../audio/sfx";
import { nextEpisode, partForSession } from "../state/garage";
import { rankName, type ChildProfile } from "../state/progress";
import { Mascot } from "./Mascot";
import { ParticlePop } from "./GameUI";

export function RewardCard({ profile, points, mission, children }: {
  profile: ChildProfile; points: number; mission?: boolean; children?: ReactNode;
}) {
  const sound = useSoundEnabled();
  const sessions = profile.garageSessions ?? 0;
  const part = partForSession(sessions);
  const name = profile.preferences?.nickname ?? codenameFor(profile.codenameId);
  const Heading = mission ? "h1" : "h2";
  useBriefing([outroLine], !sound);
  useEffect(() => { uiSound("win", sound); }, [sound]);

  return <section className="panel recon-reward" aria-label={mission ? t("rewardCard.missionComplete") : t("rewardCard.activityReward")}>
    <ParticlePop />
    <div className="reward-mascot"><Mascot pose="jump" /></div>
    <div className="reward-main">
      <p className="reward-ribbon">{mission ? t("rewardCard.youDidIt") : t("rewardCard.allDone")}</p>
      <Heading>{t("rewardCard.wayToGoAgent", { name })}</Heading>
      <p className="flow-earned">+{points} XP</p>
      <p className="flow-progress-note">{t("rewardCard.totalXpDayStreak", { value1: rankName(profile.rank), value2: profile.xp, value3: profile.streak })}</p>
      {children}
    </div>
    {part && <div className="reward-loot">
      <span aria-hidden="true">{part.icon}</span><div><p className="field-label">{t("rewardCard.newShipPart")}</p><strong>{part.name}</strong></div>
    </div>}
    <div className="reward-teaser"><h3>{t("rewardCard.tomorrowSEpisode")}</h3><p>{nextEpisode(sessions)}</p></div>
  </section>;
}
