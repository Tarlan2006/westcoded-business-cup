import { readFileSync } from "node:fs";
import { cleanSentence } from "../public/audio/kk/raya-v1/edges-v2.mjs";

// Read a single, mono 16 kHz sentence from Piper as float32 little-endian.
const bytes = readFileSync(0);
if (!bytes.byteLength || bytes.byteLength % 4) throw new Error("Invalid Raya PCM");
const samples = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const cleaned = cleanSentence(samples);
const pcm = Buffer.alloc(cleaned.length * 2);
for (let i = 0; i < cleaned.length; i++) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, cleaned[i])) * 32767), i * 2);
}
process.stdout.write(pcm);
