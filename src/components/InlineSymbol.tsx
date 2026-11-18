// Text presentation of interface symbols must not depend on the OS symbol fonts.
// Keep emoji presentation (e.g. ▶️) in the native emoji font.
const paths: Record<string, string> = {
  "Ⅱ": "M8 5v14m8-14v14",
  "←": "M20 12H4m6-6-6 6 6 6",
  "→": "M4 12h16m-6-6 6 6-6 6",
  "↓": "M12 3v17m-6-6 6 6 6-6",
  "↻": "M19 8a8 8 0 1 0 1 7m-1-12v6h-6",
  "▶": "M7 4v16l13-8Z",
  "✓": "m4 12 5 5L20 6",
  "∞": "M12 12C7 2 0 8 3 14c3 6 7 1 9-2s6-9 9-3c3 7-4 12-9 3Z",
  "♪": "M14 16V4l5 3M14 16a3 2 0 1 1-6 0 3 2 0 0 1 6 0Z",
  "♫": "M9 17V6l11-3v12M9 17a3 2 0 1 1-6 0 3 2 0 0 1 6 0Zm11-2a3 2 0 1 1-6 0 3 2 0 0 1 6 0Z",
  "✦": "M12 2q2 8 10 10-8 2-10 10Q10 14 2 12q8-2 10-10Z",
  "✧": "M12 2q2 8 10 10-8 2-10 10Q10 14 2 12q8-2 10-10Z",
  "★": "m12 2 3 7 7 1-5.5 5 1.5 7-6-4-6 4 1.5-7L2 10l7-1Z",
  "♥": "M12 21C-5 10 4 0 12 7c8-7 17 3 0 14Z",
  "□": "M4 4h16v16H4Z",
  "△": "M12 3 22 20H2Z",
  "◇": "M12 2 22 12 12 22 2 12Z",
  "○": "M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z",
  "◯": "M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0Z",
  "◌": "M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z",
  "◎": "M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0Zm-5 0a4 4 0 1 1-8 0 4 4 0 1 1 8 0Z",
  "◠": "M3 15q9-15 18 0",
  "☾": "M17 3a9 9 0 1 0 3 15A10 10 0 0 1 17 3Z",
  "☁": "M7 19a5 5 0 0 1-1-10 6 6 0 0 1 12 1 4.5 4.5 0 0 1 0 9Z",
  "⌁": "m2 15 5-7 5 7 5-7 5 7",
  "〰": "M2 14q5-8 10-2t10-2",
  "✎": "m4 15 12-12 5 5L9 20l-6 1Zm10-10 5 5",
  "▥": "M3 4h18v16H3Zm5 1v14m4-14v14m4-14v14",
  "♧": "M10 14c-7 4-10-5-3-6-1-8 11-8 10 0 7 1 4 10-3 6l2 6H8Z",
  "✿": "M12 9C5-1 1 10 8 12c-10 3-2 12 3 4 3 10 12 3 6-2 10-1 5-12-1-7 1-8-8-7-4 2Z",
};
const filled = new Set(["▶", "✦", "★", "♥", "☁", "✿"]);

export function InlineSymbol({ mark }: { mark: string }) {
  if (!paths[mark]) return mark;
  return <svg role="img" aria-label={mark} focusable="false" viewBox="0 0 24 24"
    width="1em" height="1em" style={{display:"inline-block", verticalAlign:"-.12em"}}
    fill={filled.has(mark) ? "currentColor" : "none"} stroke="currentColor"
    strokeWidth={mark === "Ⅱ" ? 3.6 : 1.8} strokeLinecap="round" strokeLinejoin="round"
    strokeDasharray={mark === "◌" ? "1 4" : undefined}><path d={paths[mark]} /></svg>;
}

const symbolPattern = new RegExp("([" + Object.keys(paths).join("") + "])(?!\\uFE0F)", "gu");

export function withSymbols(text: string) {
  return text.split(symbolPattern).map((part, i) => paths[part] ? <InlineSymbol key={i} mark={part} /> : part);
}
