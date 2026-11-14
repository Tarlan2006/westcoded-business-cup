import { useEffect, useState } from "react";
import { LearnPage } from "./Home";

const symbols = ["🐱", "🦉", "🐸", "🦋", "🐝", "🐙", "🐢", "🦊"];

function shuffledDeck(pairs: number) {
  const deck = [...symbols.slice(0, pairs), ...symbols.slice(0, pairs)];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function Memory({ pairs, onBack, onComplete }: {
  pairs: 4 | 8; onBack: () => void; onComplete: () => void;
}) {
  const [deck] = useState(() => shuffledDeck(pairs));
  const [shown, setShown] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const isPair = shown.length === 2 && deck[shown[0]] === deck[shown[1]];
  const won = matched.length === deck.length;

  useEffect(() => {
    if (shown.length !== 2) return;
    const timer = window.setTimeout(() => {
      if (isPair) setMatched((previous) => [...previous, ...shown]);
      setShown([]);
    }, isPair ? 420 : 850);
    return () => window.clearTimeout(timer);
  }, [shown, isPair]);

  return (
    <LearnPage title="Memory" onBack={onBack}>
      <p className="learn-description">Flip two cards to find a matching pair.</p>
      <p role="status">{won ? "All pairs found!" : `${matched.length / 2} of ${pairs} pairs`}</p>
      <div className="memory-grid">
        {deck.map((emoji, index) => {
          const found = matched.includes(index);
          const visible = found || shown.includes(index);
          return <button key={index} type="button" aria-label={visible ? `Card ${index + 1}: ${emoji}` : `Flip card ${index + 1}`}
            className={visible ? "memory-card face-up" : "memory-card"}
            disabled={visible || shown.length >= 2}
            onClick={() => setShown((previous) => previous.length < 2 && !previous.includes(index) ? [...previous, index] : previous)}>
            {visible ? emoji : "?"}
          </button>;
        })}
      </div>
      {won && <button type="button" className="primary-button" onClick={onComplete}>Collect XP</button>}
    </LearnPage>
  );
}
