import { AIDOS_VOICE, normalizeSpeech } from "../../shared/voice";
import { ambienceThemes, type AmbienceTheme } from "./ambienceThemes";
import { changeVoicePlayback, setSpeechMeter } from "./speechMotion";
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
let musicGain: GainNode | undefined;
let musicEnabled = false;
let musicTheme: AmbienceTheme = "calm";
const musicPauses = new Set<symbol>();
let duckEnabled = true;
let speechDepth = 0;
let playbackGeneration = 0;
let stopCurrentClip: (() => void) | undefined;

function audioGraph(): AudioGraph {
  if (graph) return graph;
  const context = new AudioContext();
  const speech = context.createGain();
  const ambience = context.createGain();
  const effects = context.createGain();
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  const waveform = new Uint8Array(analyser.fftSize);
  setSpeechMeter(() => {
    if (context.state !== 'running') return 0;
    analyser.getByteTimeDomainData(waveform);
    let energy = 0;
    for (const value of waveform) energy += ((value - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(energy / waveform.length) * 9);
  });
  ambience.gain.value = 0;
  effects.gain.value = 0.075;
  speech.connect(analyser).connect(context.destination);
  ambience.connect(context.destination);
  effects.connect(context.destination);
  graph = { context, speech, ambience, effects, analyser };
  return graph;
}

export async function unlock(): Promise<void> {
  const { context, speech } = audioGraph();
  const resume = context.resume();
  const silent = context.createBufferSource();
  silent.buffer = context.createBuffer(1, 1, context.sampleRate);
  silent.connect(speech);
  silent.onended = () => silent.disconnect();
  silent.start();
  void loadManifest();
  void loadVoiceIndex();
  void preload(["common_setup_greeting"]);
  await resume;
  updateMusic();
}

function loadManifest(): Promise<Map<string, string>> {
  manifest ??= (async () => {
    try {
      const response = await fetch("/audio/manifest.json?voice=" + AIDOS_VOICE, { signal: AbortSignal.timeout(2500) });
      if (!response.ok) return new Map();
      const data: unknown = await response.json();
      if (!data || typeof data !== "object") return new Map();
      const root = data as Record<string, unknown>;
      if (root.voice !== AIDOS_VOICE) return new Map();
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
  })().then(paths => {
    // A temporary offline response must not disable recordings for this tab forever.
    if (!paths.size) manifest = undefined;
    return paths;
  });
  return manifest;
}

async function loadClip(id: string, context: AudioContext): Promise<AudioBuffer> {
  const stored = clips.get(id);
  if (stored) return stored;
  const path = (await loadManifest()).get(id);
  if (!path) throw new Error("Clip is missing from the audio manifest.");
  const loading = clips.get(id) ?? (async () => {
    const response = await fetch(path + "?voice=" + AIDOS_VOICE, { signal: AbortSignal.timeout(3000) });
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

function playBuffer(graph: AudioGraph, buffer: AudioBuffer, rate = 1, output: AudioNode = graph.speech, voice = true): Promise<void> {
  return new Promise((resolve) => {
    const source = graph.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const envelope = graph.context.createGain();
    const start = graph.context.currentTime;
    const duration = buffer.duration / rate;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(1, start + Math.min(.005, duration / 3));
    envelope.gain.setValueAtTime(1, start + Math.max(.005, duration - .012));
    envelope.gain.linearRampToValueAtTime(0, start + duration);
    source.connect(envelope).connect(output);
    let stopping = false;
    const stop = () => {
      if (stopping || finished) return;
      stopping = true;
      const now = graph.context.currentTime;
      envelope.gain.cancelScheduledValues(now);
      envelope.gain.setTargetAtTime(0, now, .004);
      source.stop(now + .02);
    };
    const timeout = window.setTimeout(stop, buffer.duration * 1000 / rate + 700);
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (voice) changeVoicePlayback('recorded', -1);
      window.clearTimeout(timeout);
      if (stopCurrentClip === stop) stopCurrentClip = undefined;
      source.disconnect();
      envelope.disconnect();
      resolve();
    }
    stopCurrentClip = stop;
    source.onended = finish;
    source.start();
    if (voice) changeVoicePlayback('recorded', 1);
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
      await playBuffer(output, buffer, 1, output.context.destination, false);
    } finally {
      changeSpeech(-1);
    }
  });
}

let lastEffectAt = -Infinity;
export function playSfx(id: SoundEffect): void {
  if (id === "radio" || id === "tick" || id === "siren" || isSpeechActive() || Date.now() - lastEffectAt < 500) return;
  lastEffectAt = Date.now();
  if (!graph) return;
  const output = graph;
  void (async () => {
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
  })().catch(() => {});
}

export function stopSpeech(): void {
  playbackGeneration += 1;
  queue = Promise.resolve(); // A cancelled download must not block the next prompt.
  stopCurrentClip?.();
}

export function isSpeechActive(): boolean {
  return speechDepth > 0;
}

function createMusic(context: AudioContext) {
  const { notes, beat } = ambienceThemes[musicTheme];
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * beat * notes.length), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index++) {
    const time = index / context.sampleRate;
    const note = notes[Math.min(notes.length - 1, Math.floor(time / beat))];
    const fade = Math.sin(Math.PI * (time % beat) / beat) ** 2;
    samples[index] = fade * (Math.sin(2 * Math.PI * note * time) +
      0.35 * Math.sin(4 * Math.PI * note * time)) / 1.35;
  }
  return buffer;
}

function updateMusic() {
  if (!graph) return;
  const { context, ambience } = graph;
  ambience.gain.setTargetAtTime(
    musicEnabled && !musicPauses.size ? speechDepth > 0 && duckEnabled ? 0.004 : 0.028 : 0,
    context.currentTime, 0.07,
  );
  if (!musicEnabled || musicPauses.size || music || context.state !== "running") return;
  music = context.createBufferSource();
  music.buffer = musicBuffer ??= createMusic(context);
  music.loop = true;
  musicGain = context.createGain();
  musicGain.gain.setValueAtTime(0, context.currentTime);
  musicGain.gain.linearRampToValueAtTime(1, context.currentTime + 0.18);
  music.connect(musicGain).connect(ambience);
  music.start();
}

export function setMusic(on: boolean, opts?: { duck?: boolean; theme?: AmbienceTheme }): void {
  const changed = opts?.theme !== undefined && opts.theme !== musicTheme;
  if (changed) { musicTheme = opts!.theme!; musicBuffer = undefined; }
  musicEnabled = on;
  duckEnabled = opts?.duck ?? true;
  if ((!on || changed) && music && graph) {
    const previous = music;
    music = undefined;
    const previousGain = musicGain;
    musicGain = undefined;
    previousGain?.gain.cancelScheduledValues(graph.context.currentTime);
    previousGain?.gain.setValueAtTime(previousGain.gain.value, graph.context.currentTime);
    previousGain?.gain.linearRampToValueAtTime(0, graph.context.currentTime + 0.18);
    previous.onended = () => { previous.disconnect(); previousGain?.disconnect(); };
    previous.stop(graph.context.currentTime + 0.18);
  }
  updateMusic();
}

export function pauseMusic(owner: symbol, paused: boolean): void {
  if (paused) musicPauses.add(owner); else musicPauses.delete(owner);
  if (musicPauses.size && graph) {
    graph.ambience.gain.cancelScheduledValues(graph.context.currentTime);
    graph.ambience.gain.setValueAtTime(0, graph.context.currentTime);
    if (music) { music.onended = () => {}; music.stop(); music.disconnect(); musicGain?.disconnect(); musicGain = undefined; music = undefined; }
  }
  updateMusic();
}

function changeSpeech(delta: number) {
  speechDepth += delta;
  updateMusic();
}

// Every spoken line uses the pinned AIdos voice. Never switch to a device voice.
let voiceIndex: Promise<Record<string,string>> | undefined;
const spokenBuffers = new Map<string, Promise<AudioBuffer>>();
function loadVoiceIndex() {
  voiceIndex ??= fetch('/audio/voice-index.json?voice=' + AIDOS_VOICE, {signal: AbortSignal.timeout(2500)})
    .then(async response => { if(!response.ok) throw new Error('voice_index'); const data=await response.json(); if(data.voice!==AIDOS_VOICE)throw new Error('voice_version');return data.texts as Record<string,string>; })
    .catch(() => { voiceIndex=undefined; return {}; });
  return voiceIndex;
}
async function voiceBuffer(text: string, context: AudioContext) {
  let result=spokenBuffers.get(text);
  if(!result){
    result=(async()=>{
      const index=await loadVoiceIndex();
      let response: Response | undefined;
      if(index[text]) response=await fetch(index[text]+'?voice='+AIDOS_VOICE,{signal:AbortSignal.timeout(3000)}).catch(()=>undefined);
      if(!response?.ok){
        response=await fetch('/api/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),signal:AbortSignal.timeout(7500)});
        if(response.headers.get('X-AIdos-Voice')!==AIDOS_VOICE)throw new Error('voice_version');
      }
      if(!response.ok)throw new Error('voice_unavailable');
      return context.decodeAudioData(await response.arrayBuffer());
    })();
    if(spokenBuffers.size>=48)spokenBuffers.delete(spokenBuffers.keys().next().value!);
    spokenBuffers.set(text,result);
  }
  try {return await result;}catch(error){spokenBuffers.delete(text);throw error;}
}
export function speakFallback(raw: string): Promise<void> {
  const text=normalizeSpeech(raw);
  if(!text) return Promise.resolve();
  stopSpeech();
  const generation=playbackGeneration;
  return enqueue(async()=>{
    const output=audioGraph();await ready(output);
    const buffer=await voiceBuffer(text,output.context);
    if(generation!==playbackGeneration)return;
    changeSpeech(1);
    try {await playBuffer(output,buffer);} finally {changeSpeech(-1);}
  }).catch(()=>{ /* Keep captions and Hear it; never use a different fallback voice. */ });
}
