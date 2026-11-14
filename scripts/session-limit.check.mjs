import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.VIDEO_PLAYWRIGHT).href);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { const now = Date.now; window.timeOffset = 0; Date.now = () => now() + window.timeOffset; });
    await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ body: 'Player fixture' }));
    await page.route('https://www.youtube.com/iframe_api', route => route.abort());
    await page.goto(process.env.VIDEO_URL ?? 'http://127.0.0.1:5178');
    await page.getByRole('button', { name: 'CONTINUE', exact: true }).click();
    assert.equal(await page.getByText(/Healthy habits|paces missions|Curated science video|Zero passive watching/).count(), 0);
    const custom = page.getByLabel('Custom minutes');
    for (const invalid of ['0', '121', '1.5', '']) {
      await custom.fill(invalid);
      assert.equal(await custom.evaluate(input => input.checkValidity()), false);
    }
    await custom.fill('17');
    await page.getByRole('button', { name: /START SESSION/ }).click();
    await page.getByRole('main', { name: 'Video library' }).waitFor();
    await page.getByRole('button', { name: /Open video:/ }).click();
    assert.equal(await page.locator('iframe').count(), 1);
    await page.evaluate(() => { window.timeOffset = 16 * 60_000; });
    await page.waitForTimeout(400);
    assert.equal(await page.getByRole('heading', { name: 'Time for a break!' }).count(), 0);
    await page.evaluate(() => { window.timeOffset = 17 * 60_000 + 1000; });
    await page.getByRole('heading', { name: 'Time for a break!' }).waitFor();
    assert.equal(await page.locator('iframe').count(), 0);
    await page.getByRole('button', { name: 'Grown-ups: session settings' }).click();
    assert.equal(await page.getByLabel('Custom minutes').inputValue(), '17');
    await page.screenshot({ path: `scripts/.cache/session-setup-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.getByRole('button', { name: '30m', exact: true }).click();
    await page.getByRole('button', { name: 'SAVE SETTINGS', exact: true }).click();
    assert.equal(await page.getByRole('heading', { name: 'Time for a break!' }).count(), 0);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: removed labels, validation, 17-minute limit, stopped player, saved custom value, preset reset`);
    await page.close();
  }
} finally { await browser.close(); }
