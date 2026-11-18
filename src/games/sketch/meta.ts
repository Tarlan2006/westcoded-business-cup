import { t, subscribe } from "../../i18n/index";
/** Lightweight catalog data; importing it does not load the game or its CSS. */
function makeSketchGameMeta() { return {
  id: "sketch", title: t("sketchGame.sketchArtist"), description: t("meta.listenThenDrawTheHero"),
  icon: "✏️", ageBands: ["6-8"], activity: "sketch",
} as const; }
export let sketchGameMeta = makeSketchGameMeta();
subscribe(() => { sketchGameMeta = makeSketchGameMeta(); });
