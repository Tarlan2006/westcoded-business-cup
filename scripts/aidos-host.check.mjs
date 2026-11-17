import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.SMOKE_URL ?? 'http://127.0.0.1:5195';
const out = process.env.SMOKE_OUTPUT ?? 'scripts/.cache/host-audit/browser';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => requests.push(new URL(request.url()).pathname));
await page.addInitScript(() => {
  localStorage.setItem('mission-control.sound', 'on');
  Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  window.hostAudioAudit = [];
  const NativeContext = window.AudioContext;
  window.AudioContext = class extends NativeContext {
    constructor(...args) { super(...args); this.addEventListener('statechange', () => window.hostAudioAudit.push(this.state)); }
    createBufferSource() { const source = super.createBufferSource(); const start = source.start.bind(source); source.start = (...args) => { window.hostAudioAudit.push({ start: source.buffer?.duration, state: this.state }); return start(...args); }; return source; }
  };
  let pending;
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    getVoices: () => [{ name: 'Samantha', lang: 'en-US', localService: true }], addEventListener() {},
    speak(utterance) { if (!utterance.text.trim()) return; pending = utterance; setTimeout(() => utterance.onstart?.(), 0); },
    cancel() { pending?.onend?.(); pending = null; },
  } });
});
await page.route('**/api/ask', route => route.fulfill({ json: { answer: 'Wheels turn to help things move.', source: 'faq' } }));
try {
  await page.goto(base);
  await page.getByRole('button', { name: 'CONTINUE', exact: true }).waitFor();
  await page.locator('.aidos-mascot[data-3d]').waitFor();
  await page.screenshot({ path: `${out}/greeting-closed.png`, fullPage: true });
  await page.getByRole('button', { name: 'CONTINUE', exact: true }).click();
  await page.getByLabel('What should AIdos call your child? *', { exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('.aidos-mascot[data-speaking]'), null, { timeout: 5000 });
  const samples = await page.evaluate(async () => {
    const result = [];
    for (let i = 0; i < 22; i++) {
      const el = document.querySelector('.aidos-mascot');
      const r = el.getBoundingClientRect();
      result.push({ mouth: getComputedStyle(el).getPropertyValue('--aid-mouth'), x: r.x, y: r.y, width: r.width, height: r.height });
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    return result;
  });
  assert(new Set(samples.map(s => s.mouth)).size > 1, 'Real recorded speech must change mouth frames');
  assert(samples.every(s => s.x === samples[0].x && s.y === samples[0].y && s.width === samples[0].width && s.height === samples[0].height), 'Speaking must not shift the layout');
  await page.waitForFunction(() => !document.querySelector('.aidos-mascot[data-speaking]'));
  await page.getByLabel('What should AIdos call your child? *', { exact: true }).fill('Pal');
  await page.getByRole('button', { name: '6–8 yrs', exact: true }).click();
  await page.getByRole('button', { name: /START.*FOR/ }).click();
  await page.getByRole('button', { name: 'Home, back to activities', exact: true }).click();
  await page.locator('.activity-grid').getByRole('button', { name: /Ask AIdos/ }).click();
  await page.getByPlaceholder('Type your question').fill('How do wheels work?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.ask-mascot[data-speaking]'));
  await page.screenshot({ path: `${out}/ask-speaking.png`, fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.ask-mascot .aid-body').evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.equal(await page.locator('.ask-mascot .aid-mouth').evaluate(el => getComputedStyle(el).opacity), '1');
  await page.getByRole('button', { name: 'Ask another', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.aidos-mascot[data-speaking]'));
  assert(!requests.some(path => /mascot\/mypal-/.test(path)), 'No legacy mascot request');
  assert.equal(errors.length, 0, errors.join('\n'));
  await writeFile(`${out}/motion.json`, JSON.stringify({ base, samples, errors, passed: true }, null, 2));
  console.log('PASS AIdos 3D, real PCM mouth motion, browser speech, stop, reduced motion, stable placement and current assets');
} catch (error) {
  const audio = await page.evaluate(() => window.hostAudioAudit);
  await writeFile(`${out}/failure.json`, JSON.stringify({ error: String(error), errors, requests, audio }, null, 2));
  await page.screenshot({ path: `${out}/failure.png`, fullPage: true });
  throw error;
} finally { await browser.close(); }
