export function Mascot({ mood = "idle" }: { mood?: "idle" | "happy" | "thinking" }) {
  return (
    <svg className="mascot" data-mood={mood} viewBox="0 0 220 166" aria-hidden="true" focusable="false">
      <ellipse cx="113" cy="152" rx="53" ry="8" fill="var(--primary-soft)" />
      <path d="M42 61a7 7 0 0 0 7-7 7 7 0 0 0 7 7 7 7 0 0 0-7 7 7 7 0 0 0-7-7M174 46a9 9 0 0 0 9-9 9 9 0 0 0 9 9 9 9 0 0 0-9 9 9 9 0 0 0-9-9" fill="var(--accent)" />
      <circle cx="33" cy="112" r="5" fill="var(--coral)" />
      <circle cx="191" cy="101" r="6" fill="var(--success)" />
      <g className="mascot-robot" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M110 42V26" fill="none" />
        <circle cx="110" cy="19" r="7" fill="var(--accent)" />
        <path d="M61 83V77a49 49 0 0 1 98 0v6" fill="none" />
        <rect x="58" y="60" width="104" height="79" rx="30" fill="var(--surface)" />
        <rect x="72" y="72" width="76" height="49" rx="20" fill="var(--primary-soft)" stroke="none" />
        <rect x="48" y="82" width="17" height="30" rx="8" fill="var(--accent)" />
        <rect x="155" y="82" width="17" height="30" rx="8" fill="var(--accent)" />
        {mood === "happy"
          ? <path d="M86 97q6-9 12 0m24 0q6-9 12 0m-34 8h20q-10 15-20 0Z" fill="var(--primary)" strokeWidth="3" />
          : <><circle cx="92" cy="94" r="3.5" fill="var(--primary)" /><circle cx="128" cy="94" r="3.5" fill="var(--primary)" />
            <path d={mood === "thinking" ? "M107 107h8" : "M102 105q8 9 16 0"} fill="none" strokeWidth="3.5" /></>}
        <path d="M161 110q-3 19-20 20h-10" fill="none" strokeWidth="3.5" />
      </g>
    </svg>
  );
}
