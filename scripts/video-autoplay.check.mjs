// Browser regression test with deterministic YouTube state events.
// VIDEO_PLAYWRIGHT points to an installed Playwright module; VIDEO_URL defaults to local preview.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.VIDEO_PLAYWRIGHT).href);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ body: '<p>Player fixture</p>', contentType: 'text/html' }));
    await page.route('https://www.youtube.com/iframe_api', route => route.fulfill({ contentType: 'text/javascript', body: `
      window.YT = { Player: function(frame, options) {
        window.videoState = data => options.events.onStateChange({data});
        this.destroy = () => frame.remove();
      }}; window.onYouTubeIframeAPIReady();
    ` }));
    await page.goto(process.env.VIDEO_URL ?? 'http://127.0.0.1:5178');
    await page.getByRole('button', { name: 'CONTINUE', exact: true }).click();
    await page.getByLabel("Child's Nickname", { exact: true }).fill('Pal');
    await page.getByRole('button', { name: '1–2 yrs', exact: true }).click();
    await page.getByRole('button', { name: /START/ }).click();
    await page.getByRole('button', { name: 'Open video: I See Something Blue', exact: true }).click();
    await page.waitForFunction(() => typeof window.videoState === 'function');
    await page.evaluate(() => window.videoState(0));
    await page.getByText('Next video in 5 seconds', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cancel autoplay' }).click();
    await page.waitForTimeout(5200);
    assert((await page.locator('iframe').getAttribute('src')).includes('jYAWf8Y91hA'));
    await page.evaluate(() => { window.videoState(1); window.videoState(0); });
    await page.locator('iframe[title="Old MacDonald Had a Farm"]').waitFor({ timeout: 8000 });
    assert((await page.locator('iframe').getAttribute('src')).includes('autoplay=1'));
    await page.evaluate(() => window.videoState(0));
    await page.locator('iframe[title="Animal Sounds"]').waitFor({ timeout: 8000 });
    await page.evaluate(() => window.videoState(0));
    await page.getByText('What does the cow say?', { exact: true }).waitFor();
    assert.equal(await page.locator('iframe').count(), 0);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: cancellation, 5-second next video, Animal Sounds auto quiz, player cleanup`);
    await page.close();
  }
} finally { await browser.close(); }
