import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = process.env.VIDEO_PLAYWRIGHT
  ? await import(pathToFileURL(process.env.VIDEO_PLAYWRIGHT).href)
  : await import('playwright');
const base = process.env.SMOKE_URL ?? 'https://aidos.nexcel.kz';
const output = process.env.SMOKE_OUTPUT ?? 'docs/screens';
const mock = process.env.SMOKE_MOCK_API === '1';
const sizes = (process.env.SMOKE_SIZES ?? '390x844,768x1024,1280x900,844x390').split(',').map(s => s.split('x').map(Number));
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), headless: true });
const report = { base, mockAPI: mock, fontScale: Number(process.env.SMOKE_FONT_SCALE ?? 1), youtube: 'embed URL and failure UI only; playback is not simulated as verified', screens: [], errors: [], console: [], network: [] };
await mkdir(output, { recursive: true });
const privateMarker = 'PRIVATE_PARENT_NOTE_7D31';
async function shot(page, name, size) {
  await page.waitForFunction(() => ![...document.querySelectorAll('[role="status"]')].some(el => el.getClientRects().length && /Getting things ready|Opening Balloon Count|Opening Space Scale/.test(el.textContent)));
  await page.evaluate(() => document.fonts.ready);
  const previousScroll = await page.evaluate(() => scrollY);
  for (const mascot of await page.locator('.aidos-mascot:visible').all()) {
    if (await mascot.evaluate(el => !!el.closest('[inert],[hidden]'))) continue;
    await mascot.scrollIntoViewIfNeeded();
    await mascot.locator('canvas').waitFor();
    await mascot.and(page.locator('[data-ready=true]')).waitFor();
  }
  await page.evaluate(y => window.scrollTo(0, y), previousScroll);
  await page.screenshot({ path: `${output}/${name}-${size}.png`, fullPage: true });
  const layout = await page.evaluate(() => {
    const visible = el => el.getClientRects().length && !el.closest('[hidden],[inert]');
    return {
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      oldBrand: /MyPal|Bleep/i.test(document.body.innerText),
      mascots: [...document.querySelectorAll('.aidos-mascot')].filter(visible).map(el => {
        const box = el.getBoundingClientRect();
        const art = el.querySelector('.aid-frames').getBoundingClientRect();
        return { pose: el.dataset.pose, loaded: el.dataset.ready === 'true', contained: art.left >= box.left - 3 && art.right <= box.right + 3, width: box.width, height: box.height };
      }),
      headings: [...document.querySelectorAll('h1')].filter(visible).map(el => el.textContent),
      smallTargets: [...document.querySelectorAll('button,a,input,select')].filter(visible).filter(el => {
        const target = el instanceof HTMLInputElement && ['checkbox', 'radio'].includes(el.type) ? el.labels?.[0] ?? el : el;
        const r = target.getBoundingClientRect(); return r.width < 44 || r.height < 44;
      }).map(el => ({ text: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 60), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) })),
    };
  });
  report.screens.push({ name, size, ...layout });
}
async function home(page) {
  const more = page.getByRole('button', { name: 'More games', exact: true });
  if (await more.isVisible()) await more.click();
  else await page.getByRole('button', { name: 'Home, back to activities', exact: true }).first().click();
  const leave = page.getByRole('button', { name: 'Leave game', exact: true });
  if (await leave.isVisible()) await leave.click();
  await page.locator('.flow-start').waitFor();
}
async function tile(page, title) { await page.locator('.activity-grid').getByRole('button', { name: new RegExp(title) }).click(); }
async function hold(button) { await button.focus(); await button.press('Enter', { delay: 1600 }); }
async function setup(page, age, name = 'AuditPal') {
  await page.getByLabel('What should AIdos call your child? *', { exact: true }).fill(name);
  await page.getByRole('button', { name: age, exact: true }).click();
  await page.getByLabel("Child's interests (Optional)", { exact: true }).fill(privateMarker);
  await page.getByRole('button', { name: /START.*FOR/ }).click();
}
try {
  for (const [width, height] of sizes) {
    const size = `${width}x${height}`;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 900, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      localStorage.setItem('mypal.lang', 'en');
      localStorage.setItem('mission-control.sound', 'off');
      const original = Date.now; window.auditOffset = 0; Date.now = () => original() + window.auditOffset;
    });
    if (process.env.SMOKE_FONT_SCALE) await context.addInitScript(scale => {
      document.addEventListener('DOMContentLoaded', () => document.documentElement.style.fontSize = (16 * scale) + 'px');
    }, Number(process.env.SMOKE_FONT_SCALE));
    const page = await context.newPage();
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) report.console.push({size, type: message.type(), text: message.text().slice(0, 300)}); });
    page.on('pageerror', error => report.errors.push({ size, message: error.message }));
    page.on('request', request => {
      if (!new URL(request.url()).pathname.startsWith('/api/')) return;
      const body = request.postData() ?? '';
      report.network.push({ path: new URL(request.url()).pathname, privateData: body.includes(privateMarker) || body.includes('AuditPal'), keys: request.headers()['content-type']?.includes('json') ? Object.keys(JSON.parse(body || '{}')) : ['binary audio'] });
    });
    if (mock) {
      await page.route('**/api/ask', route => route.fulfill({ json: { answer: 'Light makes the sky look blue.', source: 'faq' } }));
      await page.route('**/api/turn', route => route.fulfill({ status: 503, json: { error: 'Please try again.' } }));
    }
    await page.goto(base);
    await page.getByRole('button', { name: 'CONTINUE', exact: true }).waitFor();
    await shot(page, 'greeting', size);
    await page.getByRole('button', { name: 'CONTINUE', exact: true }).click();
    const start = page.getByRole('button', { name: /START.*FOR/ });
    await start.waitFor(); assert(await start.isDisabled());
    await page.getByLabel('What should AIdos call your child? *', { exact: true }).fill('   '); assert(await start.isDisabled());
    await shot(page, 'setup', size);
    await setup(page, '6–8 yrs');
    await page.getByRole('main', { name: 'Video library' }).waitFor();
    await shot(page, 'video', size);
    await page.getByRole('button', { name: /Open video:/ }).click();
    assert((await page.locator('iframe').getAttribute('src')).includes('youtube-nocookie.com'));
    await page.getByRole('button', { name: /Play with AIdos Now/ }).click();
    for (let i = 0; i < 3; i++) {
      if (!i) await shot(page, 'quiz', size);
      await page.locator('[aria-label="Quick replies"]').getByRole('button').first().click();
      await page.getByRole('button', { name: i === 2 ? 'Finish quiz' : 'Next question', exact: true }).click();
    }
    await page.locator('#screen-complete').waitFor(); await shot(page, 'complete', size);
    await page.getByRole('button', { name: 'More games', exact: true }).click();
    await shot(page, 'hub', size);
    await page.getByRole('button', { name: /Garage/ }).click(); await shot(page, 'garage', size);
    await page.getByRole('button', { name: 'AWESOME!', exact: true }).click();
    assert.equal(await page.locator('.activity-grid').getByRole('button', { name: /Balloon Count/ }).count(), 0);
    await page.reload(); await page.locator('.flow-start').waitFor();
    assert(await page.evaluate(() => !!JSON.parse(localStorage.getItem('mission-control.session'))?.sessionEndsAt));
    await hold(page.getByRole('button', { name: 'Parents, press and hold', exact: true }));
    await page.getByRole('dialog').waitFor(); await shot(page, 'parents-dialog', size);
    await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
    for (const [title, name] of [['Memory', 'memory'], ['Tic-tac-toe', 'tictactoe'], ['Space Scale', 'space'], ['Sketch Artist', 'sketch']]) {
      await tile(page, title); await page.getByRole('heading', { level: 1 }).first().waitFor();
      // Nested lazy modules can briefly replace the previous screen's heading.
      if (name === 'space') await page.getByRole('button', { name: /Start exploring/ }).waitFor();
      if (name === 'sketch') await page.getByRole('button', { name: /Start the case/ }).waitFor();
      await shot(page, name, size);
      if (name === 'memory') { await page.getByRole('button', { name: 'Hidden card 1', exact: true }).click(); }
      if (name === 'tictactoe') { await page.getByRole('button', { name: 'Row 1, column 1, empty', exact: true }).click(); }
      if (name === 'space') { await page.getByRole('button', { name: /Start exploring/ }).click(); await shot(page, 'space-journey', size); }
      if (name === 'sketch') {
        await page.getByRole('button', { name: /Start the case/ }).click(); await shot(page, 'sketch-canvas', size);
        await page.getByRole('button', { name: /I'm done/ }).click(); await page.getByRole('button', { name: /Save my picture/ }).waitFor();
        await shot(page, 'sketch-reveal', size);
        const download = page.waitForEvent('download'); await page.getByRole('button', { name: /Save my picture/ }).click(); assert((await download).suggestedFilename().endsWith('.png'));
      }
      await home(page);
    }
    const upcoming = page.getByRole('region', { name: 'Coming soon' });
    assert.deepEqual(await upcoming.locator('h3').allTextContents(), ['Dino Dig', 'Music Band', 'Story Quest']);
    assert.equal(await upcoming.locator('li[aria-disabled=true]').count(), 3);
    assert.equal(await upcoming.locator('button, a, [tabindex]').count(), 0);
    await tile(page, 'Scavenger Hunt'); await shot(page, 'mission-setup', size);
    await page.getByRole('button', { name: 'Start game', exact: true }).click();
    await page.getByRole('button', { name: /I DID IT/ }).waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('I DID IT') && !b.disabled));
    await shot(page, 'mission', size);
    await page.getByRole('button', { name: /I DID IT/ }).click();
    await page.waitForTimeout(3500);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await shot(page, 'mission-paused', size);
    await page.getByRole('button', { name: 'End mission', exact: true }).click();
    await page.locator('#screen-complete').waitFor(); await page.locator('.flow-next-grid button').first().waitFor(); await shot(page, 'mission-result', size); await home(page);
    await tile(page, 'Ask AIdos'); await page.getByPlaceholder('Type your question').waitFor(); await shot(page, 'ask', size);
    await page.getByPlaceholder('Type your question').fill('Why is the sky blue?'); await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await page.getByRole('button', { name: 'Ask another', exact: true }).waitFor(); await shot(page, 'ask-answer', size);
    await page.getByRole('button', { name: 'Ask another', exact: true }).click();
    // Permission refusal, without recording real audio.
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError'); }; });
    await page.locator('button.talk-button').focus(); await page.keyboard.down('Space'); await page.waitForTimeout(500); await page.keyboard.up('Space');
    await page.getByText('Type your question', { exact: true }).waitFor(); await shot(page, 'ask-mic-denied', size);
    await page.unroute('**/api/ask'); await context.setOffline(true); await page.getByPlaceholder('Type your question').fill('Why is the sky blue?'); await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await page.getByRole('button', { name: 'Ask another', exact: true }).waitFor(); await context.setOffline(false); await home(page);
    // Expiry including the documented 30-second finish grace; reload cannot restart it.
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('mission-control.session')); window.auditOffset = s.sessionEndsAt - Date.now() + 31_000; });
    await page.getByRole('heading', { name: 'Session complete', exact: true }).waitFor(); await shot(page, 'session-complete', size);
    await page.reload(); await page.getByRole('heading', { name: 'Session complete', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await shot(page, 'setup-again', size);
    await setup(page, '3–5 yrs'); await page.getByRole('main', { name: 'Video library' }).waitFor(); await home(page);
    assert.equal(await page.locator('.activity-grid').getByRole('button', { name: /Memory/ }).count(), 1);
    await page.evaluate(() => {
      const progress = JSON.parse(localStorage.getItem('mission-control.progress'));
      const profile = progress.profiles.find(p => p.id === progress.selectedId) ?? progress.profiles[0];
      profile.preferences = { ...profile.preferences, first: 'learn', needs: ['science'], interests: ['Space'] };
      localStorage.setItem('mission-control.progress', JSON.stringify(progress));
    });
    await page.reload(); await page.locator('.flow-start').waitFor();
    assert(!(await page.locator('.flow-start').innerText()).includes('Space Scale'));
    await shot(page, 'hub-science-3-5', size);
    await tile(page, 'Balloon Count'); await shot(page, 'balloons', size);
    await home(page); await hold(page.getByRole('button', { name: 'Parents, press and hold', exact: true })); await page.getByRole('button', { name: 'End session now', exact: true }).click();
    await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await setup(page, '1–2 yrs');
    await page.locator('#screen-toddler-cinema').waitFor(); await shot(page, 'toddler-video', size);
    await page.goto(`${base}/privacy`); await page.getByRole('heading', { name: 'Privacy', exact: true }).waitFor(); await shot(page, 'privacy', size);
    await page.goto(`${base}/missing-audit-page`); await page.getByRole('link', { name: 'Home', exact: true }).waitFor(); await shot(page, '404', size);
    await context.close(); console.log(`PASS flow ${size}`);
  }
  assert(report.network.every(r => !r.privateData), 'Private parent/child data left the browser');
  assert(report.network.filter(r => r.path === '/api/ask').every(r => JSON.stringify(r.keys.sort()) === '["lang","question"]'), 'Ask sends the question and its language');
  assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
  assert(report.screens.every(s => !s.oldBrand), 'Old brand visible');
  assert(report.screens.every(s => s.mascots.every(m => m.loaded && m.contained)), 'Mascot missing or outside its frame');
  assert(report.screens.every(s => !s.overflow), 'Horizontal overflow: ' + report.screens.filter(s=>s.overflow).map(s=>s.name+' '+s.size));
  assert(report.screens.every(s => s.headings.length === 1), 'Each screen must have one visible h1');
  assert(report.screens.every(s => !s.smallTargets.length), 'Touch target smaller than 44px');
} catch (error) {
  report.failure = String(error.stack ?? error);
  for (const context of browser.contexts()) for (const page of context.pages()) await page.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
  process.exitCode = 1;
  console.error(error.message);
} finally {
  await writeFile(`${output}/smoke-report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
