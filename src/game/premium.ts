import { t, subscribe } from "../i18n/index";
// AIdos Plus: the games behind a lock and the subscription plans they lead to.
// Prices and features live here so they are easy to change in one place.
// There is no checkout yet; choosing a plan only tells the grown-up it is coming.

function makeLockedGames() { return [
  { id: "dino-dig", icon: "🦕", title: t("premium.dinoDig"), description: t("premium.digUpFossilsAndBuildYourOwn") },
  { id: "music-band", icon: "🥁", title: t("premium.musicBand"), description: t("premium.makeSongsWithDrumsBellsAndYour") },
  { id: "story-quest", icon: "📖", title: t("premium.storyQuest"), description: t("premium.chooseWhatHappensNextInASpoken") },
] as const; }
export let lockedGames = makeLockedGames();
subscribe(() => { lockedGames = makeLockedGames(); });

function makePlusFeatures() { return [
  t("premium.unlockDinoDigMusicBandAndStory"),
  t("premium.newMissionsAndQuizzesEveryWeek"),
  t("premium.unlimitedAskQuestions"),
  t("premium.upTo4ChildProfiles"),
  t("premium.weeklyProgressNoteForGrownUps"),
  t("premium.cancelAnytime"),
] as const; }
let plusFeatures = makePlusFeatures();
subscribe(() => { plusFeatures = makePlusFeatures(); });

function makePlans() { return [
  { id: "monthly", name: t("premium.monthly"), price: "$18", period: t("premium.perMonth"), note: t("premium.billedEveryMonth"), features: plusFeatures },
  {
    id: "yearly", name: t("premium.yearly"), price: "$144", period: t("premium.perYear"), note: t("premium.just12AMonthSave33"), badge: t("premium.bestValue"),
    features: [t("premium.everythingInMonthly"), t("premium.2ExtraMissionPacksAYear"), t("premium.earlyAccessToNewGames")],
  },
] as const; }
export let plans = makePlans();
subscribe(() => { plans = makePlans(); });

export type PlanId = (typeof plans)[number]["id"];
