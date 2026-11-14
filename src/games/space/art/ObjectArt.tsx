import { useId, type ReactNode } from "react";

const ink = "var(--sp-ink, #24204b)";
const sky = "var(--sp-art-blue, #7dc4ff)";
const ocean = "var(--sp-art-ocean, #4a83dc)";
const mint = "var(--sp-art-green, #7ae0b0)";
const sun = "var(--sp-art-gold, #ffc76a)";
const peach = "var(--sp-art-peach, #ff9b88)";
const red = "var(--sp-art-red, #ce5957)";
const lilac = "var(--sp-art-lilac, #afa6ed)";
const pale = "var(--sp-art-white, #fff8ed)";
const violet = "var(--sp-art-violet, #6353ba)";

function Face({ x = 50, y = 55 }: { x?: number; y?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <circle cx="-5.5" r="1.65" fill={ink} /><circle cx="5.5" r="1.65" fill={ink} />
    <path d="M-3.5 5q3.5 4.5 7 0" fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="-9" cy="4" rx="2.8" ry="1.5" fill={peach} />
    <ellipse cx="9" cy="4" rx="2.8" ry="1.5" fill={peach} />
  </g>;
}

const shapes: Record<string, ReactNode> = {
  child: <>
    <path d="M29 48q-9 12 0 20m41-19 10-15" fill="none" stroke={peach} strokeWidth="8" strokeLinecap="round" />
    <path d="M32 53q1-11 17-11t18 11l-2 23H34z" fill={violet} />
    <path d="M37 72h11v19H35zm16 0h11l2 19H54z" fill={ocean} />
    <path d="M37 88l-10 6q-2 5 5 5h16V89m14-1 10 6q2 5-5 5H52V89" fill={sun} />
    <circle cx="50" cy="25" r="22" fill={peach} />
    <path d="M28 26C25 10 36 1 49 1c13 0 24 8 23 21-8-1-15-6-21-12-6 9-15 13-23 16Z" fill={ink} />
    <path d="M44 54l5 2 5-2-1 6-4 4-4-4z" fill={sun} />
    <Face x={50} y={26} />
  </>,
  whale: <>
    <path d="M22 50C13 36 4 38 0 44c4 10 11 15 20 14M24 50c-7-17-3-23 6-24 3 8 3 16-1 24" fill={ocean} />
    <path d="M15 55c19 0 25-21 53-22 20-1 32 7 32 20 0 17-16 24-35 23-26-2-43-11-50-21Z" fill={ocean} />
    <path d="M47 65c16 0 34-1 50-6-8 16-28 21-50 8Z" fill={sky} />
    <path d="M53 63c-7 7-2 13 1 18 9-4 13-10 13-17Z" fill={violet} />
    <path d="M74 30c-5-6-9-9-15-10m16 9c0-7 1-11 5-16m0 17c3-5 6-6 11-5" stroke={sky} strokeWidth="3.2" strokeLinecap="round" fill="none" />
    <Face x={81} y={49} />
  </>,
  mountain: <>
    <path d="M0 91 22 59l9 8L54 4l24 46 8-7 14 48Z" fill={lilac} />
    <path d="M54 4l6 44-10 12 14 31H0l22-32 9 8Z" fill={violet} />
    <path d="M33 61 54 4l24 46-10-1-6 6-8-15-10 18-3-5Z" fill={pale} />
    <path d="m71 63 15-20 9 31-9-8-5 5Z" fill={pale} />
    <path d="M5 90h90" stroke={sky} strokeWidth="3" strokeLinecap="round" />
  </>,
  moon: <>
    <circle cx="50" cy="50" r="49" fill={lilac} />
    <path d="M10 62c5 16 22 28 41 29 17 1 35-9 44-25-6 21-25 33-45 33C28 99 12 83 10 62Z" fill={violet} opacity=".5" />
    <g fill={violet} opacity=".34"><circle cx="30" cy="33" r="10" /><circle cx="72" cy="29" r="7" /><circle cx="24" cy="67" r="6" /><circle cx="66" cy="77" r="9" /></g>
    <path d="M23 22q8-9 19-10" stroke={pale} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".65" />
    <Face />
  </>,
  earth: <>
    <circle cx="50" cy="50" r="49" fill={sky} />
    <path d="M8 64a49 49 0 0 0 84 7c-21 17-52 17-84-7Z" fill={ocean} opacity=".65" />
    <path d="M11 31c6-13 23-24 36-24l8 12-10 7-5 13-12-2-5 12-10-4Zm19 22 16 3 5 8-6 12-7 6-5-15ZM67 18l13-1c6 5 11 12 14 20l-6 9-10-7-7 3-8-10ZM68 67l13-6 9 7-4 9-17 4-6-7Z" fill={mint} />
    <path d="M26 23q11-10 24-10" fill="none" stroke={pale} strokeWidth="3" strokeLinecap="round" opacity=".8" />
    <Face x={56} y={49} />
  </>,
  jupiter: <>
    <circle cx="50" cy="50" r="49" fill={sun} />
    <path d="M5 33q44 21 90 0l3 14Q49 69 2 47Zm5 45q42 13 81 0-11 20-41 21-25-1-40-21Zm13-71q30 9 54 1C61-3 40-2 23 7Z" fill={peach} />
    <path d="M10 24q38 15 79-1m-87 37q46 16 95 0" fill="none" stroke={pale} strokeWidth="5" opacity=".8" />
    <ellipse cx="71" cy="70" rx="13" ry="7" fill={red} /><ellipse cx="71" cy="69" rx="8" ry="3" fill={peach} />
    <Face x={43} y={45} />
  </>,
  sun: <>
    <circle cx="50" cy="50" r="49" fill={sun} />
    <circle cx="50" cy="50" r="41" fill={peach} />
    <circle cx="50" cy="50" r="34" fill={sun} />
    <path d="M24 38q8-17 25-18m6 56q12-2 20-13" fill="none" stroke={pale} strokeWidth="3" strokeLinecap="round" opacity=".8" />
    <Face x={50} y={49} />
  </>,
  star: <>
    <circle cx="50" cy="50" r="49" fill={red} />
    <path d="M7 37c11-25 27-32 48-29 18 2 32 14 38 29-18-17-34-19-45-10C36 38 20 38 7 37Zm3 29c14 4 24 13 37 15 19 3 33-7 46-17-6 15-16 28-35 32C32 99 16 86 10 66Z" fill={peach} />
    <g fill={sun} opacity=".72"><circle cx="21" cy="44" r="3" /><circle cx="66" cy="30" r="5" /><circle cx="81" cy="57" r="4" /><circle cx="37" cy="72" r="3" /></g>
    <circle cx="50" cy="49" r="17" fill={peach} opacity=".9" />
    <Face x={50} y={48} />
  </>,
};

export function ObjectArt({ art }: { art: string }) {
  return <svg className="sp-object-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    {shapes[art] ?? <circle cx="50" cy="50" r="48" fill={lilac} />}
  </svg>;
}

export function RocketArt() {
  const gradient = useId();
  return <svg viewBox="0 0 164 152" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={gradient} x2="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor={sun} /><stop offset="1" stopColor={peach} />
      </linearGradient>
    </defs>
    <ellipse cx="80" cy="143" rx="43" ry="6" fill={lilac} opacity=".55" />
    <path d="M72 104c-5 13 5 23 10 33 5-10 16-20 10-33Z" fill={`url(#${gradient})`} />
    <path d="M63 71c-14 5-22 25-24 36 11-6 21-6 29-4m33-32c14 5 22 25 24 36-11-6-21-6-29-4" fill={lilac} stroke={violet} strokeWidth="3" strokeLinejoin="round" />
    <path d="M82 9C59 27 50 63 65 103h34c15-40 6-76-17-94Z" fill={pale} stroke={violet} strokeWidth="3" />
    <path d="M66 34c4-12 11-19 16-24 6 5 13 12 17 24-10 4-23 4-33 0Z" fill={peach} />
    <circle cx="82" cy="63" r="17" fill={sky} stroke={violet} strokeWidth="3" />
    <Face x={82} y={61} />
    <path d="M20 58q12 0 12-12 0 12 12 12-12 0-12 12 0-12-12-12Zm102-22q9 0 9-9 0 9 9 9-9 0-9 9 0-9-9-9Z" fill={sun} />
    <g fill={lilac}><circle cx="29" cy="89" r="4" /><circle cx="143" cy="70" r="4" /><circle cx="47" cy="28" r="3" /></g>
  </svg>;
}
