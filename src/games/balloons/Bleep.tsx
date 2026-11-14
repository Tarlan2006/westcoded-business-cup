import { Mascot } from "../../components/Mascot";

/** Reuse the site's Bleep art, with no playful/audio side effects. */
export function Bleep({ mood }: { mood: "idle" | "thinking" | "excited" | "oops" }) {
  return <span className="bl-bleep" data-mood={mood}>
    <Mascot mood={mood === "oops" ? "surprised" : mood === "idle" ? "happy" : mood} action={mood === "excited" ? "clap" : "none"} />
  </span>;
}
