import { useId } from "react";

const ink = "var(--sp-art-ink)";
const white = "var(--sp-ink)";
const blush = "var(--sp-art-peach)";
const gold = "var(--sp-accent)";
const blue = "var(--sp-art-blue)";
const mint = "var(--sp-art-green)";

function Face({ x = 50, y = 52, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="-25" cy="9" rx="6" ry="3" fill={blush} opacity=".85" />
    <ellipse cx="25" cy="9" rx="6" ry="3" fill={blush} opacity=".85" />
    <circle cx="-14" r="4.5" fill={ink} /><circle cx="14" r="4.5" fill={ink} />
    <circle cx="-12.5" cy="-1.5" r="1.35" fill={white} /><circle cx="15.5" cy="-1.5" r="1.35" fill={white} />
    <path d="M-10 10Q0 22 10 10" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
  </g>;
}

function Child() {
  return <>
    <path d="M38 48q-9 3-16 18m38-17 14 9" fill="none" stroke="#ffd9b0" strokeWidth="8" strokeLinecap="round" />
    <rect x="32" y="43" width="36" height="32" rx="9" fill="var(--sp-try)" />
    <rect x="34" y="71" width="13" height="24" rx="3" fill="var(--sp-art-violet)" />
    <rect x="53" y="71" width="13" height="24" rx="3" fill="var(--sp-art-violet)" />
    <path d="M34 91h13v9H27v-3zm19 0h13l7 6v3H53z" fill="#e8edff" />
    <circle cx="50" cy="23" r="20" fill="#ffd9b0" />
    <path d="M30 20C31 5 39 1 50 1c12 0 19 8 20 19-7-1-12-5-18-10-7 6-13 11-22 10Z" fill="#57405e" />
    <Face y={24} scale={.55} />
  </>;
}

function Whale() {
  return <>
    <path d="M24 31Q22 23 17 21m7 10q2-8 9-10" stroke="#9fd0ff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <ellipse cx="48" cy="64" rx="46" ry="35" fill="var(--sp-art-ocean)" />
    <path d="M88 59Q95 50 96 35q6 14 2 28 4 13-2 30-2-15-8-21Z" fill="var(--sp-art-ocean)" />
    <path d="M10 78q30 12 73-1c-10 14-22 22-36 22S20 94 10 78Z" fill="#dbeafe" />
    <path d="M53 76q3 13-9 15 2-8 2-13Z" fill="#3973d9" />
    <circle cx="25" cy="59" r="3.8" fill={ink} /><circle cx="26" cy="58" r="1.2" fill={white} />
    <path d="M13 69Q22 78 33 70" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="14" cy="64" rx="4" ry="2.6" fill={blush} />
  </>;
}

function Mountain() {
  return <>
    <path d="M0 100 23 68l8 7 20-54 25 55 8-11 16 35Z" fill="#8694e8" />
    <path d="M51 21l7 41-10 9 15 29H0l23-32 8 7Z" fill="var(--sp-art-violet)" />
    <path d="m35 64 16-43 21 44-9-2-7 6-6-13-8 11Z" fill="#ecf4ff" />
    <path d="M51 23V3" stroke="#c7d2fe" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M52 3h17l-4 5 4 5H52Z" fill={gold} />
    <Face x={53} y={79} scale={.46} />
  </>;
}

function Moon() {
  return <>
    <circle cx="50" cy="50" r="50" fill="var(--sp-art-lilac)" />
    <g fill="#a6aecb"><circle cx="28" cy="35" r="10" /><circle cx="67" cy="26" r="7" /><circle cx="22" cy="70" r="6" /><circle cx="72" cy="75" r="8" /></g>
    <Face y={52} scale={.72} />
  </>;
}

function Earth() {
  return <>
    <circle cx="50" cy="50" r="50" fill={blue} />
    <path d="M5 36c8-17 22-27 40-30l8 12-7 12-12-1-9 11-5 11-13-4Zm24 17 13 6 7 12-8 19-12-11-4-15Zm36-30 14-7 12 12 5 15-13 5-12-10ZM63 71l14-6 11 10-11 11-13-4Z" fill={mint} />
    <Face x={54} y={47} scale={.81} />
  </>;
}

function Jupiter() {
  const clip = useId();
  return <>
    <defs><clipPath id={clip}><circle cx="50" cy="50" r="50" /></clipPath></defs>
    <circle cx="50" cy="50" r="50" fill="#f3c08a" />
    <g clipPath={`url(#${clip})`}>
      <path d="M0 12h100v11H0zm0 53h100v12H0z" fill="#e39a63" />
      <path d="M0 30h100v7H0zm0 52h100v7H0z" fill="#fbd9ae" />
    </g>
    <ellipse cx="75" cy="72" rx="10.5" ry="6" fill="#d9694a" />
    <Face x={49} y={48} scale={.88} />
  </>;
}

function Sun() {
  return <>
    <circle cx="50" cy="50" r="50" fill={gold} />
    <circle cx="50" cy="50" r="41" fill="#ffb347" />
    <circle cx="50" cy="50" r="35" fill={gold} />
    <path d="M20 34q7-12 17-16m26 66q11-4 17-14" fill="none" stroke="#ffe9a6" strokeWidth="3.5" strokeLinecap="round" />
    <Face />
  </>;
}

function Betelgeuse() {
  const glow = useId();
  return <>
    <defs><radialGradient id={glow}>
      <stop offset=".65" stopColor="#ff7a59" stopOpacity=".5" />
      <stop offset="1" stopColor="#ff7a59" stopOpacity="0" />
    </radialGradient></defs>
    <circle cx="50" cy="50" r="63" fill={`url(#${glow})`} />
    <circle cx="50" cy="50" r="50" fill="var(--sp-art-red)" />
    <path d="M5 28C27 9 61 8 93 28 69 27 51 39 37 44 24 44 14 36 5 28ZM8 74c19 6 42 17 78 0-12 16-30 24-45 23C26 93 15 85 8 74Z" fill="#ff9a7a" />
    <g fill="#ffc15c"><circle cx="70" cy="24" r="5" /><circle cx="24" cy="76" r="4.5" /><circle cx="82" cy="67" r="6" /></g>
    <Face y={48} />
  </>;
}

const figures = {
  child: Child, whale: Whale, mountain: Mountain, moon: Moon,
  earth: Earth, jupiter: Jupiter, sun: Sun, star: Betelgeuse,
};

export function ObjectArt({ art }: { art: string }) {
  const Figure = figures[art as keyof typeof figures] ?? Moon;
  const viewBox = art === "whale" ? "0 19 100 81" : "0 0 100 100";
  return <svg className="sp-object-art" viewBox={viewBox} preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
    <Figure />
  </svg>;
}

export function RocketArt() {
  const gradient = useId();
  const lilac = "var(--sp-art-lilac)";
  const violet = "var(--sp-art-violet)";
  const pale = "var(--sp-art-white)";
  return <svg viewBox="0 0 164 152" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={gradient} x2="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor={gold} /><stop offset="1" stopColor={blush} />
      </linearGradient>
    </defs>
    <ellipse cx="80" cy="143" rx="43" ry="6" fill={lilac} opacity=".55" />
    <path d="M72 104c-5 13 5 23 10 33 5-10 16-20 10-33Z" fill={`url(#${gradient})`} />
    <path d="M63 71c-14 5-22 25-24 36 11-6 21-6 29-4m33-32c14 5 22 25 24 36-11-6-21-6-29-4" fill={lilac} stroke={violet} strokeWidth="3" strokeLinejoin="round" />
    <path d="M82 9C59 27 50 63 65 103h34c15-40 6-76-17-94Z" fill={pale} stroke={violet} strokeWidth="3" />
    <path d="M66 34c4-12 11-19 16-24 6 5 13 12 17 24-10 4-23 4-33 0Z" fill={blush} />
    <circle cx="82" cy="63" r="17" fill={blue} stroke={violet} strokeWidth="3" />
    <Face x={82} y={61} scale={.65} />
    <path d="M20 58q12 0 12-12 0 12 12 12-12 0-12 12 0-12-12-12Zm102-22q9 0 9-9 0 9 9 9-9 0-9 9 0-9-9-9Z" fill={gold} />
    <g fill={lilac}><circle cx="29" cy="89" r="4" /><circle cx="143" cy="70" r="4" /><circle cx="47" cy="28" r="3" /></g>
  </svg>;
}
