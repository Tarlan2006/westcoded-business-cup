import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type JSX } from "react";
import { GameButton } from "../../components/GameUI";
import { BalloonArt } from "./BalloonArt";
import { Bleep } from "./Bleep";
import { answerOptions, layoutBalloons, pointsFor, roundSpec, type AgeGroup } from "./model";
import "./balloons.css";
import "./reference.css";

export interface BalloonsGameProps {
  ageGroup: "3-5" | "6-8";
  onComplete: (points: number) => void;
  onBack: () => void;
  speak?: (text: string) => void;
}
type Stage = "look" | "fading" | "answer" | "result" | "final";
function nextRound(age: AgeGroup, index: number, previous = 0) {
  const seed = Math.floor(Math.random() * 0x100000000);
  return { seed, index, ...roundSpec(age, index, seed, previous) };
}
function say(speak: BalloonsGameProps["speak"], text: string) {
  try { Promise.resolve(speak?.(text)).catch(() => {}); } catch { /* Every instruction is also text. */ }
}

/** Keying the session also resets safely if a host changes the age prop. */
export default function BalloonsGame(props: BalloonsGameProps): JSX.Element {
  return <Session key={props.ageGroup} {...props} />;
}
function Session({ ageGroup, onComplete, onBack, speak }: BalloonsGameProps) {
  const [round, setRound] = useState(() => nextRound(ageGroup, 0));
  const [stage, setStage] = useState<Stage>("look");
  const [marked, setMarked] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [wins, setWins] = useState<boolean[]>([]);
  const [seconds, setSeconds] = useState(round.seconds);
  const [fraction, setFraction] = useState(1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [completed, setCompleted] = useState(false);
  const [exited, setExited] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const phase = useRef<Stage>("look");
  const delivered = useRef(false);
  const speaking = useRef(speak);
  speaking.current = speak;
  const ready = size.width > 0;
  const correct = wins.filter(Boolean).length;
  const points = pointsFor(correct);
  const options = useMemo(() => answerOptions(round.count, ageGroup, round.seed), [round, ageGroup]);
  const balloons = useMemo(() => ready ? layoutBalloons(round.count, size.width, size.height, round.baseDiameter, round.seed) : [], [round, size, ready]);

  useLayoutEffect(() => {
    const element = scene.current;
    if (!element) return;
    const measure = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (width >= 280 && height >= 280) setSize((old) => old.width === width && old.height === height ? old : { width, height });
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure); observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function transition(next: Stage) { phase.current = next; setStage(next); }
  function counted() {
    if (phase.current !== "look") return;
    transition("fading");
  }
  useEffect(() => {
    if (stage !== "look" || !ready || exited) return;
    const end = Date.now() + round.seconds * 1000;
    say(speaking.current, "Count the balloons!");
    const tick = () => {
      const remaining = Math.max(0, end - Date.now());
      setSeconds(Math.ceil(remaining / 1000)); setFraction(remaining / (round.seconds * 1000));
      if (!remaining) counted();
    };
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [round, ready, stage, exited]);
  useEffect(() => {
    if (stage !== "fading" || exited) return;
    const timer = window.setTimeout(() => transition("answer"), 400);
    return () => window.clearTimeout(timer);
  }, [stage, exited]);
  useEffect(() => { if (stage !== "look" && stage !== "fading") heading.current?.focus({ preventScroll: true }); }, [stage]);

  function choose(value: number) {
    if (phase.current !== "answer" || exited) return;
    setPicked(value); setWins((previous) => [...previous, value === round.count]);
    transition("result");
    say(speaking.current, value === round.count ? `Yes! ${round.count} balloons! Great counting!` : `Close! There were ${round.count}. Next one!`);
  }
  function advance() {
    if (phase.current !== "result") return;
    if (round.index === 4) { transition("final"); return; }
    const next = nextRound(ageGroup, round.index + 1, round.count);
    setRound(next); setMarked([]); setPicked(null); setSeconds(next.seconds); setFraction(1); transition("look");
  }
  function replay() {
    const next = nextRound(ageGroup, 0);
    delivered.current = false; setCompleted(false); setExited(false);
    setRound(next); setWins([]); setMarked([]); setPicked(null); setSeconds(next.seconds); setFraction(1); transition("look");
  }
  function back() { setExited(true); onBack(); }
  const looking = stage === "look" || stage === "fading";
  const success = picked === round.count;
  const mood = stage === "answer" ? "thinking" : stage === "result" ? success ? "excited" : "oops" : "idle";
  const message = looking ? ageGroup === "3-5" ? "Tap a balloon to mark it as you count!" : "Take your time. Count them one by one."
    : stage === "answer" ? "Think hard. You can do it!" : success ? "Great counting!" : `Close! There were ${round.count}. Next one!`;

  return <section className="bl-game" aria-label="Balloon Count" data-stage={stage}>
    <div className="bl-shell">
      <header className="bl-header">
        <nav className="bl-navigation" aria-label="Game navigation">
          <button className="bl-back" type="button" onClick={back}>← Back</button>
          <button className="bl-home" type="button" onClick={back} aria-label="Home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M6 9v12h5v-6h3v6h4V9" /></svg></button>
        </nav>
        <span className="bl-xp" aria-label={`${stage === "final" ? points : correct * 4} experience points`}>{stage === "final" ? points : correct * 4} XP</span>
      </header>
      <div className="bl-title"><p className="bl-breadcrumb">Learn <span aria-hidden="true">›</span> Balloons</p><h1>Balloon Count</h1><p>{looking ? "Count all the balloons!" : stage === "final" ? "Round complete!" : "Pick the right number."}</p></div>
      <div className="bl-roundbar">
        <div className="bl-round"><span className="bl-dots" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <i key={i} data-state={i < round.index ? "past" : i === round.index ? "current" : "future"} />)}</span><strong>Round {round.index + 1} of 5</strong></div>
        {looking && <div className="bl-timer" aria-label={`${seconds} seconds left`}><div className="bl-track"><span style={{ transform: `scaleX(${fraction})` }} /></div><b>{seconds} s</b></div>}
      </div>
      <div className="bl-play-area" inert={stage === "final" || exited} aria-hidden={stage === "final" || undefined}>
        <div className="bl-main">
          <div className="bl-scene" ref={scene}>
            {looking ? <div className="bl-balloon-field" data-fading={stage === "fading"} inert={stage === "fading" || exited}>
              {balloons.map((balloon) => {
                const order = marked.indexOf(balloon.id);
                return <div className="bl-position" key={balloon.id} style={{ left: balloon.x, top: balloon.y,
                  "--bl-diameter": `${balloon.diameter}px`, "--bl-tilt": `${balloon.tilt}deg`, "--bl-bob": `${balloon.bob}px`,
                  "--bl-period": `${balloon.period}s`, "--bl-phase": `${balloon.phase}s` } as CSSProperties}>
                  <button className="bl-balloon" type="button" aria-label={order >= 0 ? `Balloon, marked ${order + 1}, tap to unmark` : "Balloon, tap to mark"}
                    aria-pressed={order >= 0} onClick={() => {
                      if (phase.current !== "look" || exited) return;
                      setMarked((old) => old.includes(balloon.id) ? old.filter((id) => id !== balloon.id) : [...old, balloon.id]);
                    }}>
                    <BalloonArt color={balloon.color} />
                    {order >= 0 && <span className="bl-marker" aria-hidden="true">{order + 1}</span>}
                  </button>
                </div>;
              })}
            </div> : <div className="bl-answer-panel">
              <h2 tabIndex={-1} ref={heading}>{stage === "answer" ? "How many balloons?" : success ? `Yes! ${round.count} balloons!` : `There were ${round.count}.`}</h2>
              <div className="bl-answer-bleep"><Bleep mood={mood} /></div>
              <div className="bl-answers" aria-label="Choose a number">
                {options.map((value) => <button type="button" className="bl-answer" key={value} aria-label={String(value)}
                  aria-disabled={stage !== "answer"} data-result={stage === "result" ? value === round.count ? "correct" : value === picked ? "wrong" : "muted" : undefined}
                  onClick={() => choose(value)}>{value}{stage === "result" && value === round.count && <span className="bl-check" aria-label="Correct answer">✓</span>}</button>)}
              </div>
              {stage === "result" && success && <div className="bl-confetti" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ "--bl-n": i } as CSSProperties}>★</i>)}</div>}
            </div>}
          </div>
          <div className="bl-primary-slot">{looking ? <GameButton className="bl-primary" disabled={stage === "fading" || exited} onClick={counted}>I COUNTED!</GameButton>
            : stage === "result" ? <GameButton className="bl-primary" onClick={advance}>NEXT ROUND</GameButton> : null}</div>
        </div>
        <aside className="bl-companion" aria-label="Bleep's counting tip"><Bleep mood={mood} /><p className="bl-bubble" aria-live="polite"><span className="bl-mobile-tip">{message}</span><span className="bl-desktop-tip">{looking ? <>Count them all<br />before time runs out!</> : message}</span></p></aside>
      </div>
      {stage === "final" && <div className="bl-final-shade"><section className="bl-final" aria-label="Counting results">
        <Bleep mood="excited" />
        <h2 tabIndex={-1} ref={heading}>You counted {correct} of 5!</h2>
        <div className="bl-stars" aria-label={`${correct} out of 5 stars`}>{wins.map((_, i) => <span key={i} data-earned={i < correct} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2l3 7 7.4.6-5.6 4.8 1.7 7.2L12 17.8 5.5 21.6l1.7-7.2L1.6 9.6 9 9z" fill="currentColor" stroke="#1E1B4B" /></svg></span>)}</div>
        <strong className="bl-earned">+{points} XP</strong>
        <GameButton className="bl-primary" disabled={completed} onClick={() => {
          if (delivered.current) return;
          delivered.current = true; setCompleted(true); onComplete(points);
        }}>DONE</GameButton>
        <button className="bl-again" type="button" onClick={replay}>Play again</button>
      </section></div>}
    </div>
  </section>;
}
