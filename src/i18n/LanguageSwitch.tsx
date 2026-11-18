import { changeLanguage, t, useLanguage, type Language } from "./index";
import { saveProfileLanguage } from "../state/progress";

export function LanguageSwitch() {
  const active = useLanguage();
  async function select(lang: Language) {
    await changeLanguage(lang);
    saveProfileLanguage(lang);
  }
  return <span role="group" aria-label={t("language.label")} className="language-switch">
    {(["kk", "en"] as const).map(lang => <button key={lang} type="button" lang={lang}
      aria-pressed={lang === active} onClick={() => void select(lang)}>{lang === "kk" ? "KZ" : "EN"}</button>)}
  </span>;
}
