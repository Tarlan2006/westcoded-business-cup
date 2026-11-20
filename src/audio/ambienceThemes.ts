export const ambienceThemes = {
  calm: { marks: ['◌', '✧', '○', '✦'] },
  cosmic: { marks: ['✦', '◎', '✧', '☾'] },
  patterns: { marks: ['◇', '○', '△', '□'] },
  studio: { marks: ['✎', '◌', '〰', '✧'] },
  playful: { marks: ['○', '◠', '◯', '✦'] },
  curious: { marks: ['?', '✧', '◇', '○'] },
  nature: { marks: ['♧', '⌁', '◌', '✧'] },
  adventure: { marks: ['△', '⌁', '◇', '✦'] },
  journey: { marks: ['⌁', '○', '△', '✧'] },
} as const;
export type AmbienceTheme = keyof typeof ambienceThemes;

export function themeForActivity(activity: string): AmbienceTheme {
  switch (activity) {
    case 'space': return 'cosmic';
    case 'sketch': return 'studio';
    case 'memory': case 'tic-tac-toe': return 'patterns';
    case 'balloons': case 'toddler': case 'reward': case 'results': return 'playful';
    case 'ask': case 'quiz': return 'curious';
    case 'hunt': return 'nature';
    case 'lava': return 'adventure';
    case 'roadtrip': return 'journey';
    default: return 'calm';
  }
}
