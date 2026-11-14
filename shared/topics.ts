// The child's interests (parent setup: childInterests in src/state/preferences.ts) as
// fixed topic ids. Only these ids ever reach the server, so no free text from the
// profile goes into an AI prompt. `label` must match a childInterests entry.
export const topics = [
  { id: "dinosaurs", label: "Dinosaurs", examples: ["How big was a T. rex?", "Why did dinosaurs disappear?"] },
  { id: "space", label: "Space", examples: ["Why is space black?", "Why does the Moon change shape?"] },
  { id: "animals", label: "Animals", examples: ["Why do cats purr?", "How do birds fly?"] },
  { id: "vehicles", label: "Vehicles", examples: ["How do cars move?", "Why do trucks have big wheels?"] },
  { id: "music", label: "Music", examples: ["How do we hear sounds?", "Why does a drum go boom?"] },
  { id: "art", label: "Art", examples: ["How are colors made?", "Why does mixing blue and yellow make green?"] },
  { id: "heroes", label: "Superheroes", examples: ["What makes a hero brave?", "Could a person really fly like a hero?"] },
] as const;

export type TopicId = (typeof topics)[number]["id"];
export const maxTopics = 3;

export function readTopics(value: unknown): TopicId[] {
  if (!Array.isArray(value)) return [];
  const known = new Set<string>(topics.map((topic) => topic.id));
  return [...new Set(value.filter((id): id is TopicId => typeof id === "string" && known.has(id)))].slice(0, maxTopics);
}

export function topicsFromInterests(interests: readonly string[] = []): TopicId[] {
  return readTopics(interests.map((label) => topics.find((topic) => topic.label === label)?.id));
}

export function interestsFromTopics(ids: readonly string[]): string[] {
  return readTopics(ids).map((id) => topics.find((topic) => topic.id === id)!.label);
}

export function topicLabels(ids: readonly TopicId[]): string[] {
  return ids.map((id) => topics.find((topic) => topic.id === id)!.label.toLowerCase());
}

export function suggestedQuestions(ids: readonly TopicId[], count = 3): string[] {
  const chosen = ids.length ? ids : (["space", "animals", "heroes"] as TopicId[]);
  const pool = chosen.flatMap((id) => topics.find((topic) => topic.id === id)!.examples);
  return pool.slice(0, count);
}
