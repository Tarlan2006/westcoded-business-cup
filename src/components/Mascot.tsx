// AIdos, the boy with the backpack, is the site's guide. Every appearance goes
// through <Mascot>, so the four poses stay consistent:
//   wave   greetings (Welcome, start of Parent Setup, Hub greeting)
//   jump   wins (Complete, a right answer, a won game)
//   tablet videos and waiting (Video, breaks, "Start here" in the Hub)
//   point  tasks and help (Mission, hints, "Try again", Ask AIdos)
import { APP_NAME } from '../brand';
import { useState, useSyncExternalStore, type CSSProperties } from 'react';
import { useSoundEnabled } from '../audio/sfx';
import { getSpeechFrame, subscribeSpeechFrame } from '../audio/speechMotion';
import './Mascot.css';
export type MascotPose = "wave" | "jump" | "tablet" | "point";

// What a screen wants to show; poseFor picks the matching picture.
export type MascotMood = "idle" | "happy" | "thinking" | "giggle" | "excited" | "surprised" | "detective" | "listening";
export type MascotAction = "clap" | "jump" | "wave" | "sneak" | "drink" | "none";

// Intrinsic sizes of public/mascot/aidos-*.webp, so the layout never jumps while loading.
const art: Record<MascotPose, [number, number]> = {
  wave: [408, 700], jump: [470, 700], tablet: [467, 700], point: [391, 700],
};
// Anchor the torso, not the transparent image rectangle or outstretched hand.
const anchors = { wave: 46, jump: 55, tablet: 49, point: 39 };
const mouths = {
  wave: 'ellipse 15% 6% at 48% 35%',
  jump: 'ellipse 12% 5.5% at 56% 34%',
  tablet: 'ellipse 10% 4% at 53% 32%',
  point: 'ellipse 13% 4.8% at 44% 32%',
};

export function poseFor(mood: MascotMood, action: MascotAction = "none"): MascotPose {
  if (mood === "excited" || action === "clap" || action === "jump") return "jump";
  if (action === "wave") return "wave";
  if (mood === "thinking" || mood === "listening") return "tablet";
  return "point";
}

/** `size` is the height in pixels; without it the picture fills its box. */
export function Mascot({ pose, size, eager = false, speaking, className = "" }: {
  pose: MascotPose; size?: number; eager?: boolean; speaking?: boolean; className?: string;
}) {
  const [width, height] = art[pose];
  const sound = useSoundEnabled();
  const frame = useSyncExternalStore(subscribeSpeechFrame, getSpeechFrame, getSpeechFrame);
  const active = sound && speaking !== false && frame.active;
  const [readyPose, setReadyPose] = useState<MascotPose | null>(null);
  const style = { '--aid-mouth': active ? frame.mouth / 3 : 0,
    ...(size ? { height: Math.min(size, 280), width: Math.round(Math.min(size, 280) * .75) } : {}) } as CSSProperties;
  return <span className={`aidos-mascot ${className}`.trim()} role="img" aria-label={APP_NAME}
    data-pose={pose} data-speaking={active || undefined} data-sized={size ? true : undefined} style={style}>
    <span className="aid-body" aria-hidden="true">
      <span className="aid-pose" style={{ aspectRatio: `${width}/${height}`, transform: `translateX(-${anchors[pose]}%)` }}>
        <img className="aid-sprite" src={`/mascot/aidos-${pose}.webp`} alt=""
          srcSet={`/mascot/aidos-${pose}.webp 1x, /mascot/aidos-${pose}@2x.webp 2x`}
          width={width} height={height} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} />
        <img key={pose} className="aid-sprite aid-mouth" src={`/mascot/aidos-${pose}-closed.webp`} alt=""
          width={width} height={height} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false}
          onLoad={() => setReadyPose(pose)} onError={() => setReadyPose(null)} data-ready={readyPose === pose || undefined}
          style={{ maskImage: `radial-gradient(${mouths[pose]}, #000 65%, transparent 100%)` }} />
      </span>
    </span>
  </span>;
}
