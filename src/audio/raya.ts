let worker: Worker | undefined;
let sequence = 0;
const jobs = new Map<number, { resolve: (samples: Float32Array<ArrayBuffer>) => void; reject: () => void }>();

function reset() {
  worker?.terminate();
  worker = undefined;
  for (const pending of jobs.values()) pending.reject();
  jobs.clear();
}

export async function synthesizeRaya(text: string, context: AudioContext): Promise<AudioBuffer> {
  if (!worker) {
    worker = new Worker("/audio/kk/raya-v1/synthesis.js?v=2");
    worker.onerror = reset;
    worker.onmessageerror = reset;
    worker.onmessage = ({ data }) => {
      const job = jobs.get(data.id);
      if (!job) return;
      jobs.delete(data.id);
      if (data.pcm instanceof Float32Array && data.pcm.length) job.resolve(data.pcm);
      else job.reject();
    };
  }
  const id = ++sequence;
  const timeout = window.setTimeout(reset, 90000);
  try {
    const samples = await new Promise<Float32Array<ArrayBuffer>>((resolve, reject) => {
      jobs.set(id, { resolve, reject: () => reject(new Error("Kazakh speech unavailable")) });
      worker!.postMessage({ id, text: text.replace(/\bAIdos\b/gi, "Айдос") });
    });
    const buffer = context.createBuffer(1, samples.length, 16000);
    buffer.copyToChannel(samples, 0);
    return buffer;
  } finally {
    window.clearTimeout(timeout);
    jobs.delete(id);
  }
}
