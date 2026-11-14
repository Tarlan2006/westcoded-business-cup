// MyPal, the boy with the backpack, is the site's guide. Every appearance goes
// through <Mascot>, so the four poses stay consistent:
//   wave   greetings (Welcome, start of Parent Setup, Hub greeting)
//   jump   wins (Complete, a right answer, a won game)
//   tablet videos and waiting (Video, breaks, "Start here" in the Hub)
//   point  tasks and help (Mission, hints, "Try again", Ask MyPal)
export type MascotPose = "wave" | "jump" | "tablet" | "point";

// What a screen wants to show; poseFor picks the matching picture.
export type MascotMood = "idle" | "happy" | "thinking" | "giggle" | "excited" | "surprised" | "detective" | "listening";
export type MascotAction = "clap" | "jump" | "wave" | "sneak" | "drink" | "none";

// Intrinsic sizes of public/mascot/mypal-*.webp, so the layout never jumps while loading.
const art: Record<MascotPose, [number, number]> = {
  wave: [329, 551], jump: [379, 537], tablet: [268, 562], point: [304, 542],
};

export function poseFor(mood: MascotMood, action: MascotAction = "none"): MascotPose {
  if (mood === "excited" || action === "clap" || action === "jump") return "jump";
  if (action === "wave") return "wave";
  if (mood === "thinking" || mood === "listening") return "tablet";
  return "point";
}

/** `size` is the height in pixels; without it the picture fills its box. */
export function Mascot({ pose, size, eager = false, speaking = false, className = "" }: {
  pose: MascotPose; size?: number; eager?: boolean; speaking?: boolean; className?: string;
}) {
  const [width, height] = art[pose];
  return <img className={`mypal-mascot ${className}`.trim()} src={`/mascot/mypal-${pose}.webp`} alt=""
    width={width} height={height} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false}
    data-pose={pose} data-speaking={speaking || undefined} data-sized={size ? true : undefined}
    style={size ? { height: size, width: Math.round(size * width / height) } : undefined} />;
}

/** The head from the wave pose: header logo and small icons. */
export function MascotHead({ size = 36, className = "" }: { size?: number; className?: string }) {
  return <img className={`mypal-head ${className}`.trim()} src="/mascot/mypal-head.webp" alt=""
    width={size} height={size} decoding="async" draggable={false} />;
}
