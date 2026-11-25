import { contentText, getLanguage, subscribe } from "../i18n";
import { AIDOS_VOICE, normalizeSpeech } from "../../shared/voice";
import type { AmbienceTheme } from "./ambienceThemes";
import { changeVoicePlayback, setSpeechMeter, speechBoundary } from "./speechMotion";
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

const voiceVersion = () => getLanguage() === "kk" ? "kk-iseke-v1" : AIDOS_VOICE;
let graph: AudioGraph | undefined;
let manifest: Promise<Map<string, string>> | undefined;
const clips = new Map<string, Promise<AudioBuffer>>();
let queue = Promise.resolve();
let music: AudioBufferSourceNode | undefined;
let musicBuffer: AudioBuffer | undefined;
let loadingMusic: AbortController | undefined;
let musicStart = 0;
const musicOffsets = new Map<AmbienceTheme, number>();
let musicGain: GainNode | undefined;
let musicEnabled = false;
let musicTheme: AmbienceTheme = "calm";
const musicPauses = new Set<symbol>();
let duckEnabled = true;
let speechDepth = 0;
let playbackGeneration = 0;
let stopCurrentClip: (() => void) | undefined;
let finishDeviceSpeech: (() => void) | undefined;

function audioGraph(): AudioGraph {
  if (graph) return graph;
  const context = new AudioContext();
  const speech = context.createGain();
  const ambience = context.createGain();
  const effects = context.createGain();
  const analyser = context.createAnalyser();
  analyser.fftSize = 1024;
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
  if (getLanguage() === "kk") window.speechSynthesis?.getVoices();
  void loadManifest();
  void loadVoiceIndex();
  void preload(["common_setup_greeting"]);
  await resume;
  updateMusic();
}

