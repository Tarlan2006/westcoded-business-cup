import { useEffect, useRef, useState } from "react";
import { uiSound, useSoundEnabled } from "../audio/sfx";
import { ParticlePop } from "./GameUI";

export type BleepMood = "idle" | "happy" | "thinking" | "giggle" | "excited" | "surprised" | "detective" | "listening";
export type BleepAction = "clap" | "jump" | "wave" | "sneak" | "drink" | "none";

export function PrototypeBleep({ variant, mood = "happy", action = "none", prop, speaking, tickled }: {
  variant: "splash" | "greeting" | "mission"; mood?: BleepMood; action?: BleepAction;
  prop?: string; speaking?: boolean; tickled?: boolean;
}) {
  const mission = variant === "mission";
  const greeting = variant === "greeting";
  const motion = tickled ? "bleep-tickle" : greeting || action === "none" ? "bleep-float"
    : action === "clap" || action === "wave" ? `bleep-float action-${action}` : `action-${action}`;
  return <span className={`prototype-bleep${speaking ? " bleep-speaking" : ""}`} data-mood={mood}>
    <span className={`block ${motion}`}>
      <svg viewBox={mission ? "0 0 200 215" : "0 0 200 210"} aria-hidden="true">
        <g className="bleep-antenna">
          <line x1="100" y1="45" x2="100" y2={mission ? 16 : 18} stroke={mission ? "#A78BFA" : "#6C47FF"} strokeWidth={mission ? 7 : 8} strokeLinecap="round" />
          <circle cx="100" cy={mission ? 12 : 14} r="10" fill={mission ? "#2CE69B" : "#58CC02"} />
        </g>
        {mission ? <>
          <ellipse cx="78" cy="174" rx="13" ry="7" fill="#6C47FF" />
          <ellipse cx="122" cy="174" rx="13" ry="7" fill="#6C47FF" />
        </> : <>
          <g className={greeting && action === "wave" ? "greeting-wave" : undefined}>
            <ellipse cx={greeting ? 28 : 30} cy={greeting ? 105 : 128} rx="12" ry="22"
              transform={greeting ? "rotate(-48 28 105)" : "rotate(-18 30 128)"} fill={greeting ? "#FF7849" : "#6C47FF"} />
          </g>
          <ellipse cx="170" cy="128" rx="12" ry="22" transform="rotate(18 170 128)" fill="#6C47FF" />
        </>}
        <rect x="40" y="42" width="120" height="126" rx="58" fill={mission ? "#FFFFFF" : "#F8FAFC"}
          stroke={mission ? "#8B5CF6" : "#6C47FF"} strokeWidth={mission ? 7 : 8} />
        <path d="M 62 146 Q 100 162 138 146" fill="none" stroke={mission ? "#EDE9FE" : "#DDD6FE"} strokeWidth="8" strokeLinecap="round" />
        <rect x="54" y="66" width="92" height="58" rx="28" fill="#1E1B4B" />
        <ellipse cx="64" cy="112" rx="7" ry="4" fill="#FF7849" opacity="0.65" />
        <ellipse cx="136" cy="112" rx="7" ry="4" fill="#FF7849" opacity="0.65" />
        <PrototypeFace mood={mission ? mood : "happy"} variant={variant} />
        {mission && <>
          <g className="arm-left">
            <rect x="16" y="106" width="22" height="40" rx="11" transform="rotate(-18 27 126)" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="22" cy="105" r="9" fill="#FF7849" stroke="#FFFFFF" strokeWidth="2.5" />
          </g>
          <g className="arm-right">
            <rect x="162" y="106" width="22" height="40" rx="11" transform="rotate(18 173 126)" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="178" cy="105" r="9" fill="#FF7849" stroke="#FFFFFF" strokeWidth="2.5" />
          </g>
          {prop && <text x="158" y="102" fontSize="34" className="pointer-events-none">{prop}</text>}
        </>}
      </svg>
    </span>
  </span>;
}

