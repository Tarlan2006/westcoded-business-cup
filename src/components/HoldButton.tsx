import { t, getLanguage } from "../i18n/index";
import { useId, type ButtonHTMLAttributes } from "react";
import { useHold, type HoldOptions } from "./useHold";
import "./hold.css";

export function HoldButton({ children, className = "", talk, duration, hintKey, onBegin, onRelease, onCancel, onComplete, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & HoldOptions) {
  const hold = useHold({ disabled: props.disabled, talk, duration, hintKey, onBegin, onRelease, onCancel, onComplete });
  const id = useId();
  return <span className="hold-wrap">
    {hold.hint && <span id={id} role="status" className="hold-tip">{talk ? t("holdButton.pressAndHoldToTalk") : t("grownUpsButton.pressAndHold")}</span>}
    <button {...props} {...hold.handlers} type="button" aria-describedby={hold.hint ? id : props["aria-describedby"]}
      className={`${className} hold-control${hold.holding ? " hold-pressed" : ""}${hold.shake ? " hold-shake" : ""}`}>
      {children}
      {hold.holding && <span className="hold-status">{talk && hold.progress === 1 ? t("holdButton.letGoToSend") : t("holdButton.keepHolding")}
        {!talk && t("holdButton.s", { value1: hold.remaining.toLocaleString(getLanguage(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}</span>}
      {hold.holding && <span className="hold-track" aria-hidden="true"><span style={{ width: `${hold.progress * 100}%` }} /></span>}
    </button>
  </span>;
}
