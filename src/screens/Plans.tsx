import { InlineSymbol } from "../components/InlineSymbol";
import { t } from "../i18n/index";
import { useState } from "react";
import { Mascot } from "../components/Mascot";
import { lockedGames, plans, type PlanId } from "../game/premium";
import { LearnPage } from "./Home";

/** Shown after tapping a locked game: what AIdos Plus includes and its two plans. */
export function Plans({ onBack }: { onBack: () => void }) {
  const [chosen, setChosen] = useState<PlanId | null>(null);
  const picked = plans.find((plan) => plan.id === chosen);

  return <LearnPage title={t("plans.plus")} onBack={onBack}>
    <section className="plans-hero panel">
      <Mascot pose="point" size={130} />
      <div>
        <p className="field-label">{t("plans.forGrownUps")}</p>
        <h2>{t("plans.unlockMoreGamesAndAdventures")}</h2>
        <ul className="plans-games" aria-label={t("plans.gamesYouUnlock")}>
          {lockedGames.map((game) => <li key={game.id}><span aria-hidden="true">{game.icon}</span> {game.title}</li>)}
        </ul>
      </div>
    </section>
    <div className="plans-grid">
      {plans.map((plan) => <article key={plan.id} className="plan-card panel" data-plan={plan.id} aria-labelledby={`plan-${plan.id}`}>
        {"badge" in plan && <span className="plan-badge">{plan.badge}</span>}
        <h2 id={`plan-${plan.id}`}>{plan.name}</h2>
        <p className="plan-price"><strong>{plan.price}</strong> <span>{plan.period}</span></p>
        <p className="plan-note">{plan.note}</p>
        <ul className="plan-features">
          {plan.features.map((feature) => <li key={feature}><span aria-hidden="true"><InlineSymbol mark="✓" /></span> {feature}</li>)}
        </ul>
        <button type="button" className={plan.id === "yearly" ? "primary-button" : "secondary-button"}
          aria-pressed={chosen === plan.id} onClick={() => setChosen(plan.id)}>{t("plans.choose", { value1: plan.name.toLowerCase() })}</button>
      </article>)}
    </div>
    {picked && <p className="plans-status panel" role="status">{t("plans.thanksPlusIsComingSoonNoPayment", { value1: picked.name.toLowerCase(), value2: picked.price, value3: picked.period })}</p>}
    <p className="learn-description text-sm">{t("plans.pricesInUsDollarsSubscriptionsAreNot")}</p>
  </LearnPage>;
}
