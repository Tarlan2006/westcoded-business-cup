/* Dedicated worker. Model files stay on this origin and the text stays on the device. */
const assets = new URL("/voices/raya-v1/", self.location.origin).href;
importScripts(assets + "ort.wasm.min.js", assets + "piper_phonemize.js");

ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = assets;
let session;
let phonemizer;
let sentences;

async function synthesize(text) {
  session ??= await ort.InferenceSession.create(assets + "raya.bin", { executionProviders: ["wasm"] });
  phonemizer ??= await createPiperPhonemize({
    locateFile: name => new URL(name, assets).href,
    print(line) {
      const { phoneme_ids } = JSON.parse(line);
      if (phoneme_ids?.length) sentences.push(phoneme_ids);
    },
  });
  sentences = [];
  phonemizer.callMain(["-l", "kk", "--input", JSON.stringify([{ text }]), "--espeak_data", "/espeak-ng-data"]);
  const chunks = [];
  for (const ids of sentences) {
    const inputs = {
      input: new ort.Tensor("int64", BigInt64Array.from(ids, BigInt), [1, ids.length]),
      input_lengths: new ort.Tensor("int64", BigInt64Array.of(BigInt(ids.length)), [1]),
      scales: new ort.Tensor("float32", Float32Array.of(0.55, 1.08, 0.65), [3]),
    };
    const result = await session.run(inputs);
    const samples = result[session.outputNames[0]].data;
    if (samples.length) chunks.push(samples);
  }
  if (!chunks.length) throw new Error("Empty speech");
  const pause = 1600;
  const length = chunks.reduce((n, samples) => n + samples.length, 0) + (chunks.length - 1) * pause;
  const pcm = new Float32Array(length);
  let offset = 0;
  for (const samples of chunks) {
    pcm.set(samples, offset);
    offset += samples.length + pause;
  }
  return pcm;
}

let queue = Promise.resolve();
self.onmessage = ({ data: { id, text } }) => {
  queue = queue.then(async () => {
    try {
      const pcm = await synthesize(text);
      self.postMessage({ id, pcm }, [pcm.buffer]);
    } catch {
      self.postMessage({ id, error: true });
    }
  });
};
