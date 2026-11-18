import { t, subscribe } from "../i18n/index";
function makeShipParts() { return [
  { id: "thruster", name: t("garage.moonThruster"), icon: "🚀" },
  { id: "dish", name: t("garage.starSignalDish"), icon: "📡" },
  { id: "window", name: t("garage.starlightWindow"), icon: "🪟" },
  { id: "shield", name: t("garage.cometShield"), icon: "🛡️" },
  { id: "battery", name: t("garage.meteorBattery"), icon: "🔋" },
] as const; }
export let shipParts = makeShipParts();
subscribe(() => { shipParts = makeShipParts(); });

function makeTeasers() { return [
  t("garage.foundAMysterySignalWhatCouldBe"),
  t("garage.aTinyClueMightLeadToA"),
  t("garage.isPlottingANewRouteThroughThe"),
]; }
let teasers = makeTeasers();
subscribe(() => { teasers = makeTeasers(); });

export const partForSession = (sessions: number) => sessions > 0 ? shipParts[(sessions - 1) % shipParts.length] : undefined;
export const nextEpisode = (sessions: number) => teasers[Math.max(0, sessions - 1) % teasers.length];
export const inventory = (sessions: number) => shipParts.map((part, index) => ({
  ...part, count: Math.floor((sessions + shipParts.length - 1 - index) / shipParts.length),
}));
