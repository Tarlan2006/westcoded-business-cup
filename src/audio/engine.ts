type SoundEffect = "siren" | "tick" | "radio" | "fanfare" | "whoosh";

const effects: Record<SoundEffect, { tones: number[]; length: number; wave: OscillatorType }> = {
  siren: { tones: [460, 690, 460, 690], length: 0.14, wave: "triangle" },
  tick: { tones: [1150], length: 0.055, wave: "sine" },
  radio: { tones: [620, 400], length: 0.06, wave: "square" },
  fanfare: { tones: [392, 494, 587, 784], length: 0.12, wave: "triangle" },
  whoosh: { tones: [210, 370, 590], length: 0.045, wave: "sine" },
};

interface AudioGraph {
  context: AudioContext;
  speech: GainNode;
  ambience: GainNode;
  effects: GainNode;
  analyser: AnalyserNode;
}

let graph: AudioGraph | undefined;
let manifest: Promise<Map<string, string>> | undefined;
const clips = new Map<string, Promise<AudioBuffer>>();
let queue = Promise.resolve();
let music: AudioBufferSourceNode | undefined;
let musicBuffer: AudioBuffer | undefined;
let musicEnabled = false;
let duckEnabled = true;
let speechDepth = 0;
let playbackGeneration = 0;
let stopCurrentClip: (() => void) | undefined;
let stopCurrentSpeech: (() => void) | undefined;

function audioGraph(): AudioGraph {
  if (graph) return graph;
  const context = new AudioContext();
  const speech = context.createGain();
  const ambience = context.createGain();
  const effects = context.createGain();
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  ambience.gain.value = 0;
  effects.gain.value = 0.075;
  speech.connect(analyser).connect(context.destination);
  ambience.connect(context.destination);
  effects.connect(context.destination);
  graph = { context, speech, ambience, effects, analyser };
  return graph;
}

// Settings for the live browser voice (Ask answers and any clip without a recording).
// Names are tried in order; the first one installed on the device wins. They are
// warm US female voices that sit close to the recorded Piper clips.
const browserVoice = {
  preferred: [
    "Ava (Premium)",
    "Ava (Enhanced)",
    "Samantha (Enhanced)",
    "Samantha",
    "Ava",
    "Microsoft Zira",
  ],
  lang: "en-US",
  rate: 0.95,
  pitch: 1.1,
  volume: 1,
};

let chosenVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (chosenVoice !== undefined) return chosenVoice;
  const voices = window.speechSynthesis.getVoices();
  // Chrome fills the list asynchronously; try again on the next call.
  if (!voices.length) return null;
  const local = voices.filter((voice) => voice.localService);
  const english = local.filter((voice) => voice.lang.replace("_", "-").toLowerCase() === "en-us");
  chosenVoice = null;
  for (const name of browserVoice.preferred) {
    const match = english.find((voice) => voice.name === name) ??
      english.find((voice) => voice.name.startsWith(name));
    if (match) return chosenVoice = match;
  }
  return chosenVoice = english.find((voice) => voice.default) ?? english[0] ?? local[0] ?? null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    chosenVoice = undefined;
    pickVoice();
  });
}

function sentences(text: string): string[] {
  const parts = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]*["”)]?\s*/g) ?? [text];
  return parts.map((part) => part.trim()).filter(Boolean);
}

export async function unlock(): Promise<void> {
  if (!graph && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
    const voice = pickVoice();
    if (voice) {
      const silentSpeech = new SpeechSynthesisUtterance(" ");
      silentSpeech.voice = voice;
      silentSpeech.volume = 0;
      window.speechSynthesis.speak(silentSpeech);
    }
  }
  const { context, speech } = audioGraph();
  const resume = context.resume();
  const silent = context.createBufferSource();
  silent.buffer = context.createBuffer(1, 1, context.sampleRate);
  silent.connect(speech);
  silent.onended = () => silent.disconnect();
  silent.start();
  void loadManifest();
  window.setTimeout(() => void loadHostVoice(), 1500);
  await resume;
  updateMusic();
}

