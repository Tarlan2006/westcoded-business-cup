import type { Activity } from "../../shared/types";
import type { ActivitySuggestion } from "./activitySuggestions";

export function NextUp({ options, onReplay, onChoose, onHome }: {
  options: ActivitySuggestion[]; onReplay: () => void; onChoose: (activity: Activity) => void; onHome: () => void;
}) {
  return <section className="flow-next" aria-labelledby="flow-next-title">
    <div className="flow-next-heading"><div><p className="field-label">Keep the good moments going</p><h2 id="flow-next-title">Next up</h2></div>
      <button className="primary-button" type="button" onClick={onReplay}>↻ Play again</button></div>
    <h3 className="field-label">Try next</h3>
    <div className="flow-next-grid">{options.map((option) => <button className="activity-tile" type="button" key={option.activity} onClick={() => onChoose(option.activity)} data-tone={option.activity === "video" ? "watch" : "learn"}>
      <span className="activity-icon" aria-hidden="true">{option.icon}</span><strong>{option.title}</strong>
      <span className="tile-description">{option.description}</span><span className="tile-arrow" aria-hidden="true">→</span>
    </button>)}</div>
    <button className="flow-home-link" type="button" onClick={onHome}>Back to activities</button>
  </section>;
}
