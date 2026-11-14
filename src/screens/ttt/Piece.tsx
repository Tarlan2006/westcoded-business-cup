export function Piece({ kind }: { kind: "star" | "cloud" }) {
  return (
    <svg className="ttt-piece" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {kind === "star" ? <>
        <path className="ttt-star" d="M44 17q6-12 12 0l9 18 20 3q14 2 4 12L74 64l3 20q2 14-10 7l-17-9-17 9q-12 7-10-7l3-20-15-14q-10-10 4-12l20-3z" />
        <path className="ttt-star-shine" d="M48 20l-9 19-19 3" />
        <g className="ttt-star-face">
          <path d="M35 51q4-6 8 0m14 0q4-6 8 0m-22 9q7 10 14 0" />
          <ellipse className="ttt-cheek" cx="32" cy="60" rx="4" ry="2.5" />
          <ellipse className="ttt-cheek" cx="68" cy="60" rx="4" ry="2.5" />
        </g>
      </> : <>
        <path className="ttt-cloud" d="M24 77c-10 0-18-8-18-17 0-10 8-18 18-18 2-14 13-24 26-24 11 0 21 6 26 16 10 0 18 8 18 18 0 14-10 25-23 25Z" />
        <path className="ttt-cloud-shine" d="M21 50c6-1 10-5 11-10 3-8 10-14 18-14" />
        <g className="ttt-cloud-face">
          <g className="ttt-cloud-eyes"><circle cx="39" cy="51" r="3.1" /><circle cx="64" cy="51" r="3.1" /></g>
          <path d="M45 60q7 9 14 0" />
          <ellipse className="ttt-cheek" cx="31" cy="60" rx="4" ry="2.5" />
          <ellipse className="ttt-cheek" cx="72" cy="60" rx="4" ry="2.5" />
        </g>
      </>}
    </svg>
  );
}
