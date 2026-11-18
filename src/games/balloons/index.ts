import { t, subscribe } from "../../i18n/index";
export { default } from "./BalloonsGame";
export type { BalloonsGameProps } from "./BalloonsGame";
function makeBalloonsGameMeta() { return {
  id: "balloons", title: t("app.balloonCount"), blurb: t("activitySuggestions.countTheBalloonsBeforeTimeRunsOut"),
  ages: ["3-5", "6-8"], category: "learn",
} as const; }
export let balloonsGameMeta = makeBalloonsGameMeta();
subscribe(() => { balloonsGameMeta = makeBalloonsGameMeta(); });
