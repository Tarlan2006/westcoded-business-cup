import { t } from "../i18n/index";
import { HoldButton } from "./HoldButton";

export function GrownUpsButton({ onOpen, exit = false, variant = "default", disabled = false }: {
  onOpen: () => void; exit?: boolean; variant?: "default" | "parents" | "exit"; disabled?: boolean;
}) {
  const exiting = exit || variant === "exit";
  return <div className={variant === "default" ? "flow-grownups" : undefined}>
    <HoldButton className={variant === "default" ? "flow-hold-button" : "prototype-parent-button"} disabled={disabled}
      duration={exiting ? 1400 : 1500} hintKey={exiting ? "exit" : "parents"} onComplete={onOpen}
      aria-label={exiting ? t("grownUpsButton.holdExit") : variant === "parents" ? t("grownUpsButton.parentsPressAndHold") : t("grownUpsButton.grownUpsHoldFor15Seconds")}>
      <span>{exiting ? t("grownUpsButton.holdExit") : variant === "parents" ? t("grownUpsButton.parents") : t("grownUpsButton.grownUps")}</span>
    </HoldButton>
    {variant === "default" && !exiting && <span className="flow-hold-hint">{t("grownUpsButton.pressAndHold")}</span>}
  </div>;
}
