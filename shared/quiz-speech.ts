import type { Language } from "./language";

const aliases: Record<string, string[]> = {
  "мө ө": ["мө", "мөө", "мө мө", "му"],
  "қиқ қиқ": ["қиқ", "қақ қақ", "кря"],
  "мияу": ["мяу", "мияу мияу"],
  "көк": ["көгілдір"], "дөңгелек": ["шеңбер"],
  "тартылыс күші": ["тартылыс", "гравитация"],
  "үш": ["3"], "төрт": ["4"], "бес": ["5"], "екі": ["2"],
  "three": ["3"], "four": ["4"], "five": ["5"], "two": ["2"],
};
function clean(text: string) {
  return text.normalize("NFKC").toLowerCase().replace(/\d\uFE0F?\u20E3/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
export function matchQuizSpeech(raw: string, options: string[], lang: Language) {
  const form = (word: string) => lang === "kk" && word.length >= 5
    ? word.replace(/(?:ымен|імен|мен|бен|пен|ның|нің|дың|дің|тың|тің|ға|ге|қа|ке|ды|ді|ты|ті|ны|ні)$/u, "") : word;
  const answer = clean(raw).replace(/^(?:менің жауабым|жауабым|the answer is|it is) /u, "");
  if (!answer) return -1;
  const matches = options.flatMap((option, index) => {
    const label = clean(option);
    return [label, ...(aliases[label] ?? [])].some(s => form(answer) === form(s) || answer === s) ? [index] : [];
  });
  return matches.length === 1 ? matches[0] : -1;
}
