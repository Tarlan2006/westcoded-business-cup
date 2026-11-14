export { default } from "./BalloonsGame";
export type { BalloonsGameProps } from "./BalloonsGame";
export const balloonsGameMeta = {
  id: "balloons", title: "Balloon Count", blurb: "Count the balloons before time runs out!",
  ages: ["3-5", "6-8"], category: "learn",
} as const;