function loadManifest(): Promise<Map<string, string>> {
  manifest ??= (async () => {
    try {
      const response = await fetch("/audio/" + getLanguage() + "/manifest.json?voice=" + voiceVersion(), { signal: AbortSignal.timeout(2500) });
      if (!response.ok) return new Map();
      const data: unknown = await response.json();
      if (!data || typeof data !== "object") return new Map();
      const root = data as Record<string, unknown>;
      if (root.voice !== voiceVersion()) return new Map();
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
  const cacheKey = getLanguage() + ":" + id;
  const stored = clips.get(cacheKey);
  if (stored) return stored;
  const path = (await loadManifest()).get(id);
  if (!path) throw new Error("Clip is missing from the audio manifest.");
  const loading = clips.get(cacheKey) ?? (async () => {
    const response = await fetch(path + "?voice=" + AIDOS_VOICE, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error("Clip is unavailable.");
    return context.decodeAudioData(await response.arrayBuffer());
  })();
  clips.set(cacheKey, loading);
  try {
    return await loading;
  } catch (error) {
    if (clips.get(cacheKey) === loading) clips.delete(cacheKey);
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
    const soften = voice && getLanguage() === "kk";
    const playbackRate = soften ? rate * 0.97 : rate;
    source.playbackRate.value = playbackRate;
    const envelope = graph.context.createGain();
    const start = graph.context.currentTime;
    const duration = buffer.duration / playbackRate;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(1, start + Math.min(.005, duration / 3));
    envelope.gain.setValueAtTime(1, start + Math.max(.005, duration - .012));
    envelope.gain.linearRampToValueAtTime(0, start + duration);
    const warmth = soften ? graph.context.createBiquadFilter() : undefined;
    if (warmth) {
      warmth.type = "highshelf";
      warmth.frequency.value = 3000;
      warmth.gain.value = -3;
      source.connect(warmth).connect(envelope);
    } else {
      source.connect(envelope);
    }
    envelope.connect(output);
    let stopping = false;
    const stop = () => {
      if (stopping || finished) return;
      stopping = true;
      const now = graph.context.currentTime;
      envelope.gain.cancelScheduledValues(now);
      envelope.gain.setTargetAtTime(0, now, .004);
      source.stop(now + .02);
    };
    const timeout = window.setTimeout(stop, duration * 1000 + 700);
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (voice) changeVoicePlayback('recorded', -1);
      window.clearTimeout(timeout);
      if (stopCurrentClip === stop) stopCurrentClip = undefined;
      source.disconnect();
      warmth?.disconnect();
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
    changeSpeech(1);
    try {
      for (let index = 0; index < ids.length; index++) {
        if (generation !== playbackGeneration) return;
        const id = ids[index];
        const next = ids[index + 1];
        if (next) void preload([next]);
        const preferred = preferredKazakhVoice();
        const spoken = preferred && await deviceSpeech(contentText("voice." + id), preferred);
        if (generation !== playbackGeneration) return;
        if (!spoken) {
          const buffer = await loadClip(id, graph.context).catch(() => undefined);
          if (generation !== playbackGeneration) return;
          if (buffer) await playBuffer(graph, buffer);
          else if (!preferred) await deviceSpeech(contentText("voice." + id));
        }
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
  finishDeviceSpeech?.();
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  queue = Promise.resolve(); // A cancelled download must not block the next prompt.
  stopCurrentClip?.();
}

export function isSpeechActive(): boolean {
  return speechDepth > 0;
}

async function loadMusic(context: AudioContext, theme: AmbienceTheme) {
  const request = new AbortController();
  loadingMusic = request;
  try {
    const response = await fetch('/audio/music/' + theme + '.mp3?v=1', { signal: request.signal });
    if (!response.ok) return;
    const decoded = await context.decodeAudioData(await response.arrayBuffer());
    if (loadingMusic !== request) return;
    musicBuffer = decoded;
    updateMusic();
  } catch {
    // An interrupted or unavailable soundtrack leaves the activity playable.
  } finally {
    if (loadingMusic === request) loadingMusic = undefined;
  }
}

function saveMusicPosition() {
  if (musicBuffer && music && graph) {
    musicOffsets.set(musicTheme, (graph.context.currentTime - musicStart) % musicBuffer.duration);
  }
}

function updateMusic() {
  if (!graph) return;
  const { context, ambience } = graph;
  ambience.gain.setTargetAtTime(
    musicEnabled && !musicPauses.size ? speechDepth > 0 && duckEnabled ? 0.010 : 0.075 : 0,
    context.currentTime, 0.07,
  );
  if (!musicEnabled || musicPauses.size || music || context.state !== "running") return;
  if (!musicBuffer) {
    if (!loadingMusic) void loadMusic(context, musicTheme);
    return;
  }
  music = context.createBufferSource();
  music.buffer = musicBuffer;
  music.loop = true;
  musicGain = context.createGain();
  musicGain.gain.setValueAtTime(0, context.currentTime);
  musicGain.gain.linearRampToValueAtTime(1, context.currentTime + 0.18);
  music.connect(musicGain).connect(ambience);
  const offset = musicOffsets.get(musicTheme) ?? 0;
  musicStart = context.currentTime - offset;
  music.start(0, offset);
}

export function setMusic(on: boolean, opts?: { duck?: boolean; theme?: AmbienceTheme }): void {
  const changed = opts?.theme !== undefined && opts.theme !== musicTheme;
  if (!on || changed) {
    saveMusicPosition();
    loadingMusic?.abort();
    loadingMusic = undefined;
  }
  if (opts?.theme && changed) {
    musicTheme = opts.theme;
    musicBuffer = undefined;
  }
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
    saveMusicPosition();
    if (music) { music.onended = () => {}; music.stop(); music.disconnect(); musicGain?.disconnect(); musicGain = undefined; music = undefined; }
  }
  updateMusic();
}

function changeSpeech(delta: number) {
  speechDepth += delta;
  updateMusic();
}

// The recording index and the device fallback follow the active language.
let voiceIndex: Promise<Record<string,string>> | undefined;
const spokenBuffers = new Map<string, Promise<AudioBuffer>>();
function loadVoiceIndex() {
  voiceIndex ??= fetch('/audio/' + getLanguage() + '/voice-index.json?voice=' + voiceVersion(), {cache: 'no-cache', signal: AbortSignal.timeout(2500)})
    .then(async response => { if(!response.ok) throw new Error('voice_index'); const data=await response.json(); if(data.voice!==voiceVersion())throw new Error('voice_version');return data.texts as Record<string,string>; })
    .catch(() => { voiceIndex=undefined; return {}; });
  return voiceIndex;
}
async function voiceBuffer(text: string, context: AudioContext) {
  const language = getLanguage();
  let result=spokenBuffers.get(text);
  if(!result){
    result=(async()=>{
      const index=await loadVoiceIndex();
      let response: Response | undefined;
      if(index[text]) response=await fetch(index[text]+'?voice='+voiceVersion(),{signal:AbortSignal.timeout(3000)}).catch(()=>undefined);
      if(!response?.ok){
        if (language !== 'en' || language !== getLanguage()) throw new Error('no_recording');
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
export async function speakAnswer(raw: string): Promise<"played" | "unavailable" | "cancelled"> {
  const text = normalizeSpeech(raw);
  if (!text) return "unavailable";
  stopSpeech();
  const generation = playbackGeneration;
  let played = false;
  await enqueue(async () => {
    if (generation !== playbackGeneration) return;
    const preferred = preferredKazakhVoice();
    if (preferred) {
      changeSpeech(1);
      try { played = await deviceSpeech(text, preferred); } finally { changeSpeech(-1); }
      if (played || generation !== playbackGeneration) return;
    }
    try {
      const output = audioGraph();
      await ready(output);
      const buffer = await voiceBuffer(text, output.context);
      if (generation !== playbackGeneration) return;
      changeSpeech(1);
      try { await playBuffer(output, buffer); played = true; } finally { changeSpeech(-1); }
      return;
    } catch {
      // Native speech can still work if Web Audio or the recording is unavailable.
    }
    if (preferred || generation !== playbackGeneration) return;
    changeSpeech(1);
    try { played = await deviceSpeech(text); } finally { changeSpeech(-1); }
  }).catch(() => {});
  if (generation !== playbackGeneration) return "cancelled";
  return played ? "played" : "unavailable";
}

export async function speakFallback(raw: string): Promise<void> {
  await speakAnswer(raw);
}

function preferredKazakhVoice() {
  if (getLanguage() !== "kk") return undefined;
  return window.speechSynthesis?.getVoices().find(voice =>
    /^kk(?:[-_]|$)/i.test(voice.lang) && /aigul|айгүл/i.test(voice.name));
}

async function deviceSpeech(text: string, preferred?: SpeechSynthesisVoice): Promise<boolean> {
  const synth = window.speechSynthesis;
  if (!synth) return false;
  const generation = playbackGeneration;
  const lang = getLanguage();
  const matchingVoice = () => preferred ?? preferredKazakhVoice() ?? synth.getVoices().find(v => v.lang.toLowerCase().split(/[-_]/)[0] === lang);
  let voice = matchingVoice();
  if (!voice) {
    await new Promise<void>(resolve => {
      function finish() {
        clearTimeout(timeout);
        synth.removeEventListener("voiceschanged", changed);
        resolve();
      }
      function changed() { if (matchingVoice()) finish(); }
      const timeout = window.setTimeout(finish, 850);
      synth.addEventListener("voiceschanged", changed);
      changed();
    });
    voice = matchingVoice();
  }
  if (!voice || generation !== playbackGeneration) return false;
  return new Promise(resolve => {
    const words = new SpeechSynthesisUtterance(lang === "kk" ? text.replace(/\bAIdos\b/gi, "Айдос") : text);
    words.voice = voice;
    words.lang = lang === "kk" ? "kk-KZ" : "en-US";
    if (lang === "kk") {
      words.rate = 0.92;
      words.volume = 0.94;
    }
    let started = false;
    let completed = false;
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      if (started) changeVoicePlayback('browser', -1);
      if (finishDeviceSpeech === finish) finishDeviceSpeech = undefined;
      resolve(completed);
    }
    const timeout = window.setTimeout(() => { finish(); synth.cancel(); }, 20000);
    finishDeviceSpeech = finish;
    words.onboundary = () => { if (started && !finished) speechBoundary(); };
    words.onstart = words.onresume = () => {
      if (finished || started) return;
      started = true;
      changeVoicePlayback('browser', 1);
    };
    words.onpause = () => {
      if (started && !finished) { started = false; changeVoicePlayback('browser', -1); }
    };
    words.onend = () => { completed = true; finish(); };
    words.onerror = finish;
    try { synth.speak(words); } catch { finish(); }
  });
}
subscribe(() => {
  stopSpeech();
  manifest = undefined;
  voiceIndex = undefined;
  spokenBuffers.clear();
});
