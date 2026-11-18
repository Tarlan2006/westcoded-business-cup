/// <reference types="node" />

import { deadline, unsafe } from "./safety";
import { Buffer } from "node:buffer";
import { maxTranscriptLength } from "./turn-contract";

const maxSamples = 16_000 * 15;
const maxDataSize = maxSamples * 2;
export const maxWavBytes = maxDataSize + 1024;

export function validWav(wav: ArrayBuffer) {
  if (wav.byteLength < 46 || wav.byteLength > maxWavBytes) return false;
  const header = new DataView(wav);
  if (header.getUint32(0) !== 0x52494646 || header.getUint32(8) !== 0x57415645 ||
    header.getUint32(4, true) !== wav.byteLength - 8) return false;
  let format = false;
  let samples = false;
  let chunks = 0;

  for (let offset = 12; offset + 8 <= wav.byteLength;) {
    if (++chunks > 64) return false;
    const type = header.getUint32(offset);
    const size = header.getUint32(offset + 4, true);
    const start = offset + 8;
    offset = start + size + (size % 2);
    if (offset > wav.byteLength) return false;
    if (type === 0x666d7420) {
      if (format || size < 16 || header.getUint16(start, true) !== 1 ||
        header.getUint16(start + 2, true) !== 1 || header.getUint32(start + 4, true) !== 16_000 ||
        header.getUint32(start + 8, true) !== 32_000 || header.getUint16(start + 12, true) !== 2 ||
        header.getUint16(start + 14, true) !== 16) return false;
      format = true;
    } else if (type === 0x64617461) {
      if (!format || samples || !size || size > maxDataSize || size % 2) return false;
      samples = true;
    }
    if (offset === wav.byteLength) return format && samples;
  }
  return false;
}

export async function recognizeSpeech(ai: Ai, wav: ArrayBuffer, lang: "en" | "kk" = "en"): Promise<string> {
  const audio = Buffer.from(wav).toString("base64");
  const { text } = await deadline(ai.run("@cf/openai/whisper-large-v3-turbo", {
    audio, task: "transcribe", language: lang, vad_filter: true,
  }));
  if (typeof text !== "string") throw new Error("Invalid speech recognition response");
  return unsafe(text) ? "" : text.trim().slice(0, maxTranscriptLength);
}
