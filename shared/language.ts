export type Language = "kk" | "en";
export const responses = {
  "en": {
    "refusal": "Let's ask a grown-up! We can explore animals or space together.",
    "retry": "I didn't hear that, try again!",
    "general": "Great question! Let's ask a grown-up and find out together."
  },
  "kk": {
    "refusal": "Мұны үлкендерден сұрайық, дос. Жануарлар немесе ғарыш туралы сөйлесейік.",
    "retry": "Естімей қалдым. Қайта айтып көрші!",
    "general": "Қызық сұрақ! Үлкендерден сұрап, бірге білейік."
  }
} as const;

/** Available before reading a request body, including for size/rate errors. */
export function requestLanguage(request: Request): Language {
  const explicit = new URL(request.url).searchParams.get("lang");
  if (explicit === "en" || explicit === "kk") return explicit;
  return /^kk(?:[-,;]|$)/i.test(request.headers.get("Accept-Language") ?? "") ? "kk" : "en";
}
