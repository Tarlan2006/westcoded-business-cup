import { APP_NAME } from '../brand';
import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { animateMascot, type Emotion } from './mascotMotion';
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

export function Mascot({ pose, size, speaking, emotion, eventKey, className = "" }: {
  pose: MascotPose; emotion?: Emotion; eventKey?: string | number; size?: number; eager?: boolean; speaking?: boolean; className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<ReturnType<typeof animateMascot> | null>(null);
  useLayoutEffect(() => {
    const node = canvas.current!;
    const guide = animateMascot(node.parentElement!, node);
    controller.current = guide;
    return () => { guide.dispose(); controller.current = null; };
  }, []);
  useLayoutEffect(() => {
    const intent = emotion ?? (pose === 'jump' ? 'correct' : pose === 'wave' ? 'greeting' : 'idle');
    controller.current?.update(intent, speaking !== false, eventKey);
  }, [pose, emotion, speaking, eventKey]);
  const boxHeight = size ? Math.min(size, 280) : undefined;
  const style: CSSProperties | undefined = boxHeight ? { height: boxHeight, width: Math.round(boxHeight * .75) } : undefined;
  return <span className={`aidos-mascot ${className}`.trim()} role="img" aria-label={APP_NAME}
    data-pose={pose} data-sized={size ? true : undefined} style={style}>
    <canvas className="aid-frames" ref={canvas} width={320} height={496} aria-hidden="true" />
  </span>;
}
