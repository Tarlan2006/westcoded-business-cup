import { t, subscribe } from "../i18n/index";
import { useEffect, useEffectEvent, useState } from "react";
import { playSound, speakFallback, stopSpeech } from "../audio/engine";
import { Mascot } from "./Mascot";
import "./AnimalSounds.css";

// After a toddler video, AIdos names each animal and says its sound, then the real
// animal is heard a moment later. Nothing needs a tap; it ends on its own.
// Recordings: content/AUDIO_CREDITS.md ("Animal sounds").
function makeAnimals() { return [
  { id: "cow", emoji: "🐮", name: t("animalSounds.cow"), sound: t("animalSounds.moo"), line: t("animalSounds.lookACowTheCowSaysMoo"), file: "/audio/animals/animal_cow.mp3" },
  { id: "cat", emoji: "🐱", name: t("animalSounds.cat"), sound: t("animalSounds.meow"), line: t("animalSounds.lookACatTheCatSaysMeow"), file: "/audio/animals/animal_cat.mp3" },
  { id: "dog", emoji: "🐶", name: t("animalSounds.dog"), sound: t("animalSounds.woof"), line: t("animalSounds.lookADogTheDogSaysWoof"), file: "/audio/animals/animal_dog.mp3" },
] as const; }
let animals = makeAnimals();
subscribe(() => { animals = makeAnimals(); });

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
  return <div className="animal-sounds" role="region" aria-label={t("animalSounds.animalSounds")} aria-live="polite">
    <p className="toddler-eyebrow">{t("animalSounds.whoSaysWhat")}</p>
    <div className="animal-sounds-stage">
      <span className="animal-sounds-guide"><Mascot pose="point" speaking={!real} /></span>
      <span key={`${animal.id}-${step.phase}`} className={`animal-sounds-animal${real ? " animal-sounds-real" : ""}`} aria-hidden="true">{animal.emoji}</span>
    </div>
    <h2>{real ? `${animal.sound} ${animal.sound}` : t("animalSounds.theSays", { value1: animal.name.toLowerCase(), value2: animal.sound })}</h2>
    <p>{real ? t("animalSounds.listenAReal", { value1: animal.name.toLowerCase() }) : t("animalSounds.isTellingYou")}</p>
    <ol className="animal-sounds-dots" aria-label={t("animalSounds.animalOf", { value1: step.index + 1, value2: animals.length })}>
      {animals.map((item, index) => <li key={item.id} data-state={index < step.index ? "done" : index === step.index ? "now" : "next"}>{item.emoji}</li>)}
    </ol>
  </div>;
}
