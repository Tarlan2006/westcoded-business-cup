// AIdos, the boy with the backpack, is the site's guide. Every appearance goes
// through <Mascot>, so the four poses stay consistent:
//   wave   greetings (Welcome, start of Parent Setup, Hub greeting)
//   jump   wins (Complete, a right answer, a won game)
//   tablet videos and waiting (Video, breaks, "Start here" in the Hub)
//   point  tasks and help (Mission, hints, "Try again", Ask AIdos)
import { APP_NAME } from '../brand';
import type { CSSProperties } from 'react';
import './Mascot.css';
export type MascotPose = "wave" | "jump" | "tablet" | "point";

// What a screen wants to show; poseFor picks the matching picture.
export type MascotMood = "idle" | "happy" | "thinking" | "giggle" | "excited" | "surprised" | "detective" | "listening";
export type MascotAction = "clap" | "jump" | "wave" | "sneak" | "drink" | "none";

export function poseFor(mood: MascotMood, action: MascotAction = "none"): MascotPose {
  if (mood === "excited" || action === "clap" || action === "jump") return "jump";
  if (action === "wave") return "wave";
  if (mood === "thinking" || mood === "listening") return "tablet";
  return "point";
}

/** `size` is the height in pixels; without it the picture fills its box. */
export function Mascot({ pose, size, eager = false, className = "" }: {
  pose: MascotPose; size?: number; eager?: boolean; speaking?: boolean; className?: string;
}) {
  const style = size ? { height: Math.min(size,280), width: Math.round(Math.min(size,280)*.75) } as CSSProperties : undefined;
  return <span className={`aidos-mascot ${className}`.trim()} role="img" aria-label={APP_NAME}
    data-pose={pose} data-reference="approved" data-sized={size ? true : undefined} style={style}>
    <img className="aid-reference" src="/mascot/aidos-reference.png" alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} />
  </span>;
}
