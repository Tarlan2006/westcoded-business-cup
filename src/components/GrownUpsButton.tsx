import { HoldButton } from "./HoldButton";

export function GrownUpsButton({ onOpen, exit = false, variant = "default", disabled = false }: {
  onOpen: () => void; exit?: boolean; variant?: "default" | "parents" | "exit"; disabled?: boolean;
}) {
  const exiting = exit || variant === "exit";
  return <div className={variant === "default" ? "flow-grownups" : undefined}>
    <HoldButton className={variant === "default" ? "flow-hold-button" : "prototype-parent-button"} disabled={disabled}
      duration={exiting ? 1400 : 1500} hintKey={exiting ? "exit" : "parents"} onComplete={onOpen}
      aria-label={exiting ? "Hold: Exit" : variant === "parents" ? "Parents, press and hold" : "Grown-ups: hold for 1.5 seconds"}>
      <span>{exiting ? "Hold: Exit" : variant === "parents" ? "👨‍👩‍👧 Parents" : "🔒 Grown-ups"}</span>
    </HoldButton>
    {variant === "default" && !exiting && <span className="flow-hold-hint">Press and hold</span>}
  </div>;
}
