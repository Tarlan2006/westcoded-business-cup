import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.SMOKE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.SMOKE_OUTPUT ?? 'scripts/.cache/mascot-frames';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
try {
  for (const [lang, width, height] of [['kk', 390, 844], ['en', 1280, 800]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {
      if (r.url().includes('/mascot/') && !r.ok()) errors.push(String(r.status()) + ' ' + r.url());
    });
    await page.addInitScript(lang => {
      localStorage.setItem('mypal.lang', lang);
      localStorage.setItem('mission-control.sound', 'on');
    }, lang);
    await page.goto(base);
    const greeting = page.locator('#screen-greeting');
    const strip = greeting.locator('.aid-frames');
    await strip.waitFor();
    const atlas = await strip.getAttribute('href');
    const dimensions = await page.evaluate(async url => {
      const img = new Image();
      img.src = url;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, atlas);
    assert.deepEqual(dimensions, [960, 1488]);
    async function checkColumns(locator, times, expected) {
      const positions = await locator.evaluate((node, times) => {
        const [animation] = node.getAnimations();
        animation.pause();
        const result = times.map(ms => {
          animation.currentTime = ms;
          return Math.round(new DOMMatrixReadOnly(getComputedStyle(node).transform).m41) || 0;
        });
        animation.play();
        return result;
      }, times);
      assert.deepEqual(positions, expected);
    }
    await checkColumns(strip, [0, 200, 350], [0, -320, -640]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await strip.evaluate(n => n.getAnimations().length), 0);
    await page.screenshot({ path: output + '/' + lang + '-greeting.png' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // Observe the normal setup greeting, including silent intervals in the recording.
    await page.evaluate(() => {
      window.seenMouths = new Set();
      new MutationObserver(() => {
        for (const image of document.querySelectorAll('.aid-frames[data-mouth]')) {
          window.seenMouths.add(image.dataset.mouth);
        }
      }).observe(document.body, { attributes: true, childList: true, subtree: true });
    });
    await greeting.locator('button').last().click();
    await page.waitForFunction(() => window.seenMouths.size === 3);
    await page.waitForFunction(() => !document.querySelector('[data-motion="talk"]'));
    await page.locator('#profileNameInput').fill('Ali');
    await page.locator('[data-age="6-8"]').click();
    await page.locator('.profile-submit').click();
    const video = page.locator('#screen-video');
    await video.waitFor();
    const idle = video.locator('[data-motion="idle"] .aid-frames').first();
    await idle.waitFor();
    await checkColumns(idle, [0, 3660, 3740], [0, -320, -640]);
    await page.goto(base + '/404.html');
    const poster = page.locator('main img');
    await poster.evaluate(img => img.decode());
    assert.match(await poster.getAttribute('src'), /\/frames\/welcome\.webp$/);
    assert.deepEqual(errors, []);
    console.log('PASS', lang, width + '×' + height, 'wave, reduced motion, recorded speech, blink and 404');
    await page.close();
  }
  // Exercise the device voice lifecycle even on hosts without a Kazakh system voice.
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('mission-control.sound', 'on');
    window.SpeechSynthesisUtterance = class {};
    Object.defineProperty(window, 'speechSynthesis', { value: {
      getVoices: () => [{ lang: 'kk-KZ' }],
      speak: words => { window.testUtterance = words; },
      // Some devices omit the end event on cancellation.
      cancel() {}
    } });
  });
  await page.route('**/audio/kk/*.mp3*', route => route.abort());
  await page.goto(base);
  await page.locator('#screen-greeting button').last().click();
  await page.waitForFunction(() => Boolean(window.testUtterance));
  assert.equal(await page.locator('[data-motion="talk"]').count(), 0);
  await page.evaluate(() => window.testUtterance.onstart());
  await page.locator('.aid-frames[data-mouth="2"]').first().waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => {
    const wideMouth = document.querySelector('.aid-frames[data-mouth="2"]');
    return matchMedia('(prefers-reduced-motion: reduce)').matches && wideMouth &&
      new DOMMatrixReadOnly(getComputedStyle(wideMouth).transform).m41 === 0;
  });
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('[data-motion="talk"]'));
  await page.evaluate(() => window.testUtterance.onend());
  assert.equal(await page.locator('[data-motion="talk"]').count(), 0);
  console.log('PASS device voice starts, reduced-motion mouth, cancellation and late end event');
  await page.close();
} finally {
  await browser.close();
}
