import { useSyncExternalStore } from "react";
import { APP_NAME } from "../brand";
import type en from "./en";

export type Language = "en" | "kk";
export type MessageKey = keyof typeof en;
type Messages = Record<MessageKey, string>;
const listeners = new Set<() => void>();
const cache: Partial<Record<Language, Messages>> = {};
let lang: Language = "kk";
let messages: Messages;
let request = 0;

export function getLanguage() { return lang; }
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function useLanguage() { return useSyncExternalStore(subscribe, getLanguage); }
export function t(key: MessageKey, vars: Record<string, string | number> = {}) {
  return messages[key].replace(/\{(\w+)\}/g, (_, name: string) =>
    name === "brand" ? APP_NAME : String(vars[name] ?? ""));
}
export function contentText(key: string) {
  if (!Object.hasOwn(messages, key)) throw new Error("Unknown content key: " + key);
  return t(key as MessageKey);
}
export function useT() { useLanguage(); return t; }
export async function changeLanguage(next: Language, persist = true) {
  const ticket = ++request;
  const dictionary = cache[next] ??= (next === "kk" ? await import("./kk") : await import("./en")).default;
  if (ticket !== request) return;
  messages = dictionary;
  lang = next;
  document.documentElement.lang = next;
  if (persist) {
    try { localStorage.setItem("mypal.lang", next); } catch { /* tab only */ }
  }
  listeners.forEach(fn => fn());
}
export async function initializeLanguage() {
  let saved: string | null = null;
  try { saved = localStorage.getItem("mypal.lang"); } catch { /* start in Kazakh */ }
  await changeLanguage(saved === "en" ? "en" : "kk", false);
}
