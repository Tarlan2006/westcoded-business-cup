import { withSymbols } from "./InlineSymbol";
import { t } from "../i18n/index";
import type { Activity } from "../../shared/types";
import type { ActivitySuggestion } from "./activitySuggestions";
import { ActivityIcon, GameButton, HubTile } from "./GameUI";

export function NextUp({ options, onReplay, onChoose, onHome }: {
  options: ActivitySuggestion[]; onReplay: () => void; onChoose: (activity: Activity, topic?: string) => void; onHome: () => void;
}) {
  return <section className="flow-next" aria-labelledby="flow-next-title">
    <div className="flow-next-heading"><div><p className="field-label">{t("nextUp.keepTheGoodMomentsGoing")}</p><h2 id="flow-next-title">{t("nextUp.nextUp")}</h2></div>
      <GameButton onClick={onReplay}>{withSymbols(t("nextUp.playAgain"))}</GameButton></div>
    <h3 className="field-label">{t("nextUp.tryNext")}</h3>
    <div className="flow-next-grid">{options.map((option) => <HubTile key={option.activity} title={option.title}
      icon={<ActivityIcon item={option} />} tone={option.activity === "video" ? "watch" : "learn"} onClick={() => onChoose(option.activity, option.topic)}>
      {option.description}
    </HubTile>)}</div>
    <button className="flow-home-link" type="button" onClick={onHome}>{t("nextUp.backToActivities")}</button>
  </section>;
}