function loadManifest(): Promise<Map<string, string>> {
  manifest ??= (async () => {
    try {
      const response = await fetch("/audio/manifest.json", { signal: AbortSignal.timeout(2500) });
      if (!response.ok) return new Map();
      const data: unknown = await response.json();
      if (!data || typeof data !== "object") return new Map();
      const root = data as Record<string, unknown>;
      const entries = root.clips ?? root.lines ?? data;
      if (!entries || typeof entries !== "object") return new Map();
      const rows: [string, unknown][] = Array.isArray(entries)
        ? entries.flatMap((entry) => typeof entry?.id === "string" ? [[entry.id, entry]] : [])
        : Object.entries(entries);
      const paths = new Map<string, string>();
      for (const [id, entry] of rows) {
        const clip = entry as { file?: unknown; path?: unknown; url?: unknown } | null;
        const file = typeof entry === "string" ? entry : clip?.file ?? clip?.path ?? clip?.url;
        if (typeof file === "string" && /^\/?audio\/[\w/-]+\.mp3$/i.test(file)) {
          paths.set(id, file.startsWith("/") ? file : "/" + file);
        }
      }
      return paths;
    } catch {
      return new Map();
    }
  })();
  return manifest;
}

async function loadClip(id: string, context: AudioContext): Promise<AudioBuffer> {
  const stored = clips.get(id);
  if (stored) return stored;
  const path = (await loadManifest()).get(id);
  if (!path) throw new Error("Clip is missing from the audio manifest.");
  const loading = clips.get(id) ?? (async () => {
    const response = await fetch(path, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error("Clip is unavailable.");
    return context.decodeAudioData(await response.arrayBuffer());
  })();
  clips.set(id, loading);
  try {
    return await loading;
  } catch (error) {
    if (clips.get(id) === loading) clips.delete(id);
    throw error;
  }
}

export async function preload(ids: string[]): Promise<void> {
  if (!graph) return;
  const { context } = graph;
  const unique = [...new Set(ids)];
  for (let index = 0; index < unique.length; index += 4) {
    await Promise.allSettled(unique.slice(index, index + 4).map((id) => loadClip(id, context)));
  }
}

function enqueue(job: () => Promise<void>): Promise<void> {
  const next = queue.then(job);
  queue = next.catch(() => {});
  return next;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

async function ready(graph: AudioGraph) {
  if (graph.context.state === "running") return;
  const resumed = await Promise.race([graph.context.resume().then(() => true), wait(600).then(() => false)]);
  if (!resumed) throw new Error("Audio is suspended.");
}

function playBuffer(graph: AudioGraph, buffer: AudioBuffer, rate = 1, output: AudioNode = graph.speech): Promise<void> {
  return new Promise((resolve) => {
    const source = graph.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.connect(output);
    const stop = () => {
      source.stop();
      finish();
    };
    const timeout = window.setTimeout(stop, buffer.duration * 1000 / rate + 700);
    function finish() {
      window.clearTimeout(timeout);
      if (stopCurrentClip === stop) stopCurrentClip = undefined;
      source.disconnect();
      resolve();
    }
    stopCurrentClip = stop;
    source.onended = finish;
    source.start();
  });
}

export function playQueue(ids: string[], opts?: { gapMs?: number }): Promise<void> {
  const generation = playbackGeneration;
  return enqueue(async () => {
    if (!ids.length || generation !== playbackGeneration) return;
    const graph = audioGraph();
    await ready(graph);
    const gap = Math.min(2000, Math.max(0, opts?.gapMs ?? 160));
    let clip = loadClip(ids[0], graph.context);
    changeSpeech(1);
    try {
      for (let index = 0; index < ids.length; index++) {
        const buffer = await clip;
        if (generation !== playbackGeneration) return;
        const next = ids[index + 1];
        if (next) {
          clip = loadClip(next, graph.context);
          // Playback awaits this prefetch after the preceding clip.
          void clip.catch(() => {});
        }
        await playBuffer(graph, buffer);
        if (next && gap) await wait(gap);
      }
    } finally {
      changeSpeech(-1);
    }
  });
}

// Plays a real recording (an animal sound, not speech) from /audio. It skips the
// speech bus, so the mascot's mouth stays still, but ducks the music like speech.
export function playSound(path: string): Promise<void> {
  const generation = playbackGeneration;
  return enqueue(async () => {
    if (generation !== playbackGeneration || !/^\/audio\/[\w/-]+\.mp3$/.test(path)) return;
    const output = audioGraph();
    await ready(output);
    const loading = clips.get(path) ?? (async () => {
      const response = await fetch(path, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error("Sound is unavailable.");
      return output.context.decodeAudioData(await response.arrayBuffer());
    })();
    clips.set(path, loading);
    const buffer = await loading.catch((error) => {
      clips.delete(path);
      throw error;
    });
    if (generation !== playbackGeneration) return;
    changeSpeech(1);
    try {
      await playBuffer(output, buffer, 1, output.context.destination);
    } finally {
      changeSpeech(-1);
    }
  });
}

export function playSfx(id: SoundEffect): void {
  if (!graph) return;
  const output = graph;
  void enqueue(async () => {
    await ready(output);
    const { context, effects: bus } = output;
    const effect = effects[id];
    const start = context.currentTime;
    effect.tones.forEach((frequency, index) => {
      const at = start + index * effect.length;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = effect.wave;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, at);
      gain.gain.exponentialRampToValueAtTime(0.85, at + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, at + effect.length);
      oscillator.connect(gain).connect(bus);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(at);
      oscillator.stop(at + effect.length);
    });
    await wait(effect.tones.length * effect.length * 1000);
  }).catch(() => {});
}

export function stopSpeech(): void {
  playbackGeneration += 1;
  stopCurrentClip?.();
  stopCurrentSpeech?.();
}

export function isSpeechActive(): boolean {
  return speechDepth > 0;
}

function createMusic(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 8, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const notes = [110, 164.81, 130.81, 146.83];
  for (let index = 0; index < samples.length; index++) {
    const time = index / context.sampleRate;
    const note = notes[Math.floor(time / 2)];
    const fade = Math.sin(Math.PI * (time % 2) / 2) ** 2;
    samples[index] = fade * (Math.sin(2 * Math.PI * note * time) +
      0.35 * Math.sin(4 * Math.PI * note * time)) / 1.35;
  }
  return buffer;
}

function updateMusic() {
  if (!graph) return;
  const { context, ambience } = graph;
  ambience.gain.setTargetAtTime(
    musicEnabled ? speechDepth > 0 && duckEnabled ? 0.009 : 0.045 : 0,
    context.currentTime, 0.07,
  );
  if (!musicEnabled || music || context.state !== "running") return;
  music = context.createBufferSource();
  music.buffer = musicBuffer ??= createMusic(context);
  music.loop = true;
  music.connect(ambience);
  music.start();
}

export function setMusic(on: boolean, opts?: { duck?: boolean }): void {
  musicEnabled = on;
  duckEnabled = opts?.duck ?? true;
  if (!on && music && graph) {
    const previous = music;
    music = undefined;
    previous.onended = () => previous.disconnect();
    previous.stop(graph.context.currentTime + 0.18);
  }
  updateMusic();
}

function changeSpeech(delta: number) {
  speechDepth += delta;
  updateMusic();
}

// Live host voice: Kyutai Pocket TTS (CC-BY-4.0) runs in the browser and clones the
// approved mascot voice (content/voice/host-approved.mp3, "O3 +3") from a short
// reference clip, so every line, scripted or AI-written, uses the same voice.
// The reference already carries the +3 semitone pitch and the slower pace.
// Temperature 0.3 (library default 0.7) keeps the same pitch and intonation but
// halves the sudden jumps into a squeak (patches/pocket-tts-js+0.1.0.patch).
const hostVoice = { reference: "/voice/host-reference.mp3", language: "english_2026-04", temperature: 0.3 };

type PocketModule = typeof import("pocket-tts-js");
let hostTts: InstanceType<PocketModule["PocketTTS"]> | undefined;
let hostVoiceId: string | undefined;
let hostReady: Promise<boolean> | undefined;
let hostLoaded = false;
let hostChain: AudioNode | undefined;

// The model is a one-time ~146 MB download; skip it where data or memory is tight.
function canLoadHostVoice() {
  if (typeof Worker === "undefined" || typeof WebAssembly === "undefined") return false;
  const device = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return !device.connection?.saveData && (device.deviceMemory ?? 4) >= 2;
}

function loadHostVoice(): Promise<boolean> {
  hostReady ??= (async () => {
    if (!canLoadHostVoice()) return false;
    try {
      const { PocketTTS } = await import("pocket-tts-js");
      const tts = new PocketTTS({ language: hostVoice.language, quantized: true, voiceCloning: true,
        temperature: hostVoice.temperature });
      await tts.load();
      const response = await fetch(hostVoice.reference);
      if (!response.ok) throw new Error("Host voice reference is missing");
      const decoded = await audioGraph().context.decodeAudioData(await response.arrayBuffer());
      hostVoiceId = await tts.cloneVoice(decoded.getChannelData(0), { inputSampleRate: decoded.sampleRate, name: "host" });
      hostTts = tts;
      return hostLoaded = true;
    } catch {
      return false;
    }
  })();
  return hostReady;
}

function hostOutput(graph: AudioGraph): AudioNode {
  if (hostChain) return hostChain;
  const { context } = graph;
  const highpass = new BiquadFilterNode(context, { type: "highpass", frequency: 120 });
  const presence = new BiquadFilterNode(context, { type: "peaking", frequency: 3500, Q: 1, gain: 3 });
  const compressor = new DynamicsCompressorNode(context, { threshold: -20, ratio: 3, attack: 0.005, release: 0.06 });
  highpass.connect(presence).connect(compressor).connect(graph.speech);
  return hostChain = highpass;
}

// The model can stop mid-wave (a rising "…blue?" often does), which clicks; fade the
// edges of every line.
function fadeEdges(samples: Float32Array, sampleRate: number) {
  const fadeIn = Math.min(samples.length, Math.round(0.01 * sampleRate));
  const fadeOut = Math.min(samples.length, Math.round(0.04 * sampleRate));
  for (let index = 0; index < fadeIn; index++) samples[index] *= index / fadeIn;
  for (let index = 0; index < fadeOut; index++) samples[samples.length - 1 - index] *= index / fadeOut;
}

// Pocket TTS keeps one generation at a time, so lines are synthesized in order.
let hostQueue: Promise<unknown> = Promise.resolve();

function synthesizeHost(text: string, context: AudioContext): Promise<AudioBuffer> {
  const job = hostQueue.then(async () => {
    const chunks: Float32Array[] = [];
    await hostTts!.generate(text, { voice: hostVoiceId!, onChunk: (audio) => { chunks.push(audio.slice()); } });
    const speech = new Float32Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
    if (!speech.length) throw new Error("Host voice produced no audio");
    let offset = 0;
    for (const chunk of chunks) {
      speech.set(chunk, offset);
      offset += chunk.length;
    }
    fadeEdges(speech, hostTts!.sampleRate);
    const buffer = context.createBuffer(1, speech.length, hostTts!.sampleRate);
    buffer.copyToChannel(speech as Float32Array<ArrayBuffer>, 0);
    return buffer;
  });
  hostQueue = job.catch(() => {});
  return job;
}

async function speakHost(text: string): Promise<void> {
  const generation = playbackGeneration;
  const output = audioGraph();
  await ready(output);
  const parts = sentences(text);
  changeSpeech(1);
  try {
    let next = synthesizeHost(parts[0], output.context);
    for (let index = 0; index < parts.length; index++) {
      const buffer = await next;
      if (generation !== playbackGeneration) return;
      if (parts[index + 1]) {
        next = synthesizeHost(parts[index + 1], output.context);
        void next.catch(() => {});
      }
      await playBuffer(output, buffer, 1, hostOutput(output));
    }
  } finally {
    changeSpeech(-1);
  }
}

// True once the mascot's live voice is loaded; recorded clips are then skipped so
// every line, scripted or AI-written, comes out in the same voice.
export function hostVoiceReady(): boolean {
  return hostLoaded;
}

export function speakFallback(text: string): Promise<void> {
  if (!text) return Promise.resolve();
  if (hostLoaded) {
    const generation = playbackGeneration;
    return speakHost(text).catch(() => {
      if (generation === playbackGeneration) return speakBrowser(text);
    });
  }
  void loadHostVoice();
  return speakBrowser(text);
}

function speakBrowser(text: string): Promise<void> {
  if (!text || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return Promise.resolve();
  // Starting speech before the first await also preserves a user gesture on iOS.
  const voice = pickVoice();
  if (!voice) return Promise.resolve();
  const utterances = sentences(text).map((part) => {
    const utterance = new SpeechSynthesisUtterance(part);
    utterance.lang = browserVoice.lang;
    utterance.voice = voice;
    utterance.rate = browserVoice.rate;
    utterance.pitch = browserVoice.pitch;
    utterance.volume = browserVoice.volume;
    return utterance;
  });
  if (!utterances.length) return Promise.resolve();
  return new Promise<void>((resolve) => {
    changeSpeech(1);
    let done = false;
    const stop = () => {
      window.speechSynthesis.cancel();
      finish();
    };
    const timeout = window.setTimeout(stop, Math.max(3000, text.length * 90 / browserVoice.rate));
    stopCurrentSpeech = stop;
    function finish() {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      if (stopCurrentSpeech === stop) stopCurrentSpeech = undefined;
      changeSpeech(-1);
      resolve();
    }
    const last = utterances[utterances.length - 1];
    for (const utterance of utterances) {
      utterance.onerror = finish;
      if (utterance === last) utterance.onend = finish;
    }
    try {
      for (const utterance of utterances) window.speechSynthesis.speak(utterance);
    } catch {
      finish();
    }
  });
}
