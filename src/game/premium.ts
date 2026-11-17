// AIdos Plus: the games behind a lock and the subscription plans they lead to.
// Prices and features live here so they are easy to change in one place.
// There is no checkout yet; choosing a plan only tells the grown-up it is coming.

export const lockedGames = [
  { id: "dino-dig", icon: "🦕", title: "Dino Dig", description: "Dig up fossils and build your own dinosaur." },
  { id: "music-band", icon: "🥁", title: "Music Band", description: "Make songs with drums, bells, and your voice." },
  { id: "story-quest", icon: "📖", title: "Story Quest", description: "Choose what happens next in a spoken adventure." },
] as const;

import { APP_NAME } from '../brand';
const plusFeatures = [
  "Unlock Dino Dig, Music Band, and Story Quest",
  "New missions and quizzes every week",
  `Unlimited Ask ${APP_NAME} questions`,
  "Up to 4 child profiles",
  "Weekly progress note for grown-ups",
  "Cancel anytime",
] as const;

export const plans = [
  { id: "monthly", name: "Monthly", price: "$18", period: "per month", note: "Billed every month", features: plusFeatures },
  {
    id: "yearly", name: "Yearly", price: "$144", period: "per year", note: "Just $12 a month · save 33%", badge: "Best value",
    features: ["Everything in Monthly", "2 extra mission packs a year", "Early access to new games"],
  },
] as const;

export type PlanId = (typeof plans)[number]["id"];
