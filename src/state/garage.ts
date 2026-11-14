export const shipParts = [
  { id: "thruster", name: "Moon Thruster", icon: "🚀" },
  { id: "dish", name: "Star Signal Dish", icon: "📡" },
  { id: "window", name: "Starlight Window", icon: "🪟" },
  { id: "shield", name: "Comet Shield", icon: "🛡️" },
  { id: "battery", name: "Meteor Battery", icon: "🔋" },
] as const;

const teasers = [
  "Bleep found a mystery signal. What could be sending it?",
  "A tiny clue might lead to a giant discovery.",
  "Bleep is plotting a new route through the stars.",
];

export const partForSession = (sessions: number) => sessions > 0 ? shipParts[(sessions - 1) % shipParts.length] : undefined;
export const nextEpisode = (sessions: number) => teasers[Math.max(0, sessions - 1) % teasers.length];
export const inventory = (sessions: number) => shipParts.map((part, index) => ({
  ...part, count: Math.floor((sessions + shipParts.length - 1 - index) / shipParts.length),
}));
