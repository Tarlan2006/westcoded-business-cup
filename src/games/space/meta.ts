import { t, subscribe } from "../../i18n/index";
function makeSpaceGameMeta() { return {
  id: "space",
  title: t("spaceGame.spaceScale"),
  description: t("meta.howBigIsSpaceScrollAndSee"),
  icon: "🪐",
  ageBands: ["6-8"],
  activity: "space",
} as const; }
export let spaceGameMeta = makeSpaceGameMeta();
subscribe(() => { spaceGameMeta = makeSpaceGameMeta(); });
