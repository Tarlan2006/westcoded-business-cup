export async function startRecording(): Promise<void> {
  console.debug("Recording started (mock)");
}

export async function stopRecording(): Promise<Blob> {
  const sampleRate = 16_000;
  const bytesPerSample = 2;
  const dataSize = (sampleRate / 10) * bytesPerSample;
  const wav = new ArrayBuffer(44 + dataSize);
  const bytes = new Uint8Array(wav);
  const view = new DataView(wav);
  const encoder = new TextEncoder();

  // Return 100 ms of silent mono PCM without opening the microphone.
  bytes.set(encoder.encode("RIFF"), 0);
  view.setUint32(4, wav.byteLength - 8, true);
  bytes.set(encoder.encode("WAVEfmt "), 8);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  bytes.set(encoder.encode("data"), 36);
  view.setUint32(40, dataSize, true);

  return new Blob([wav], { type: "audio/wav" });
}
