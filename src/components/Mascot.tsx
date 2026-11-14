import { useEffect, useRef, useState } from "react";
import { uiSound, useSoundEnabled } from "../audio/sfx";
import { ParticlePop } from "./GameUI";

export type BleepMood = "idle" | "happy" | "thinking" | "giggle" | "excited" | "surprised" | "detective" | "listening";
export type BleepAction = "clap" | "jump" | "wave" | "sneak" | "drink" | "none";

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
