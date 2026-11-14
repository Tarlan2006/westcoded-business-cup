import type { ReactNode } from "react";

// Eight friendly dinosaur cards, drawn on a 64×64 grid with the site's thick dark
// outline so each pair is easy to tell apart at a glance.
export const memoryIcons = {
  trex: "T. rex",
  tri: "Triceratops",
  stego: "Stegosaurus",
  longneck: "Long-neck dinosaur",
  ptero: "Pterodactyl",
  egg: "Baby dino in an egg",
  ankylo: "Ankylosaurus",
  spino: "Spinosaurus",
} as const;

export type MemoryIconName = keyof typeof memoryIcons;

const line = { stroke: "#1E1B4B", strokeWidth: 3.5, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const thin = { stroke: "#1E1B4B", strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" } as const;

/** A side-view eye with a shine dot and a rosy cheek. */
function Eye({ x, y }: { x: number; y: number }) {
  return <>
    <ellipse cx={x} cy={y} rx="2.7" ry="3.3" fill="#1E1B4B" />
    <circle cx={x + 0.9} cy={y - 1.2} r="1.1" fill="#fff" />
  </>;
}

function Cheek({ x, y }: { x: number; y: number }) {
  return <ellipse cx={x} cy={y} rx="3" ry="2" fill="#FF6B9A" opacity=".7" />;
}

const artwork: Record<MemoryIconName, ReactNode> = {
  trex: <>
    <path d="M17 44Q7 46 3 57Q13 54 20 50z" fill="#4ADE80" {...line} />
    <rect x="21" y="49" width="7" height="10" rx="3" fill="#22C55E" {...thin} />
    <rect x="32" y="49" width="7" height="10" rx="3" fill="#22C55E" {...thin} />
    <ellipse cx="30" cy="41" rx="14" ry="12" fill="#4ADE80" {...line} />
    <path d="M24 39Q30 45 36 39" fill="none" stroke="#BBF7D0" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 36l6 2-1 4" fill="none" {...thin} />
    <path d="M25 13Q25 5 35 5h14q11 0 11 10v8q0 7-8 7H37q-9 0-11-7z" fill="#4ADE80" {...line} />
    <path d="M41 23h16" {...thin} />
    <path d="M44 23l2 3 2-3M50 23l2 3 2-3" fill="#fff" stroke="#1E1B4B" strokeWidth="1.5" strokeLinejoin="round" />
    <Eye x={37} y={14} />
    <Cheek x={33} y={21} />
    <circle cx="26" cy="33" r="2" fill="#22C55E" /><circle cx="20" cy="40" r="1.6" fill="#22C55E" />
  </>,
  tri: <>
    <path d="M10 42Q3 42 2 48Q8 47 12 47z" fill="#FF8A3D" {...thin} />
    <rect x="12" y="46" width="6" height="11" rx="3" fill="#EA6A1F" {...thin} />
    <rect x="30" y="46" width="6" height="11" rx="3" fill="#EA6A1F" {...thin} />
    <ellipse cx="25" cy="40" rx="16" ry="11" fill="#FF8A3D" {...line} />
    <circle cx="43" cy="29" r="15" fill="#FFD13B" {...line} />
    <path d="M33 22l-2-3M37 17l-1-3M43 15v-3M49 17l1-3M53 22l2-3" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M42 26L36 9l10 15z" fill="#F8FAFC" {...thin} />
    <path d="M52 27l6-15 1 16z" fill="#F8FAFC" {...thin} />
    <ellipse cx="48" cy="38" rx="12" ry="10" fill="#FF8A3D" {...line} />
    <path d="M58 35l5-5-1 8z" fill="#F8FAFC" {...thin} />
    <Eye x={47} y={35} />
    <Cheek x={51} y={42} />
    <path d="M53 44q3 2 6 0" fill="none" {...thin} />
  </>,
  stego: <>
    <path d="M14 27l2-12 7 10zM24 23l4-13 6 13zM35 23l5-11 4 13zM45 27l6-8 2 11z" fill="#FFD13B" {...thin} />
    <path d="M10 46Q3 44 2 38l4 2 1-5 4 6" fill="#8B7CFF" {...thin} />
    <rect x="15" y="44" width="7" height="13" rx="3" fill="#6D5DEB" {...thin} />
    <rect x="38" y="44" width="7" height="13" rx="3" fill="#6D5DEB" {...thin} />
    <path d="M8 46Q10 24 31 23q20 1 25 19 4 5 6 6-6 4-13 1H8z" fill="#8B7CFF" {...line} />
    <path d="M16 38Q30 30 44 38" fill="none" stroke="#B6A9FF" strokeWidth="4" strokeLinecap="round" />
    <Eye x={53} y={41} />
    <path d="M56 46q2 1 4-1" fill="none" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
  </>,
  longneck: <>
    <path d="M10 44Q2 46 2 55Q8 51 13 50z" fill="#38BDF8" {...thin} />
    <rect x="12" y="46" width="7" height="12" rx="3" fill="#0EA5E9" {...thin} />
    <rect x="29" y="46" width="7" height="12" rx="3" fill="#0EA5E9" {...thin} />
    <ellipse cx="24" cy="43" rx="16" ry="10" fill="#38BDF8" {...line} />
    <path d="M31 37Q41 31 41 14h9q1 22-12 31z" fill="#38BDF8" {...line} />
    <ellipse cx="49" cy="12" rx="11" ry="7" fill="#38BDF8" {...line} />
    <path d="M44 22q2 6 0 12" fill="none" stroke="#BAE6FD" strokeWidth="3" strokeLinecap="round" />
    <Eye x={50} y={10} />
    <Cheek x={53} y={15} />
    <path d="M55 15q2 1 3-1" fill="none" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
    <circle cx="18" cy="40" r="2" fill="#0EA5E9" /><circle cx="26" cy="37" r="1.6" fill="#0EA5E9" />
  </>,
  ptero: <>
    <path d="M30 30L3 16q6 13 4 23 12-7 23-3z" fill="#FF6B9A" {...line} />
    <path d="M34 30L61 16q-6 13-4 23-12-7-23-3z" fill="#FF6B9A" {...line} />
    <path d="M9 22q9 5 17 9M55 22q-9 5-17 9" stroke="#FFC2D6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <ellipse cx="32" cy="38" rx="7" ry="11" fill="#FF8FB1" {...line} />
    <path d="M28 49l-2 6M36 49l2 6" {...thin} />
    <path d="M27 14L17 6l13 4z" fill="#FFD13B" {...thin} />
    <circle cx="32" cy="18" r="8.5" fill="#FF8FB1" {...line} />
    <path d="M39 16l13 3-13 4z" fill="#FFD13B" {...thin} />
    <Eye x={33} y={16} />
    <Cheek x={29} y={22} />
  </>,
  egg: <>
    <circle cx="32" cy="24" r="14" fill="#4ADE80" {...line} />
    <path d="M22 13l4-7 6 5 6-5 4 7q-10-6-20 0z" fill="#FFF3D6" {...thin} />
    <Eye x={27} y={22} /><Eye x={37} y={22} />
    <Cheek x={23} y={28} /><Cheek x={41} y={28} />
    <path d="M29 28q3 4 6 0z" fill="#7F1D3A" stroke="#1E1B4B" strokeWidth="2" strokeLinejoin="round" />
    <path d="M10 35l6-6 6 6 6-6 4 4 4-4 6 6 6-6 6 6q0 25-22 25T10 35z" fill="#FFF3D6" {...line} />
    <circle cx="20" cy="45" r="3" fill="#A7F3D0" /><circle cx="42" cy="49" r="4" fill="#A7F3D0" /><circle cx="31" cy="54" r="2.2" fill="#A7F3D0" />
  </>,
  ankylo: <>
    <path d="M9 42Q4 40 5 34" fill="none" {...line} />
    <circle cx="6" cy="31" r="5" fill="#C2410C" {...thin} />
    <rect x="14" y="44" width="7" height="10" rx="3" fill="#D97706" {...thin} />
    <rect x="38" y="44" width="7" height="10" rx="3" fill="#D97706" {...thin} />
    <path d="M18 24l3-6 3 5M29 21l3-7 3 7M40 23l3-6 3 6" fill="#F8FAFC" {...thin} />
    <path d="M8 46Q9 22 31 21q21 1 23 24z" fill="#F5B800" {...line} />
    <circle cx="20" cy="33" r="3" fill="#D97706" /><circle cx="31" cy="29" r="3" fill="#D97706" />
    <circle cx="42" cy="33" r="3" fill="#D97706" /><circle cx="26" cy="39" r="2.4" fill="#D97706" /><circle cx="37" cy="39" r="2.4" fill="#D97706" />
    <ellipse cx="55" cy="44" rx="7" ry="6" fill="#F5B800" {...line} />
    <Eye x={56} y={42} />
    <path d="M56 48q2 1 4-1" fill="none" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
  </>,
  spino: <>
    <path d="M13 44Q4 46 2 56q8-4 13-6z" fill="#2DD4BF" {...thin} />
    <rect x="19" y="45" width="7" height="12" rx="3" fill="#14B8A6" {...thin} />
    <rect x="33" y="45" width="7" height="12" rx="3" fill="#14B8A6" {...thin} />
    <path d="M13 38Q15 8 31 6q16 2 18 30z" fill="#FF6B4A" {...line} />
    <path d="M20 33l1-17M26 31l1-21M33 31V8M40 32l1-19" stroke="#FFC4A8" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="30" cy="40" rx="17" ry="10" fill="#2DD4BF" {...line} />
    <path d="M42 36q6-8 15-5l5 5q-2 6-10 6-7 0-10-6z" fill="#2DD4BF" {...line} />
    <path d="M49 39h11" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
    <Eye x={50} y={33} />
    <Cheek x={47} y={39} />
    <path d="M22 40Q30 46 38 40" fill="none" stroke="#99F6E4" strokeWidth="4" strokeLinecap="round" />
  </>,
};

export function MemoryIcon({ name }: { name: MemoryIconName }) {
  return <svg className="memory-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    {artwork[name]}
  </svg>;
}

/** Card back: a fern leaf from the dinosaurs' world. */
export function MemoryCardBack() {
  return <svg className="memory-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <path d="M32 58V8" stroke="#2CE69B" strokeWidth="3" strokeLinecap="round" />
    <path d="M32 50Q20 48 14 40Q24 40 32 46M32 50Q44 48 50 40Q40 40 32 46M32 38Q22 36 17 29Q26 29 32 34M32 38Q42 36 47 29Q38 29 32 34M32 27Q24 25 21 19Q28 19 32 23M32 27Q40 25 43 19Q36 19 32 23M32 16Q28 13 28 8Q32 9 32 12Q32 9 36 8Q36 13 32 16"
      fill="#2CE69B" stroke="#9FF5CF" strokeWidth="1" strokeLinejoin="round" />
  </svg>;
}
