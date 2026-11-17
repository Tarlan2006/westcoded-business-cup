import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.VIDEO_PLAYWRIGHT).href);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
try {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion });
    await context.addInitScript(() => {
      localStorage.setItem('mission-control.sound', 'off');
      localStorage.setItem('mission-control.progress', JSON.stringify({ selectedId: 'hold-test', profiles: [{
        id: 'hold-test', codenameId: 'local_codename_comet', ageBand: '6-8', xp: 0, rank: 0, streak: 0,
        lastPlayedISO: '', loreNote: '', activities: {}, preferences: { location: 'home', minutes: 20, first: 'learn', nickname: 'Pal' },
      }] }));
      const startedAt = Date.now();
      localStorage.setItem('mission-control.session', JSON.stringify({ startedAt, sessionEndsAt: startedAt + 20 * 60_000, reminded: false }));
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let transcriptions = 0;
    await page.route('**/api/stt', route => { transcriptions++; return route.fulfill({ json: { text: 'Why is the sky blue?' } }); });
    await page.route('**/api/ask', route => route.fulfill({ json: { answer: 'Light makes the sky look blue.', source: 'faq' } }));
    await page.goto(process.env.VIDEO_URL ?? 'http://127.0.0.1:5178');
    const welcome = page.getByRole('button', { name: 'CONTINUE', exact: true });
    if (await welcome.isVisible()) await welcome.click();
    const parents = page.getByRole('button', { name: 'Parents, press and hold', exact: true });
    await page.locator('.hold-tip').getByText('Press and hold', { exact: true }).waitFor();
    await page.waitForTimeout(3150);
    assert.equal(await page.locator('.hold-tip').count(), 0);
    await parents.tap();
    await page.locator('.hold-tip').waitFor();
    assert.equal(await parents.evaluate(el => getComputedStyle(el).animationName), reducedMotion === 'reduce' ? 'none' : 'hold-shake');
    await page.screenshot({ path: `scripts/.cache/hold-${reducedMotion}.png` });
    await page.waitForTimeout(2100);
    assert.equal(await page.locator('.hold-tip').count(), 0);
    await parents.focus();
    await page.keyboard.down('Enter');
    await page.waitForTimeout(500);
    assert.match(await parents.innerText(), /Keep holding.*s/);
    assert(await parents.evaluate(el => el.classList.contains('hold-pressed')));
    await page.waitForTimeout(1100);
    await page.keyboard.up('Enter');
    const settings = page.getByRole('dialog', { name: 'Session settings' });
    await settings.getByRole('button', { name: 'Keep playing', exact: true }).click();
    assert.equal(await page.locator('.hold-tip').count(), 0);
    await page.locator('.activity-grid').getByRole('button', { name: /Ask AIdos/ }).click();
    const talk = page.locator('button.talk-button');
    await page.getByText('Press and hold to talk', { exact: true }).waitFor();
    await talk.tap();
    await page.getByText('Press and hold to talk', { exact: true }).waitFor();
    await page.waitForTimeout(2100);
    assert.equal(transcriptions, 0);
    await talk.focus();
    await page.keyboard.down('Space');
    await page.waitForTimeout(1000);
    assert.match(await talk.innerText(), /Let go to send/);
    await page.keyboard.up('Space');
    await page.getByText('Light makes the sky look blue.', { exact: true }).waitFor();
    assert.equal(transcriptions, 1);
    await page.getByRole('button', { name: 'Home, back to activities', exact: true }).click();
    await page.locator('.activity-grid').getByRole('button', { name: /Scavenger Hunt/ }).click();
    await page.getByRole('button', { name: 'Start game', exact: true }).click();
    const huntTalk = page.locator('button.talk-button');
    await huntTalk.waitFor();
    await page.waitForFunction(() => !document.querySelector('button.talk-button')?.disabled);
    await huntTalk.tap();
    await page.getByText('Press and hold to talk', { exact: true }).waitFor();
    const exit = page.getByRole('button', { name: 'Hold: Exit', exact: true });
    await exit.tap();
    assert(await page.locator('#screen-mission').isVisible());
    await exit.scrollIntoViewIfNeeded();
    const bounds = await exit.boundingBox();
    const touch = await context.newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
    await page.waitForTimeout(1550);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settings.getByRole('button', { name: 'End session now', exact: true }).click();
    await page.getByRole('heading', { name: 'Session complete', exact: true }).waitFor();
    assert.equal(transcriptions, 1);
    assert.deepEqual(errors, []);
    console.log(`PASS ${reducedMotion}: touch tap hint/shake, first hint/session flag, keyboard hold, progress, voice cancel/send, Hunt hint, touch hold to exit`);
    await context.close();
  }
} finally { await browser.close(); }
