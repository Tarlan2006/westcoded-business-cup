import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve("dist/client");
const mime = { ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".mp3": "audio/mpeg" };
const server = createServer(async (request, response) => {
  const path = resolve(root, "." + new URL(request.url, "http://localhost").pathname);
  if (path === root) {
    response.writeHead(200, { "Content-Type": "text/html" }).end("<!doctype html><title>Voice check</title>");
    return;
  }
  try {
    assert(path.startsWith(root + sep));
    const data = await readFile(path);
    response.writeHead(200, { "Content-Type": mime[extname(path)] ?? "application/octet-stream" }).end(data);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch({executablePath: process.env.CHROME_PATH});
  const page = await browser.newPage();
  await page.goto(process.env.SMOKE_URL || "http://127.0.0.1:" + server.address().port);
  const report = await page.evaluate(async () => {
    const json = async name => (await fetch("/audio/kk/" + name)).json();
    const [manifest, index] = await Promise.all([json("manifest.json"), json("voice-index.json")]);
    if (manifest.voice !== "kk-raya-v2" || index.voice !== manifest.voice) throw Error("Wrong Kazakh voice metadata");
    const files = [...new Set(Object.values(index.texts))];
    const clipFiles = new Set(Object.values(manifest.clips));
    if (files.length !== clipFiles.size || !files.every(path => clipFiles.has(path))) throw Error("Recording indexes disagree");
    function checkEdges(pcm, rate, label) {
      const n = Math.round(rate * 0.025);
      for (const segment of [pcm.subarray(0, n), pcm.subarray(pcm.length - n)]) {
        const rms = Math.sqrt(segment.reduce((sum, sample) => sum + sample * sample, 0) / segment.length);
        if (!(rms < 0.001)) throw Error("Noisy sentence edge: " + label + " RMS " + rms);
      }
    }
    const context = new AudioContext();
    for (const path of files) {
      const response = await fetch(path);
      if (!response.ok) throw Error("Missing " + path);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      checkEdges(buffer.getChannelData(0), buffer.sampleRate, path);
      if (buffer.duration < 0.12 || !buffer.getChannelData(0).some(x => Math.abs(x) > 0.02)) throw Error("Silent " + path);
    }
    await context.close();
    const worker = new Worker("/audio/kk/raya-v1/synthesis.js?v=2");
    try {
      const durations = [];
      for (const [id, text] of ["Бүгін аспанда қанша бұлт бар екен?", "Кішкентай досым, бірге гүл салайық."].entries()) {
        if (index.texts[text]) throw Error("Test sentence is already recorded");
        const pcm = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(Error("Synthesis timed out")), 90000);
          worker.onerror = event => { clearTimeout(timeout); reject(Error(event.message)); };
          worker.onmessage = ({data}) => { clearTimeout(timeout); data.error ? reject(Error("Raya synthesis failed")) : resolve(data.pcm); };
          worker.postMessage({id, text});
        });
        if (!(pcm instanceof Float32Array) || pcm.length < 8000 || !pcm.some(x => Math.abs(x) > 0.02)) throw Error("Invalid synthesized speech");
        checkEdges(pcm, 16000, text);
        durations.push(pcm.length / 16000);
      }
      return { count: Object.keys(manifest.clips).length, files, durations };
    } finally { worker.terminate(); }
  });
  const onDisk = (await readdir(resolve(root, "audio/kk"))).filter(name => name.endsWith(".mp3")).sort();
  assert.deepEqual(onDisk, report.files.map(path => path.split("/").pop()).sort(), "Stale clips in release");
  console.log(report.count, "Kazakh clip IDs;", onDisk.length, "non-silent recordings; two new replies in seconds", report.durations);
} finally {
  await browser?.close();
  server.close();
}
