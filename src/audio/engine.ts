export async function unlock(): Promise<void> {
  console.debug("Audio unlocked (mock)");
}

export async function playQueue(ids: string[], opts?: { gapMs?: number }): Promise<void> {
  console.debug("Play queue (mock)", ids, opts);
}

export function playSfx(id: "siren" | "tick" | "radio" | "fanfare" | "whoosh"): void {
  console.debug("Play sound effect (mock)", id);
}

export function setMusic(on: boolean, opts?: { duck?: boolean }): void {
  console.debug("Set music (mock)", on, opts);
}

export async function speakFallback(text: string): Promise<void> {
  if (!("speechSynthesis" in window)) {
    return;
  }

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