function PrototypeFace({ mood, variant }: { mood: BleepMood; variant: "splash" | "greeting" | "mission" }) {
  if (mood === "giggle") return <>
    <path d="M 70 86 L 86 95 L 70 104 M 130 86 L 114 95 L 130 104" fill="none" stroke="#FFD13B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 86 106 Q 100 124 114 106 Z" fill="#FF7849" stroke="#38BDF8" strokeWidth="4" />
  </>;
  if (mood === "excited" || mood === "surprised" || mood === "listening") {
    const eyes = { excited: { r: 10, fill: "#FFD13B" }, surprised: { r: 11, fill: "none", stroke: "#FF7849", strokeWidth: 5 }, listening: { r: 9, fill: "#2CE69B" } }[mood];
    const mouth = { excited: { d: "M 88 106 Q 100 122 112 106 Z", fill: "#38BDF8" }, surprised: { d: "M 94 111 A 6 6 0 1 0 106 111 A 6 6 0 1 0 94 111", fill: "#FF7849" }, listening: { d: "M 93 110 Q 100 114 107 110", fill: "none" } }[mood];
    return <><circle cx="81" cy="94" {...eyes} /><circle cx="119" cy="94" {...eyes} />
      <path {...mouth} stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" /></>;
  }
  if (mood === "detective") return <>
    <rect x="68" y="88" width="24" height="10" rx="5" fill="#2CE69B" />
    <rect x="108" y="88" width="24" height="10" rx="5" fill="#2CE69B" />
    <path d="M 90 110 Q 100 116 110 110" fill="none" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
  </>;
  const mouth = variant === "greeting" ? "M 89 106 Q 100 120 111 106 Z" : "M 90 107 Q 100 118 110 107 Z";
  return <>
    <path d={variant === "mission" ? "M 72 95 Q 81 82 90 95 M 110 95 Q 119 82 128 95" : "M 72 95 Q 81 80 90 95 M 110 95 Q 119 80 128 95"} fill="none" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" />
    {variant === "mission" ? <path d="M 92 108 Q 100 115 108 108" fill="none" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" /> : <path d={mouth} fill="#38BDF8" />}
  </>;
}

export function Mascot({ mood = "idle", action = "none", speaking = false, playful = false }: {
  mood?: BleepMood; action?: BleepAction; speaking?: boolean; playful?: boolean;
}) {
  const [tickled, setTickled] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const sound = useSoundEnabled();
  const face = tickled ? "giggle" : mood;
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const art = (
    <svg className="mascot" viewBox="0 0 220 220" aria-hidden="true" focusable="false"
      data-mood={face} data-action={action} data-speaking={speaking || undefined}>
      <ellipse cx="110" cy="207" rx="57" ry="7" fill="#6c47ff" opacity=".25" />
      <g className="bleep-float">
        <g className="bleep-pose">
          <g className="bleep-antenna">
            <path d="M110 63V30" stroke="#6c47ff" strokeWidth="7" strokeLinecap="round" />
            <circle cx="110" cy="23" r="11" fill="#2ce69b" stroke="#167d70" strokeWidth="3" />
            <circle cx="107" cy="19" r="3" fill="#d3ffeb" />
          </g>
          <path d="M52 113Q27 112 25 137q1 18 16 18l14-14" fill="#fff" stroke="#6c47ff" strokeWidth="5" />
          <g className="bleep-hand"><path d="M166 112q16 0 24-20c7-13 22-4 20 6-3 20-15 36-41 43Z" fill="#fff" stroke="#6c47ff" strokeWidth="5" strokeLinejoin="round" /></g>
          <rect x="63" y="166" width="42" height="24" rx="12" fill="#9d7bff" stroke="#5031b8" strokeWidth="5" />
          <rect x="116" y="166" width="42" height="24" rx="12" fill="#9d7bff" stroke="#5031b8" strokeWidth="5" />
          <rect x="44" y="52" width="132" height="125" rx="56" fill="#fff" stroke="#6c47ff" strokeWidth="6" />
          <rect x="60" y="74" width="100" height="69" rx="31" fill="#100b3b" />
          <path d="M82 158h56" stroke="#d7caff" strokeWidth="5" strokeLinecap="round" />
          <g fill="#2ce69b" stroke="#2ce69b" strokeLinecap="round" strokeLinejoin="round">
            {face === "giggle" || face === "happy" ? <>
              <path d="M80 105q8-13 16 0m28 0q8-13 16 0" fill="none" strokeWidth="5" />
              <path d="M100 116h20q-10 20-20 0Z" strokeWidth="3" />
            </> : <>
              <ellipse cx="88" cy="103" rx={face === "detective" ? 4 : 6} ry={face === "listening" ? 9 : 7} />
              <ellipse cx="132" cy="103" rx="6" ry={face === "surprised" ? 10 : 7} />
              {face === "surprised" || face === "listening" ? <ellipse cx="110" cy="122" rx="5" ry="6" />
                : <path d={face === "thinking" ? "M105 121h10" : "M101 116q9 13 18 0"} fill="none" strokeWidth="4" />}
            </>}
          </g>
          {face === "detective" && <path d="M78 91l18 5m28 0 17-5" fill="none" stroke="#ffd13b" strokeWidth="4" strokeLinecap="round" />}
          <circle cx="74" cy="114" r="4" fill="#ff8f98" /><circle cx="146" cy="114" r="4" fill="#ff8f98" />
          {action === "drink" && <path d="M145 131h24l-4 24h-16zM156 131l7-16h7" fill="#38bdf8" stroke="#0284c7" strokeWidth="3" />}
        </g>
      </g>
    </svg>
  );
  if (!playful) return art;
  return <button className="bleep-touch" type="button" aria-label="Tickle Bleep" onClick={() => {
    window.clearTimeout(timer.current);
    setTickled(true);
    uiSound("giggle", sound);
    timer.current = window.setTimeout(() => setTickled(false), 750);
  }}>{art}{tickled && <ParticlePop hearts />}</button>;
}
