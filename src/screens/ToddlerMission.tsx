import { t, subscribe } from "../i18n/index";
import { useContext, useEffect, useRef, useState } from "react";
import { useClipSpeech } from "../audio/useClipSpeech";
import { uiSound, useSoundEnabled } from "../audio/sfx";
import type { MascotAction, MascotMood } from "../components/Mascot";
import { MissionStage, missionButtonStyle, missionReplyStyle } from "../components/MissionStage";
import { SessionActivity } from "../components/SessionControls";

function makeRounds() { return [
  { seconds: 25, demoEmoji: "👏", demoWord: t("toddlerMission.clap"), prop: "👏", action: "clap", mood: "happy",
    shortPrompt: t("toddlerMission.clapHandsWith"), speech: t("toddlerMission.letUsClapOurHandsTogetherClap"),
    replies: [t("toddlerMission.clapAlt"), t("toddlerMission.teeHee")], praise: t("toddlerMission.superClapping") },
  { seconds: 25, demoEmoji: "🙈", demoWord: t("toddlerMission.peekABoo"), prop: "🙈", action: "wave", mood: "giggle",
    shortPrompt: t("toddlerMission.peekABooWaveTo"), speech: t("toddlerMission.peekABooISeeYouWave"),
    replies: [t("toddlerMission.byeBye"), t("toddlerMission.peekABooAlt")], praise: t("toddlerMission.peekABooYouAreSoFast") },
  { seconds: 25, demoEmoji: "🐮", demoWord: t("toddlerMission.mooo"), prop: "🐮", action: "jump", mood: "excited",
    shortPrompt: t("toddlerMission.whatDoesTheCowSay"), speech: t("toddlerMission.lookAFriendlyCowWhatDoesThe"),
    replies: [t("toddlerMission.moooo"), t("toddlerMission.woof")], praise: t("toddlerMission.mooooAmazingJob") },
] as const satisfies ReadonlyArray<{
  seconds: number; demoEmoji: string; demoWord: string; prop: string; action: MascotAction; mood: MascotMood;
  shortPrompt: string; speech: string; replies: readonly string[]; praise: string;
}>; }
let rounds = makeRounds();
subscribe(() => { rounds = makeRounds(); });

export function ToddlerMission({ minutes, onExit, onComplete }: { minutes: number; onExit: () => void; onComplete: (points: number) => void }) {
  const canStartActivity = useContext(SessionActivity)?.canStartActivity;
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [seconds, setSeconds] = useState<number>(rounds[0].seconds);
  const [feedback, setFeedback] = useState(false);
  const [points, setPoints] = useState(0);
  const timer = useRef<number>(0);
  const transitioning = useRef(false);
  const complete = useRef(onComplete);
  complete.current = onComplete;
  const { speak, stop } = useClipSpeech();
  const sound = useSoundEnabled();
  const round = rounds[index];

  useEffect(() => {
    if (feedback) return;
    const end = Date.now() + round.seconds * 1000;
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSeconds(next);
      if (next !== 0 || transitioning.current) return;
      transitioning.current = true;
      if (index + 1 === rounds.length || canStartActivity?.() === false) complete.current(points);
      else {
        setElapsed((value) => value + round.seconds);
        setIndex(index + 1);
        setSeconds(rounds[index + 1].seconds);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [index, round.seconds, points, feedback, canStartActivity]);

  useEffect(() => {
    transitioning.current = false;
    if (sound) void speak(round.speech);
    return stop;
  }, [round, sound, speak, stop]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function advance() {
    if (transitioning.current) return;
    transitioning.current = true;
    const earned = points + 5;
    setFeedback(true);
    uiSound("win", sound);
    if (sound) void speak(round.praise);
    timer.current = window.setTimeout(() => {
      if (index + 1 === rounds.length || canStartActivity?.() === false) complete.current(earned);
      else {
        setElapsed((value) => value + round.seconds - seconds + 2);
        setIndex(index + 1);
        setPoints(earned);
        setSeconds(rounds[index + 1].seconds);
        setFeedback(false);
      }
    }, 1700);
  }

  return <MissionStage {...round} heading={t("toddlerMission.playWith")} round={index + 1} seconds={seconds} clockSeconds={Math.max(0, minutes * 60 - elapsed - round.seconds + seconds)}
    ratio={seconds / round.seconds} onExit={onExit} mood={feedback ? "excited" : round.mood} feedback={feedback}
    prompt={feedback ? round.praise : round.shortPrompt}
    replies={round.replies.map((label) => <button key={label} type="button" className={missionReplyStyle} disabled={feedback} onClick={advance}>{label}</button>)}
    controls={<button type="button" className={`${missionButtonStyle} btn-mint text-[#062C1E] col-span-2`} disabled={feedback}
      onClick={advance}><span aria-hidden="true">✅</span> {t("mission.iDidIt")}</button>} />;
}
