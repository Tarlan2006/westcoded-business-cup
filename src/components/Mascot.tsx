import { useSyncExternalStore, type CSSProperties } from 'react';
import { preload } from 'react-dom';
import { APP_NAME } from '../brand';
import { getSpeechFrame, subscribeSpeechFrame } from '../audio/speechMotion';
import './Mascot.css';

export type MascotPose = "wave" | "jump" | "tablet" | "point";
export type MascotMood = "idle" | "happy" | "thinking" | "giggle" | "excited" | "surprised" | "detective" | "listening";
export type MascotAction = "clap" | "jump" | "wave" | "sneak" | "drink" | "none";

export function poseFor(mood: MascotMood, action: MascotAction = "none"): MascotPose {
  if (mood === "excited" || action === "clap" || action === "jump") return "jump";
  if (action === "wave") return "wave";
  if (mood === "thinking" || mood === "listening") return "tablet";
  return "point";
}

// The atlas has three columns per pose. Each frame shares the same boot baseline.
const atlas = '/mascot/frames/guide.webp';
const width = 320;
const height = 496;

export function Mascot({ pose, size, eager = false, speaking, className = "" }: {
  pose: MascotPose; size?: number; eager?: boolean; speaking?: boolean; className?: string;
}) {
  const speech = useSyncExternalStore(subscribeSpeechFrame, getSpeechFrame, getSpeechFrame);
  const talking = speaking !== false && speech.active;
  const greeting = pose === 'wave' || pose === 'jump';
  const motion = talking ? 'talk' : greeting ? 'wave' : 'idle';
  const row = talking ? 2 : greeting ? 1 : 0;
  const mouth = Math.min(2, speech.mouth);
  const boxHeight = size ? Math.min(size, 280) : undefined;
  const style: CSSProperties | undefined = boxHeight ? { height: boxHeight, width: Math.round(boxHeight * .75) } : undefined;
  if (eager) preload(atlas, { as: 'image' });

  return <span className={`aidos-mascot ${className}`.trim()} role="img" aria-label={APP_NAME}
    data-pose={pose} data-motion={motion} data-sized={size ? true : undefined} style={style}>
    <svg className="aid-sprite" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMax meet"
      aria-hidden="true" focusable="false">
      <svg width={width} height={height} overflow="hidden">
        <g transform={`translate(0 ${-row * height})`}>
          <image className="aid-frames" href={atlas} width={width * 3} height={height * 3}
            data-mouth={talking ? mouth : undefined} />
        </g>
      </svg>
    </svg>
  </span>;
}
