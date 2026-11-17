import { Mascot } from "../../components/Mascot";

/** AIdos beside the balloons: points while counting, checks while you answer, jumps when you are right. */
export function Guide({ mood }: { mood: "idle" | "thinking" | "excited" | "oops" }) {
  return <span className="bl-guide" data-mood={mood}>
    <Mascot pose={mood === "excited" ? "jump" : mood === "thinking" ? "tablet" : "point"} />
  </span>;
}
