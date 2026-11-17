import { useEffect, useEffectEvent, useState } from "react";
import { playSound, speakFallback, stopSpeech } from "../audio/engine";
import { APP_NAME } from "../brand";
import { Mascot } from "./Mascot";
import "./AnimalSounds.css";

// After a toddler video, AIdos names each animal and says its sound, then the real
// animal is heard a moment later. Nothing needs a tap; it ends on its own.
// Recordings: content/AUDIO_CREDITS.md ("Animal sounds").
const animals = [
  { id: "cow", emoji: "🐮", name: "Cow", sound: "Moo!", line: "Look, a cow! The cow says moo, moo!", file: "/audio/animals/animal_cow.mp3" },
  { id: "cat", emoji: "🐱", name: "Cat", sound: "Meow!", line: "Look, a cat! The cat says meow, meow!", file: "/audio/animals/animal_cat.mp3" },
  { id: "dog", emoji: "🐶", name: "Dog", sound: "Woof!", line: "Look, a dog! The dog says woof, woof!", file: "/audio/animals/animal_dog.mp3" },
] as const;

const beforeRealMs = 1800;
const afterRealMs = 1400;
// Without sound the pictures still take turns at a gentle pace.
const silentLineMs = 2600;
const silentSoundMs = 1800;

type Step = { index: number; phase: "mascot" | "real" };

export function AnimalSounds({ sound, onDone }: { sound: boolean; onDone: () => void }) {
  const [step, setStep] = useState<Step>({ index: 0, phase: "mascot" });
  const finish = useEffectEvent(onDone);

  useEffect(() => {
    let active = true;
    const pause = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    void (async () => {
      for (const [index, animal] of animals.entries()) {
        if (!active) return;
        setStep({ index, phase: "mascot" });
        await (sound ? speakFallback(animal.line).catch(() => {}) : pause(silentLineMs));
        if (!active) return;
        await pause(beforeRealMs);
        if (!active) return;
        setStep({ index, phase: "real" });
        await (sound ? playSound(animal.file).catch(() => pause(silentSoundMs)) : pause(silentSoundMs));
        if (!active) return;
        await pause(afterRealMs);
      }
      if (active) finish();
    })();
    return () => {
      active = false;
      stopSpeech();
    };
  }, [sound]);

  const animal = animals[step.index];
  const real = step.phase === "real";
  return <div className="animal-sounds" role="region" aria-label="Animal sounds" aria-live="polite">
    <p className="toddler-eyebrow">WHO SAYS WHAT?</p>
    <div className="animal-sounds-stage">
      <span className="animal-sounds-guide"><Mascot pose="point" speaking={!real} /></span>
      <span key={`${animal.id}-${step.phase}`} className={`animal-sounds-animal${real ? " animal-sounds-real" : ""}`} aria-hidden="true">{animal.emoji}</span>
    </div>
    <h2>{real ? `${animal.sound} ${animal.sound}` : `The ${animal.name.toLowerCase()} says ${animal.sound}`}</h2>
    <p>{real ? `Listen, a real ${animal.name.toLowerCase()}!` : `${APP_NAME} is telling you`}</p>
    <ol className="animal-sounds-dots" aria-label={`Animal ${step.index + 1} of ${animals.length}`}>
      {animals.map((item, index) => <li key={item.id} data-state={index < step.index ? "done" : index === step.index ? "now" : "next"}>{item.emoji}</li>)}
    </ol>
  </div>;
}
