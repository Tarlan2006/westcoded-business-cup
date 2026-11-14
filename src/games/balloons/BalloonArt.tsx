import { palette } from "./model";

export function BalloonArt({ color }: { color: number }) {
  const [fill, shine] = palette[color];
  return <svg viewBox="0 0 60 90" aria-hidden="true" focusable="false">
    <path d="M30 60Q22 70 30 76T30 88" fill="none" stroke="#C7D2FE" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 55l-6 8h12z" fill={fill} stroke="#1E1B4B" strokeWidth="3" strokeLinejoin="round" />
    <ellipse cx="30" cy="29" rx="25" ry="29" fill={fill} stroke="#1E1B4B" strokeWidth="3.5" />
    <path d="M14 20Q16 10 26 7" fill="none" stroke={shine} strokeWidth="5" strokeLinecap="round" />
    <circle cx="16" cy="30" r="2" fill="#fff" opacity=".7" />
  </svg>;
}
