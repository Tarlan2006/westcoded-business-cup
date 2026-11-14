import type { CSSProperties } from "react";

const colors = ["var(--accent)", "var(--primary)", "var(--coral)", "var(--success)", "var(--sky-text)"];
const directions = [-30, 24, -18, 28, -24, 16];

export function Confetti() {
  return (
    <div className="ttt-confetti" aria-hidden="true">
      {Array.from({ length: 20 }, (_, index) => (
        <i key={index} style={{
          "--ttt-left": `${5 + (index * 29) % 91}%`,
          "--ttt-fall": `${1260 + (index % 5) * 77}ms`,
          "--ttt-delay": `${(index * 53) % 345}ms`,
          "--ttt-drift": `${directions[index % directions.length]}px`,
          "--ttt-color": colors[index % colors.length],
        } as CSSProperties} />
      ))}
    </div>
  );
}

export function TieHearts() {
  return (
    <svg className="ttt-hearts" viewBox="0 0 52 40" aria-hidden="true" focusable="false">
      <path d="M20 34C12 30 3 24 4 17c1-6 8-7 12-2 3-6 10-5 13 0 3 6-2 13-9 19Z" />
      <path d="M34 26c-5-5-9-11-7-17 2-5 8-5 11 0 4-4 9-2 10 2 2 6-5 11-14 15Z" />
    </svg>
  );
}
