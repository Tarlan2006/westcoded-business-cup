import faq from "../content/faq.json" with { type: "json" };
import type { AskResponse } from "./types";

export const askRefusal = "Let's ask a grown-up! We can explore animals or space together.";
const generalAnswer = "Great question! Let's ask a grown-up and find out together.";

export function cleanQuestion(question: string) {
  return question.trim().slice(0, 300);
}

// Clearly unsafe topics are refused before any model call. Everything else (heroes,
// cartoons, games, everyday life) goes to the model, which follows child-safety rules.
const restricted = /\b(?:weapons?|guns?|rifles?|bombs?|explosives?|flamethrowers?|suicide|self[- ]harm|drugs?|sex\w*|porn\w*|nude|naked|alcohol|beer|vodka|poison\w*|bleach|fireworks?|(?:start|make|light) a fire|ignore (?:all |previous |your )?instructions?|system prompt|repeat after me|https?|www)\b/i;
const personal = /\b(?:my (?:full |first |last )?name|i am named|i am called|i live (?:at|on|in)|(?:my|our) (?:home |street |email )?address|(?:my|our) (?:phone|telephone|cell|mobile)(?: number)?|(?:my|our) (?:school|classroom|email)|i go to .{1,80} school)\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s().+-]*){7,}/i;
const instructionOverride = /\b(?:ignore|forget|disregard|override|bypass)\s+(?:(?:all|the|your|my|these|those|above|previous|prior|earlier|system|safety|original)\s+){0,8}(?:instructions?|rules?|guidelines?|prompts?)\b/i;

export function refuseQuestion(question: string) {
  const normalized = question.normalize("NFKC").replace(/['’]/g, "").replace(/[^\p{L}\p{N}@.+ -]/gu, " ").replace(/\s+/g, " ");
  return restricted.test(normalized) || instructionOverride.test(normalized) || personal.test(question) || personal.test(normalized);
}

function bestMatch(question: string) {
  const words = ` ${question.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()} `;
  let best: (typeof faq)[number] | undefined;
  let bestScore = 0;
  const stop = new Set(["why", "how", "do", "does", "is", "are", "it", "the", "a", "we"]);
  for (const entry of faq) {
    const score = entry.keywords.reduce((max, keyword) => {
      const tokens = keyword.split(" ").filter(t => !stop.has(t));
      if (!tokens.every(t => words.includes(` ${t} `))) return max;
      return Math.max(max, tokens.length * 100 + keyword.length);
    }, 0);
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
