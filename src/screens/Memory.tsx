import { InlineSymbol } from "../components/InlineSymbol";
import { t } from "../i18n/index";
import { APP_NAME } from "../brand";
import { useEffect, useId, useRef, useState } from "react";
import { ActivityHeader } from "../components/ActivityHeader";
import { GameButton, SpeechBubble } from "../components/GameUI";
import { Mascot } from "../components/Mascot";
import { MemoryCardBack, MemoryIcon, memoryIcons, type MemoryIconName } from "../games/memory/icons";
import "./Memory.css";

const symbols = Object.keys(memoryIcons) as MemoryIconName[];

function shuffledDeck(pairs: number) {
  const deck = [...symbols.slice(0, pairs), ...symbols.slice(0, pairs)];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function Memory({ pairs, onBack, onComplete, onReplay }: {
  pairs: 4 | 8; onBack: () => void; onComplete: () => void; onReplay: () => void;
}) {
  const [deck] = useState(() => shuffledDeck(pairs));
  const [shown, setShown] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const isPair = shown.length === 2 && deck[shown[0]] === deck[shown[1]];
  const missed = shown.length === 2 && !isPair;
  const won = matched.length === deck.length;
  const foundPairs = matched.length / 2;
  const victory = useRef<HTMLDialogElement>(null);
  const submitted = useRef(false);
  const victoryTitle = useId();
  const victoryReward = useId();

  useEffect(() => {
    if (shown.length !== 2) return;
    const timer = window.setTimeout(() => {
      if (isPair) setMatched((previous) => [...previous, ...shown]);
      setShown([]);
    }, isPair ? 420 : 850);
    return () => window.clearTimeout(timer);
  }, [shown, isPair]);

  useEffect(() => {
    if (!won) return;
    const dialog = victory.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [won]);

  function finish(action: () => void) {
    if (submitted.current) return;
    submitted.current = true;
    action();
  }

  return (
    <div className="memory-view" data-pairs={pairs}>
      <main className="shell memory-shell">
        <ActivityHeader title={t("activitySuggestions.memory")} onBack={onBack} />
        <div className="memory-intro">
          <div>
            <h1>{t("activitySuggestions.memory")}</h1>
            <p>{t("memory.flipTwoCardsToFindAMatching")}</p>
          </div>
          <div className="memory-progress">
            <span className="memory-stars" aria-hidden="true">{Array.from({ length: pairs }, (_, index) =>
              <span key={index} data-earned={index < foundPairs}><InlineSymbol mark="★" /></span>)}</span>
            <span role="status">{t("memory.ofPairs", { foundPairs, pairs })}</span>
          </div>
        </div>
        <div className="memory-layout">
          <div className="memory-grid" role="group" aria-label={t("memory.memoryCards")}>
            {deck.map((icon, index) => {
              const found = matched.includes(index);
              const visible = found || shown.includes(index);
              const label = visible ? t("memory.card", { value1: memoryIcons[icon], value2: index + 1, value3: found ? t("memory.matched") : "" }) : t("memory.hiddenCard", { value1: index + 1 });
              return <button key={index} type="button" aria-label={label} className="memory-card"
                data-face-up={visible} data-matched={found || undefined} data-miss={visible && !found && missed || undefined}
                aria-disabled={visible || shown.length >= 2}
                onClick={() => {
                  if (found) return;
                  setShown((previous) => previous.length < 2 && !previous.includes(index) ? [...previous, index] : previous);
                }}>
                <span className="memory-flip" aria-hidden="true">
                  <span className="memory-face memory-back"><MemoryCardBack /></span>
                  <span className="memory-face memory-front">
                    <MemoryIcon name={icon} />
                    {found && <span className="memory-check"><svg viewBox="0 0 20 20" focusable="false">
                      <path d="m4 10 4 4 8-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg></span>}
                  </span>
                </span>
              </button>;
            })}
          </div>
          <aside className="memory-guide" aria-label={`${APP_NAME}`}>
            <div className="memory-guide-mascot"><Mascot pose={won ? "jump" : "point"} size={64} /></div>
            <SpeechBubble className="memory-speech" live>
              {won ? t("memory.youFoundThemAll") : missed ? t("memory.oopsNotAPairTryAgain") : t("memory.findTheMatchingDinoFriends")}
            </SpeechBubble>
          </aside>
        </div>
        {won && <>
          <GameButton className="memory-show-result" onClick={() => victory.current?.showModal()}>{t("memory.showResults")}</GameButton>
          <dialog className="memory-victory" ref={victory} aria-labelledby={victoryTitle} aria-describedby={victoryReward}>
            <p className="memory-win-label"><span aria-hidden="true">🎉</span> {t("memory.allPairsFound")}</p>
            <div className="memory-winner-mascot"><Mascot pose="jump" /></div>
            <h2 id={victoryTitle}>{t("memory.greatMemory")}</h2>
            <p className="memory-xp" id={victoryReward}>+20 XP <span aria-hidden="true"><InlineSymbol mark="★" /></span></p>
            <div className="memory-victory-actions">
              <GameButton className="memory-play-again" onClick={() => finish(onReplay)}>{t("balloonsGame.playAgain")}</GameButton>
              <GameButton tone="purple" onClick={() => finish(onComplete)}>{t("memory.trySomethingElse")}</GameButton>
            </div>
          </dialog>
        </>}
      </main>
    </div>
  );
}
