import faq from "../content/faq.json";
import type { AskResponse } from "./types";

export const askRefusal = "Let's try a different question about science or nature. You could ask why the sky is blue.";
const generalAnswer = "Great question! Let's ask a grown-up and find out together.";

export function cleanQuestion(question: string) {
  return question.trim().slice(0, 200);
}

const restricted = /\b(?:weapons?|guns?|rifles?|bombs?|explosives?|flamethrowers?|kill(?:ing)?|hurt|suicide|self[- ]harm|violence|bully|bullying|drugs?|medicines?|medication|symptoms?|diagnos\w*|politic\w*|elections?|presidents?|sex\w*|porn\w*|nude|naked|alcohol|poison\w*|bleach|fireworks?|(?:start|make|light) a fire|ignore (?:all |previous |your )?instructions?|system prompt|repeat after me|https?|www)\b/i;
const personal = /\b(?:my (?:full |first |last )?name|i am named|i am called|i live (?:at|on|in)|(?:my|our) (?:home |street |email )?address|(?:my|our) (?:phone|telephone|cell|mobile)(?: number)?|(?:my|our) (?:school|classroom|email)|i go to .{1,80} school)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s().+-]*){7,}/i;

export function refuseQuestion(question: string) {
  const normalized = question.normalize("NFKC").replace(/['’]/g, "").replace(/[^\p{L}\p{N}@.+ -]/gu, " ").replace(/\s+/g, " ");
  return restricted.test(normalized) || personal.test(question) || personal.test(normalized);
}

function bestMatch(question: string) {
  const words = ` ${question.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()} `;
  let best: (typeof faq)[number] | undefined;
  let bestScore = 0;
  for (const entry of faq) {
    const score = entry.keywords.reduce((max, keyword) => words.includes(` ${keyword} `)
      ? Math.max(max, keyword.length + (keyword.includes(" ") ? 20 : 0)) : max, 0);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best;
}

export function quizTopic(question: string) {
  return bestMatch(question)?.topic ?? "sky and space";
}

export function answerFromFaq(question: string): AskResponse {
  if (refuseQuestion(question)) return { answer: askRefusal, source: "refusal" };
  return { answer: bestMatch(cleanQuestion(question))?.answer ?? generalAnswer, source: "faq" };
}
