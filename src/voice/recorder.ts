const defaultDurationLimit = 8000;
const maxDurationLimit = 15_000;
const sampleRate = 16_000;
const formatChoices = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"];

interface Capture {
  result: Promise<Blob | null>;
  end: () => void;
  limitMs: number;
}

let capture: Capture | undefined;
let opening = false;

export async function startRecording(limitMs = defaultDurationLimit): Promise<void> {
  limitMs = Math.min(maxDurationLimit, Math.max(1000, limitMs));
  if (opening || capture) throw new Error("A recording is already in progress.");
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new Error("Microphone recording is unavailable in this browser.");
  }

  let stream: MediaStream | undefined;
  opening = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    const mimeType = formatChoices.find((format) => MediaRecorder.isTypeSupported(format));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const tracks = stream.getTracks();
    const chunks: Blob[] = [];
    let timeout = 0;
    let failed = false;
    function end() {
      window.clearTimeout(timeout);
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } finally {
        tracks.forEach((track) => track.stop());
      }
    }

    const result = new Promise<Blob | null>((resolve) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        window.clearTimeout(timeout);
        tracks.forEach((track) => track.stop());
        resolve(failed ? null : new Blob(chunks, { type: recorder.mimeType }));
      };
      recorder.onerror = () => {
        failed = true;
        try { end(); } finally { resolve(null); }
      };
    });
    recorder.start();
    timeout = window.setTimeout(end, limitMs);
    capture = { result, end, limitMs };
  } catch {
    stream?.getTracks().forEach((track) => track.stop());
    throw new Error("Microphone unavailable. Use I DID IT! to keep playing.");
  } finally {
    opening = false;
  }
}

export async function stopRecording(): Promise<Blob> {
  const active = capture;
  if (!active) throw new Error("No recording is active.");
  try {
    active.end();
    let timeout = 0;
    const blob = await Promise.race([
      active.result,
      new Promise<null>((resolve) => { timeout = window.setTimeout(() => resolve(null), 1800); }),
    ]).finally(() => window.clearTimeout(timeout));
    if (!blob?.size) throw new Error("No audio was recorded.");

    // The offline context decodes Safari AAC and Chrome Opus at the WAV sample rate.
    const context = new OfflineAudioContext(1, 1, sampleRate);
    const sound = await context.decodeAudioData(await blob.arrayBuffer());
    return encodeWav(sound, active.limitMs);
  } finally {
    capture = undefined;
  }
}

function encodeWav(sound: AudioBuffer, limitMs: number): Blob {
  const length = Math.min(sound.length, Math.floor(sampleRate * (limitMs / 1000)));
  const dataSize = length * 2;
  const wav = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wav);
  view.setUint32(0, 0x52494646); // RIFF
  view.setUint32(4, wav.byteLength - 8, true);
  view.setUint32(8, 0x57415645); // WAVE
  view.setUint32(12, 0x666d7420); // fmt
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461); // data
  view.setUint32(40, dataSize, true);

  const channels = Array.from({ length: sound.numberOfChannels }, (_, index) => sound.getChannelData(index));
  for (let index = 0; index < length; index++) {
    let sum = 0;
    for (const channel of channels) sum += channel[index];
    const sample = Math.max(-1, Math.min(1, sum / channels.length));
    view.setInt16(44 + index * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
  }
  return new Blob([wav], { type: "audio/wav" });
}
