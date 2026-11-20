import { useT } from "../i18n";
import "./CreatorCredit.css";

export function CreatorCredit() {
  const t = useT();
  const [before, name, after] = t("footer.creatorCredit").split(/<\/?creator>/);
  return <p className="creator-credit">{before}<a href="https://nexcel.kz/free" target="_blank" rel="noopener">{name}</a>{after}</p>;
}
