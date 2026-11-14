// Steel chains and a padlock wrapped over anything that is not available yet
// (MyPal Plus games). Purely decorative: the button underneath carries the label.
const W = 360;
const H = 130;
const STEP = 13;

type Link = { key: number; transform: string; open: boolean };

function chain(x1: number, y1: number, x2: number, y2: number, seed: number): Link[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const count = Math.floor(Math.hypot(dx, dy) / STEP);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return Array.from({ length: count + 1 }, (_, i) => ({
    key: seed + i,
    transform: `translate(${(x1 + dx * i / count).toFixed(1)} ${(y1 + dy * i / count).toFixed(1)}) rotate(${angle.toFixed(1)})`,
    open: i % 2 === 0,
  }));
}

// Two chains crossing corner to corner; the shape is fixed, so it is computed once.
const links = [...chain(-10, 8, W + 10, H - 8, 0), ...chain(-10, H - 8, W + 10, 8, 1000)];

function ChainLink({ link }: { link: Link }) {
  return link.open
    ? <g transform={link.transform}>
      <rect x="-10" y="-6" width="20" height="12" rx="6" fill="none" stroke="#334155" strokeWidth="5" />
      <rect x="-10" y="-6" width="20" height="12" rx="6" fill="none" stroke="#CBD5E1" strokeWidth="2.5" />
    </g>
    : <g transform={link.transform}>
      <rect x="-9" y="-2.5" width="18" height="5" rx="2.5" fill="#94A3B8" stroke="#334155" strokeWidth="1.5" />
    </g>;
}

export function Chains() {
  return <svg className="chains" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <rect width={W} height={H} fill="#0B0730" opacity=".18" />
    {links.map((link) => <ChainLink key={link.key} link={link} />)}
    <g transform={`translate(${W / 2} ${H / 2})`}><g className="chains-padlock">
      <path d="M-13 -6V-16a13 13 0 0 1 26 0v10" fill="none" stroke="#334155" strokeWidth="9" strokeLinecap="round" />
      <path d="M-13 -6V-16a13 13 0 0 1 26 0v10" fill="none" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" />
      <rect x="-22" y="-8" width="44" height="36" rx="9" fill="#FFD13B" stroke="#1E1B4B" strokeWidth="3" />
      <circle cx="0" cy="6" r="5" fill="#1E1B4B" />
      <rect x="-2" y="8" width="4" height="10" rx="2" fill="#1E1B4B" />
    </g></g>
  </svg>;
}
