import type { ReactNode } from "react";

export const memoryIcons = {
  sat: "Saturn",
  rocket: "Rocket",
  star: "Star",
  ufo: "UFO",
  moon: "Moon",
  astro: "Astronaut",
  comet: "Comet",
  alien: "Alien",
} as const;

export type MemoryIconName = keyof typeof memoryIcons;

const artwork: Record<MemoryIconName, ReactNode> = {
  sat: <>
    <path d="M6 40Q4 28 32 22" fill="none" stroke="#1E1B4B" strokeWidth="11" strokeLinecap="round" opacity="0" />
    <path d="M5 38Q10 24 32 24" fill="none" stroke="#1E1B4B" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M5 38Q10 24 32 24" fill="none" stroke="#8B7CFF" strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="32" r="19" fill="#FFB347" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M14 27Q32 33 50 27M15 40Q32 46 49 40" stroke="#FF8A3D" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".6" />
    <ellipse cx="23" cy="21" rx="5" ry="3" fill="#fff" opacity=".55" transform="rotate(-30 23 21)" />
    <ellipse cx="25" cy="32" rx="2.9" ry="3.5" fill="#1E1B4B" />
    <ellipse cx="39" cy="32" rx="2.9" ry="3.5" fill="#1E1B4B" />
    <circle cx="26" cy="30.8" r="1.1" fill="#fff" />
    <circle cx="40" cy="30.8" r="1.1" fill="#fff" />
    <ellipse cx="21" cy="37" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <ellipse cx="43" cy="37" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <path d="M27 37Q32 43 37 37Z" fill="#7F1D3A" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
    <path d="M59 38Q54 52 32 52" fill="none" stroke="#1E1B4B" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M59 38Q54 52 32 52" fill="none" stroke="#8B7CFF" strokeWidth="4" strokeLinecap="round" />
  </>,
  rocket: <>
    <path d="M16 38L5 52l14-2zM48 38l11 14-14-2z" fill="#FF6B4A" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M25 48h14l-7 13z" fill="#FFD13B" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M32 4Q52 18 48 46H16Q12 18 32 4z" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M32 4Q44 12 46 28" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
    <path d="M32 4Q26 8 24 14Q32 10 40 14Q38 8 32 4z" fill="#FF6B4A" stroke="#1E1B4B" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    <circle cx="32" cy="26" r="9" fill="#38BDF8" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <circle cx="29" cy="23" r="2.6" fill="#fff" opacity=".85" />
    <ellipse cx="27" cy="40" rx="2.9" ry="2.6" fill="#1E1B4B" />
    <ellipse cx="37" cy="40" rx="2.9" ry="2.6" fill="#1E1B4B" />
    <circle cx="28" cy="38.8" r="1.1" fill="#fff" />
    <circle cx="38" cy="38.8" r="1.1" fill="#fff" />
    <ellipse cx="23" cy="45" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <ellipse cx="41" cy="45" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <path d="M28.5 45Q32 51 35.5 45Z" fill="#7F1D3A" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
  </>,
  star: <>
    <path d="M32 4l8.6 17.6 19.4 2.8-14 13.7 3.3 19.3L32 48.3 14.7 57.4 18 38.1 4 24.4l19.4-2.8z" fill="#FFD13B" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M32 10l5 11" stroke="#FFF3A8" strokeWidth="4" strokeLinecap="round" fill="none" />
    <ellipse cx="25" cy="31" rx="2.9" ry="3.5" fill="#1E1B4B" />
    <ellipse cx="39" cy="31" rx="2.9" ry="3.5" fill="#1E1B4B" />
    <circle cx="26" cy="29.8" r="1.1" fill="#fff" />
    <circle cx="40" cy="29.8" r="1.1" fill="#fff" />
    <ellipse cx="21" cy="36" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <ellipse cx="43" cy="36" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <path d="M27 36Q32 42 37 36Z" fill="#7F1D3A" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
  </>,
  ufo: <>
    <path d="M20 30Q20 8 32 8t12 22z" fill="#A5F3FC" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <ellipse cx="32" cy="22" rx="6" ry="8" fill="#2CE69B" stroke="#1E1B4B" strokeWidth="2.5" />
    <circle cx="30" cy="21" r="1.6" fill="#1E1B4B" />
    <circle cx="35" cy="21" r="1.6" fill="#1E1B4B" />
    <ellipse cx="32" cy="35" rx="28" ry="11" fill="#8B7CFF" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <ellipse cx="32" cy="32" rx="20" ry="4" fill="#B6A9FF" opacity=".6" />
    <circle cx="14" cy="37" r="3.2" fill="#FFD13B" stroke="#1E1B4B" strokeWidth="2" />
    <circle cx="32" cy="41" r="3.2" fill="#FFD13B" stroke="#1E1B4B" strokeWidth="2" />
    <circle cx="50" cy="37" r="3.2" fill="#FFD13B" stroke="#1E1B4B" strokeWidth="2" />
    <path d="M22 47l-5 12M42 47l5 12" stroke="#FFD13B" strokeWidth="4" strokeLinecap="round" opacity=".8" />
  </>,
  moon: <>
    <path d="M40 5A27 27 0 1 0 59 44 22 22 0 0 1 40 5z" fill="#FFD13B" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M26 14Q14 22 14 34" fill="none" stroke="#FFF3A8" strokeWidth="4" strokeLinecap="round" />
    <circle cx="22" cy="42" r="4" fill="#F5B800" stroke="#1E1B4B" strokeWidth="2" />
    <ellipse cx="20" cy="32" rx="2.9" ry="3.5" fill="#1E1B4B" />
    <ellipse cx="32" cy="32" rx="2.9" ry="3.5" fill="#1E1B4B" />
    <circle cx="21" cy="30.8" r="1.1" fill="#fff" />
    <circle cx="33" cy="30.8" r="1.1" fill="#fff" />
    <ellipse cx="16" cy="37" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <ellipse cx="36" cy="37" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <path d="M22 37Q26 43 30 37Z" fill="#7F1D3A" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
    <path d="M52 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#fff" stroke="#1E1B4B" strokeWidth="1.5" strokeLinejoin="round" />
  </>,
  astro: <>
    <circle cx="32" cy="32" r="26" fill="#F8FAFC" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <rect x="13" y="17" width="38" height="29" rx="14" fill="#2B2A7A" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M18 24Q24 20 34 21" stroke="#8FA8FF" strokeWidth="3" fill="none" strokeLinecap="round" />
    <ellipse cx="25" cy="33" rx="2.9" ry="3.5" fill="#fff" />
    <ellipse cx="39" cy="33" rx="2.9" ry="3.5" fill="#fff" />
    <circle cx="26" cy="31.8" r="1.1" fill="#fff" />
    <circle cx="40" cy="31.8" r="1.1" fill="#fff" />
    <ellipse cx="21" cy="38" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <ellipse cx="43" cy="38" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <path d="M27 38Q32 44 37 38Z" fill="#7F1D3A" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
    <rect x="26" y="52" width="12" height="7" rx="3" fill="#FF6B4A" stroke="#1E1B4B" strokeWidth="2.5" />
    <circle cx="55" cy="22" r="4" fill="#FF6B4A" stroke="#1E1B4B" strokeWidth="2.5" />
  </>,
  comet: <>
    <path d="M4 58Q18 34 38 26" stroke="#FF6B4A" strokeWidth="13" fill="none" strokeLinecap="round" opacity=".6" />
    <path d="M10 60Q26 42 42 32" stroke="#FFD13B" strokeWidth="7" fill="none" strokeLinecap="round" />
    <circle cx="43" cy="24" r="17" fill="#FF8A3D" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <ellipse cx="36" cy="17" rx="5" ry="3" fill="#fff" opacity=".5" transform="rotate(-30 36 17)" />
    <ellipse cx="37" cy="24" rx="2.9" ry="3.5" fill="#1E1B4B" />
    <ellipse cx="49" cy="24" rx="2.9" ry="3.5" fill="#1E1B4B" />
    <circle cx="38" cy="22.8" r="1.1" fill="#fff" />
    <circle cx="50" cy="22.8" r="1.1" fill="#fff" />
    <ellipse cx="33" cy="29" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <ellipse cx="53" cy="29" rx="3" ry="2" fill="#FF6B9A" opacity=".7" />
    <path d="M38.5 29Q43 35 47.5 29Z" fill="#7F1D3A" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
  </>,
  alien: <>
    <path d="M20 14L15 5M44 14l5-9" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="15" cy="5" r="3.6" fill="#FF6B9A" stroke="#1E1B4B" strokeWidth="2.5" />
    <circle cx="49" cy="5" r="3.6" fill="#FF6B9A" stroke="#1E1B4B" strokeWidth="2.5" />
    <path d="M6 36Q6 11 32 11t26 25q0 22-26 22T6 36z" fill="#2CE69B" stroke="#1E1B4B" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
    <ellipse cx="20" cy="34" rx="7" ry="9" fill="#1E1B4B" transform="rotate(-12 20 34)" />
    <ellipse cx="44" cy="34" rx="7" ry="9" fill="#1E1B4B" transform="rotate(12 44 34)" />
    <circle cx="22" cy="31" r="2.6" fill="#fff" />
    <circle cx="46" cy="31" r="2.6" fill="#fff" />
    <path d="M26 48Q32 54 38 48Z" fill="#7F1D3A" stroke="#1E1B4B" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M16 18Q22 13 30 13" stroke="#9FF5CF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
  </>,
};

export function MemoryIcon({ name }: { name: MemoryIconName }) {
  return <svg className="memory-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    {artwork[name]}
  </svg>;
}

export function MemoryCardBack() {
  return <svg className="memory-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <path d="M32 8 Q37 27 56 32 Q37 37 32 56 Q27 37 8 32 Q27 27 32 8Z" fill="#FFD13B" />
    <path d="M32 13 Q30 26 17 31 Q29 29 32 22Z" fill="#FFF3A8" />
  </svg>;
}
