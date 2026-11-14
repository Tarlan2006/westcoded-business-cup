import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { chromium } = await import(process.env.BALLOONS_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.BALLOONS_PLAYWRIGHT_MODULE).href : "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.BALLOONS_CHROME ? { executablePath: process.env.BALLOONS_CHROME } : {}) });
const base = process.env.BALLOONS_PREVIEW_URL ?? "http://127.0.0.1:5174/dev/balloons-preview.html";
const output = resolve(process.env.FLOW_SCREEN_DIR ?? "src/games/balloons/screens");
await mkdir(output, { recursive: true });
const results = [], errors = [], network = [];
const pass = (message) => { results.push(message); console.log(`PASS ${message}`); };
async function open(width, age, reducedMotion = "reduce") {
  const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 720 }, hasTouch: width === 390, reducedMotion });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.getByRole("button", { name: "I COUNTED!" }).waitFor();
  await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("button", { name: `Ages ${age}`, exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(await page.evaluate(() => [...document.fonts].filter((font) => font.status === 'error').map((font) => font.family)), [], 'bundled fonts load without fallback');
  page.on("request", (request) => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  return { page, context };
}
async function checkLayout(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const small = await page.locator('.bl-game button:visible').evaluateAll((nodes) => nodes.filter((node) => {
    const box = node.getBoundingClientRect(); return box.width < 43.9 || box.height < 43.9;
  }).map((node) => node.getAttribute('aria-label') || node.textContent));
  assert.deepEqual(small, [], "all controls >=44px");
  const controls = page.locator('.bl-game button:visible:not(:disabled):not([aria-disabled="true"])');
  await page.locator('[data-bl-tab]').evaluateAll((nodes) => nodes.forEach((node) => node.removeAttribute('data-bl-tab')));
  await controls.evaluateAll((nodes) => nodes.forEach((node, i) => node.dataset.blTab = String(i)));
  await page.locator('body').evaluate((node) => { node.tabIndex = -1; node.focus(); });
  const reached = new Set();
  for (let i = 0; i < 60 && reached.size < await controls.count(); i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => document.activeElement?.getAttribute('data-bl-tab'));
    if (id !== null) reached.add(id);
  }
  assert.equal(reached.size, await controls.count(), "every game button reachable by keyboard");
}
async function shot(page, label, width) {
  await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
  await page.locator('.bl-game:visible').screenshot({ path: resolve(output, `${label}-${width}.png`) });
}
async function answer(page, count, correct) {
  const candidates = await page.locator('.bl-answer').allTextContents();
  assert.equal(new Set(candidates.map((n) => Number(n.trim()))).size, 4);
  const value = correct ? count : Number(candidates.find((n) => Number(n.trim()) !== count));
  await page.getByRole('button', { name: String(value), exact: true }).click();
  assert.equal(await page.locator('.bl-answer[data-result="correct"]').textContent(), `${count}✓`);
  assert.equal(await page.locator('.bl-answer[data-result="wrong"]').count(), Number(!correct));
  const before = await page.locator('.bl-xp').innerText();
  await page.locator('.bl-answer').first().evaluate((button) => { button.click(); button.click(); });
  assert.equal(await page.locator('.bl-xp').innerText(), before, "duplicate answers do not change score");
}

try {
  for (const width of [390, 1280]) for (const age of ["3-5", "6-8"]) {
    const { page, context } = await open(width, age);
    let previous = 0;
    for (let round = 0; round < 5; round++) {
      const balloons = page.locator('.bl-balloon');
      const count = await balloons.count();
      assert(count !== previous); previous = count;
      assert(count >= (age === '3-5' ? 3 : 6) && count <= (age === '3-5' ? 8 : 15));
      if (round >= 3 && age === '6-8') assert(count >= 12);
      await checkLayout(page);
      if (age === '6-8' && round === 4) await shot(page, 'older-look-last-round', width);
      if (!round) {
        const positions = await page.locator('.bl-position').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('style')));
        if (age === '3-5') await shot(page, 'look', width);
        if (width === 390) await balloons.nth(0).tap(); else await balloons.nth(0).click();
        await balloons.nth(1).click();
        assert.deepEqual(await page.locator('.bl-marker').allTextContents(), ['1', '2']);
        if (age === '3-5') await shot(page, 'marked', width);
        await balloons.nth(0).click();
        assert.deepEqual(await page.locator('.bl-marker').allTextContents(), ['1']);
        await page.clock.runFor(1000);
        assert.deepEqual(await page.locator('.bl-position').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('style'))), positions);
        assert.equal(await page.locator('.bl-balloon').first().evaluate((node) => getComputedStyle(node).animationName), 'none');
      }
      const duration = age === '3-5' || round >= 3 ? 12 : 10;
      if (round === 1) await page.clock.runFor(duration * 1000);
      else await page.getByRole('button', { name: 'I COUNTED!' }).click();
      assert.equal(await page.locator('.bl-game').getAttribute('data-stage'), 'fading');
      assert.equal(await balloons.count(), count, "balloons remain for the fade");
      await page.clock.runFor(399);
      assert.equal(await page.locator('.bl-game').getAttribute('data-stage'), 'fading');
      await page.clock.runFor(1);
      assert.equal(await balloons.count(), 0, "balloons disappear after 400ms");
      await checkLayout(page);
      if (!round && age === '3-5') await shot(page, 'answer', width);
      const correct = round % 2 === 0;
      await answer(page, count, correct); await checkLayout(page);
      if (age === '3-5' && round < 2) await shot(page, correct ? 'correct' : 'oops', width);
      if (age === '6-8' && round === 4) await shot(page, 'older-last-round', width);
      await page.getByRole('button', { name: 'NEXT ROUND' }).click();
    }
    assert.equal(await page.locator('.bl-final h2').innerText(), 'You counted 3 of 5!');
    assert.equal(await page.locator('.bl-earned').innerText(), '+20 XP');
    assert.equal(await page.locator('.bl-stars [data-earned="true"]').count(), 3);
    await checkLayout(page);
    if (age === '3-5') await shot(page, 'final', width);
    await page.getByRole('button', { name: 'DONE', exact: false }).evaluate((button) => { button.click(); button.click(); });
    assert.equal(await page.locator('.bl-preview-message').innerText(), 'onComplete(20)');
    assert(await page.getByRole('button', { name: 'DONE', exact: false }).isDisabled());
    await page.getByRole('button', { name: 'Play again', exact: false }).click();
    assert.equal(await page.locator('.bl-game').getAttribute('data-stage'), 'look');
    assert.equal(await page.locator('.bl-marker').count(), 0);
    assert.match(await page.locator('.bl-round').innerText(), /Round 1 of 5/);
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    assert.match(await page.locator('.bl-preview-message').innerText(), /Back pressed/);
    await page.clock.runFor(60_000);
    assert.equal(await page.locator('.bl-game').count(), 0, "unmounted game has no late result");
    assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
    await context.close(); pass(`${width}px ${age}: five rounds, marks/unmark/renumber, stable geometry, timer, 400ms fade, early count, correct/wrong answers, 20 XP, replay, Home, keyboard and no overflow`);
  }
  // Test callback deduplication and optional voice with a real host mounted through Vite.
  assert.deepEqual(network, [], "no gameplay HTTP requests in the standalone preview");
  const { page, context } = await open(1280, '6-8', 'no-preference');
  await page.evaluate(async () => {
    const { mountTestHost } = await import('/src/games/balloons/testHost.tsx');
    const fixture = document.createElement('div'); document.body.appendChild(fixture);
    document.getElementById('bl-preview-root').hidden = true;
    window.__balloonEvents = [];
    mountTestHost(fixture, window.__balloonEvents);
  });
  // Scope to the new, visible game; the old dev mount is hidden.
  const game = page.locator('.bl-game:visible');
  await game.locator('.bl-balloon').first().waitFor();
  const fixtureModuleLoads = network.splice(0);
  assert(fixtureModuleLoads.every((url) => /\/node_modules\/|\/src\/games\/balloons\//.test(url)));
  assert.equal(await game.locator('.bl-balloon').first().evaluate((node) => getComputedStyle(node).animationName), 'bl-bob');
  for (const allCorrect of [false, true]) {
    for (let round = 0; round < 5; round++) {
      const count = await game.locator('.bl-balloon').count();
      await game.getByRole('button', { name: 'I COUNTED!' }).click(); await page.clock.runFor(400);
      const candidates = await game.locator('.bl-answer').allTextContents();
      const value = allCorrect ? count : Number(candidates.find((n) => Number(n.trim()) !== count));
      await game.getByRole('button', { name: String(value), exact: true }).click();
      await game.getByRole('button', { name: 'NEXT ROUND' }).click();
    }
    assert.equal(await game.locator('.bl-earned').innerText(), allCorrect ? '+28 XP' : '+8 XP');
    await shot(page, allCorrect ? 'final-perfect' : 'final-encouraging', 1280);
    await game.getByRole('button', { name: 'DONE', exact: false }).evaluate((button) => { button.click(); button.click(); });
    assert.equal(await page.evaluate(() => window.__balloonEvents.filter(([kind]) => kind === 'complete').length), allCorrect ? 2 : 1);
    await game.getByRole('button', { name: 'Play again', exact: false }).click();
  }
  assert((await page.evaluate(() => window.__balloonEvents.filter(([kind]) => kind === 'speak').length)) >= 20);
  await game.getByRole('button', { name: 'Back', exact: false }).click();
  assert.equal(await page.evaluate(() => window.__balloonEvents.filter(([kind]) => kind === 'back').length), 1);
  await context.close();
  assert.deepEqual(network, [], "no requests after the host fixture has loaded");
  assert.deepEqual(errors, []);
  pass('0/5 and 5/5 results: 8 and 28 XP; onComplete once per run; throwing optional speech is safe; normal/reduced motion; no game API, uploads or storage writes');
  await writeFile(resolve(output, 'verification.json'), JSON.stringify({ results, browserErrors: errors, gameplayRequests: network, testFixtureModuleLoads: fixtureModuleLoads, physicalPhoneTested: false }, null, 2) + '\n');
} finally { await browser.close(); }
