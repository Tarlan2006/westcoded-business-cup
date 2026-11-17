export const ambienceThemes = {
  calm: { notes: [130.81, 164.81, 196, 164.81], beat: 3, marks: ['◌', '✧', '○', '✦'] },
  cosmic: { notes: [110, 164.81, 220, 146.83], beat: 3.5, marks: ['✦', '◎', '✧', '☾'] },
  patterns: { notes: [196, 246.94, 293.66, 246.94], beat: 2.5, marks: ['◇', '○', '△', '□'] },
  studio: { notes: [174.61, 220, 261.63, 220], beat: 3, marks: ['✎', '◌', '〰', '✧'] },
  playful: { notes: [261.63, 329.63, 392, 329.63], beat: 2, marks: ['○', '◠', '◯', '✦'] },
  curious: { notes: [146.83, 196, 246.94, 196], beat: 2.75, marks: ['?', '✧', '◇', '○'] },
  nature: { notes: [130.81, 196, 164.81, 146.83], beat: 3, marks: ['♧', '⌁', '◌', '✧'] },
  adventure: { notes: [146.83, 220, 174.61, 196], beat: 2.5, marks: ['△', '⌁', '◇', '✦'] },
  journey: { notes: [164.81, 220, 196, 246.94], beat: 3, marks: ['⌁', '○', '△', '✧'] },
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
