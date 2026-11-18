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
