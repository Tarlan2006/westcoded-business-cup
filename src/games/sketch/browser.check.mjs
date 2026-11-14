/** Optional developer-only check. Uses an existing Playwright installation, not a game dependency. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const playwrightModule = process.env.SKETCH_PLAYWRIGHT_MODULE;
const { chromium } = await import(playwrightModule ? pathToFileURL(playwrightModule).href : "playwright");
const base = process.env.SKETCH_PREVIEW_URL ?? "http://127.0.0.1:5174/dev/sketch-preview.html";
const output = fileURLToPath(new URL("./screens/", import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.SKETCH_CHROME ? { executablePath: process.env.SKETCH_CHROME } : {}) });
const report = [];
const errors = [];
const network = [];
function pass(message) { report.push(message); console.log(`PASS ${message}`); }
async function opened(width, touch = false, fallback = false, speech = false) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: touch ? 2 : 1, hasTouch: touch, isMobile: touch, reducedMotion: "reduce", acceptDownloads: true });
  if (fallback) await context.addInitScript(() => {
    const NativeImage = window.Image;
    window.Image = class extends NativeImage {
      set src(value) {
        if (value.startsWith("data:image/svg+xml")) queueMicrotask(() => this.dispatchEvent(new Event("error")));
        else super.src = value;
      }
      get src() { return super.src; }
    };
  });
  if (speech) await context.addInitScript(() => {
    window.__spokenClues = [];
    Object.defineProperty(window, "speechSynthesis", { value: {
      getVoices: () => [{ localService: true, lang: "en-US" }], cancel() {},
      speak(value) { window.__spokenClues.push(value.text); setTimeout(() => value.onend?.(), 0); },
    } });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}${speech ? "" : "?text=1"}`);
  await page.getByRole("button", { name: "Start the case" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  page.on("request", (request) => { if (/^https?:/.test(request.url())) network.push({ url: request.url(), type: request.resourceType() }); });
  return { context, page };
}
async function assertLayout(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal page overflow");
  const buttons = await page.locator(".sk-game button:visible").evaluateAll((nodes) => nodes.map((node) => ({ label: node.textContent || node.getAttribute("aria-label"), width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })));
  for (const button of buttons) assert(button.width >= 48 && button.height >= 48, `48px tap target: ${JSON.stringify(button)}`);
}
async function line(page, points) {
  const canvas = page.locator(".sk-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  const xy = ([x, y]) => [bounds.x + x / 400 * bounds.width, bounds.y + y / 500 * bounds.height];
  await page.mouse.move(...xy(points[0])); await page.mouse.down();
  for (const point of points.slice(1)) await page.mouse.move(...xy(point), { steps: 3 });
  await page.mouse.up();
}
async function sketch(page) {
  await page.getByRole("button", { name: "Green pencil", exact: true }).click();
  await page.getByRole("button", { name: "Thick brush", exact: true }).click();
  for (let y = 90; y < 196; y += 18) {
    const half = Math.sqrt(Math.max(0, 58 ** 2 - (y - 143) ** 2));
    await line(page, [[195 - half, y], [195 + half, y]]);
  }
  for (let y = 220; y < 335; y += 18) await line(page, [[158, y], [233, y]]);
  await line(page, [[165, 215], [120, 245], [96, 276]]);
  await line(page, [[227, 219], [260, 228], [286, 262]]);
  await line(page, [[170, 331], [162, 405], [135, 421]]);
  await line(page, [[215, 333], [224, 405], [251, 419]]);
  await line(page, [[236, 337], [276, 361], [320, 351], [338, 321], [322, 307], [301, 315], [312, 329]]);
  await page.getByRole("button", { name: "Yellow pencil", exact: true }).click();
  await line(page, [[155, 257], [235, 257]]);
  await line(page, [[243, 219], [279, 260], [250, 258]]);
  await page.getByRole("button", { name: "Ink pencil", exact: true }).click();
  await page.getByRole("button", { name: "Thin brush", exact: true }).click();
  for (const x of [166, 224]) {
    const circle = Array.from({ length: 17 }, (_, i) => [x + 23 * Math.cos(i * Math.PI / 8), 133 + 23 * Math.sin(i * Math.PI / 8)]);
    await line(page, circle);
  }
  await line(page, [[166, 175], [179, 186], [195, 190], [211, 184], [222, 173]]);
}
async function finish(page) {
  const start = Date.now();
  await page.getByRole("button", { name: "I'm done" }).click();
  await page.getByRole("heading", { name: "Comparing...", exact: true }).waitFor();
  await page.locator(".sk-match").waitFor();
  assert(Date.now() - start >= 1200, "comparison is visibly delayed");
}
async function tickAll(page) { for (const box of await page.getByRole("checkbox").all()) await box.check(); }

try {
  const { page, context } = await opened(1280);
  await assertLayout(page);
  await page.screenshot({ path: resolve(output, "intro-1280.png"), fullPage: true });
  await page.getByRole("button", { name: "Start the case" }).click();
  assert(await page.getByRole("button", { name: "Hear it" }).isDisabled());
  assert(await page.getByRole("button", { name: "I'm done" }).isEnabled());
  await assertLayout(page);
  const blank = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL());
  for (let i = 0; i < 24; i++) await line(page, [[30 + i * 12, 90], [30 + i * 12, 100]]);
  for (let i = 0; i < 24; i++) await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL()), blank);
  pass("24 strokes can all be undone to the original white canvas");
  await line(page, [[180, 230], [220, 230]]);
  const beforeClear = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL());
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL()), beforeClear);
  pass("Resizing preserves the original strokes and their proportions");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Keep drawing" }).click();
  assert.equal(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL()), beforeClear);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Yes, clear" }).click();
  assert.equal(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL()), blank);
  pass("Clear confirmation preserves or removes the drawing correctly");
  await line(page, [[200, 200], [200, 300]]);
  const beforeErase = await page.locator("canvas").evaluate((canvas) => canvas.toDataURL());
  await page.getByRole("button", { name: "Eraser", exact: true }).click();
  await page.getByRole("button", { name: "Thick brush" }).click();
  await line(page, [[180, 250], [220, 250]]);
  assert(await page.locator("canvas").evaluate((canvas) => {
    const pixel = canvas.getContext("2d").getImageData(Math.round(canvas.width / 2), Math.round(canvas.height / 2), 1, 1).data;
    return pixel[0] === 255 && pixel[1] === 255 && pixel[2] === 255;
  }));
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await page.locator("canvas").evaluate((canvas) => canvas.toDataURL()), beforeErase);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Yes, clear" }).click();
  pass("Eraser paints white and can be undone as a stroke");
  await sketch(page);
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Next clue" }).click();
  assert.equal(await page.locator(".sk-clue-list li").count(), 5);
  assert(await page.getByRole("button", { name: "All clues read" }).isDisabled());
  assert(await page.locator(".sk-ready").isVisible());
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, "drawing-1280.png"), fullPage: true });
  await finish(page);
  assert.match(await page.locator(".sk-breakdown").innerText(), /Colors & shape \d+% · Clues 0%/);
  const initialMatch = Number((await page.locator(".sk-match strong").innerText()).replace("%", ""));
  await tickAll(page);
  const finalMatch = Number((await page.locator(".sk-match strong").innerText()).replace("%", ""));
  assert(finalMatch > initialMatch && finalMatch <= 100);
  const xp = Math.round(finalMatch / 100 * 24) + 4;
  assert((await page.locator(".sk-xp").innerText()).includes(`${xp} XP`));
  await page.screenshot({ path: resolve(output, "reveal-1280.png"), fullPage: true });
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save my picture" }).click();
  const download = await downloaded;
  assert.equal(download.suggestedFilename(), "my-sketch-gecko_hero.png");
  const png = await readFile(await download.path());
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  pass("PNG download has a valid PNG signature");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  assert((await page.locator(".sk-preview-message").innerText()).includes(`onComplete(${xp})`));
  assert(await page.getByRole("button", { name: "Done", exact: true }).isDisabled());
  pass(`Desktop complete flow, six clues, live checklist and onComplete(${xp})`);
  await page.getByRole("button", { name: "Play again" }).click();
  await page.getByRole("button", { name: "Start the case" }).click();
  assert(await page.getByRole("button", { name: "Undo", exact: true }).isDisabled());
  await finish(page); await tickAll(page);
  assert.equal(await page.locator(".sk-match strong").innerText(), "0%");
  pass("Play again resets the drawing; blank canvas remains 0% after all checks");
  await context.close();

  const mobile = await opened(390, true);
  await assertLayout(mobile.page);
  await mobile.page.screenshot({ path: resolve(output, "intro-390.png"), fullPage: true });
  await mobile.page.getByRole("button", { name: "Start the case" }).tap();
  await assertLayout(mobile.page);
  const tools = await mobile.page.locator(".sk-tool").evaluateAll((buttons) => new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top))).size);
  assert.equal(tools, 2);
  const canvas = mobile.page.locator(".sk-canvas");
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  assert.equal(await canvas.evaluate((element) => element.width), Math.round(bounds.width * 2));
  const yBefore = await mobile.page.evaluate(() => scrollY);
  const cdp = await mobile.context.newCDPSession(mobile.page);
  for (let stroke = 0; stroke < 5; stroke++) {
    const x = bounds.x + 100 + stroke * 20, y = bounds.y + 120;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    for (let step = 1; step <= 8; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + step * 2, y: y + step * 12, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  assert.equal(await mobile.page.evaluate(() => scrollY), yBefore);
  assert(await mobile.page.getByRole("button", { name: "Undo", exact: true }).isEnabled());
  pass("390px DPR 2: real touch events draw without scrolling; toolbar has two 48px rows");
  await mobile.page.screenshot({ path: resolve(output, "drawing-390.png"), fullPage: true });
  await finish(mobile.page); await tickAll(mobile.page); await assertLayout(mobile.page);
  await mobile.page.screenshot({ path: resolve(output, "reveal-390.png"), fullPage: true });
  await mobile.page.getByRole("button", { name: "Done", exact: true }).tap();
  assert.match(await mobile.page.locator(".sk-preview-message").innerText(), /onComplete\(\d+\)/);
  const storage = await mobile.page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
  assert.deepEqual(storage, { local: 0, session: 0 });
  await mobile.context.close();

  const narrow = await opened(360);
  await narrow.page.getByRole("button", { name: "Start the case" }).click(); await assertLayout(narrow.page);
  assert.equal(await narrow.page.locator(".sk-tool").evaluateAll((buttons) => new Set(buttons.map((button) => button.getBoundingClientRect().top)).size), 2);
  await narrow.context.close(); pass("360px layout has no overflow and keeps tools in two rows");

  const flooded = await opened(1280);
  await flooded.page.getByRole("button", { name: "Start the case" }).click();
  await flooded.page.getByRole("button", { name: "Thick brush" }).click();
  for (let y = 5; y < 500; y += 18) await line(flooded.page, [[1, y], [399, y]]);
  await finish(flooded.page); await tickAll(flooded.page);
  assert(Number((await flooded.page.locator(".sk-match strong").innerText()).replace("%", "")) <= 25);
  await flooded.context.close(); pass("A single-color flooded canvas stays at or below 25% with all clues checked");

  const failed = await opened(1280, false, true);
  await failed.page.getByRole("button", { name: "Start the case" }).click();
  await line(failed.page, [[150, 150], [230, 200]]);
  await finish(failed.page);
  await failed.page.getByRole("checkbox").nth(0).check();
  await failed.page.getByRole("checkbox").nth(1).check();
  await failed.page.getByRole("checkbox").nth(2).check();
  assert.equal(await failed.page.locator(".sk-match strong").innerText(), "50%");
  assert.equal(await failed.page.locator(".sk-breakdown").innerText(), "Clues 50%");
  await failed.context.close(); pass("SVG Image failure gracefully uses checklist-only scoring");

  const spoken = await opened(1280, false, false, true);
  await spoken.page.getByRole("button", { name: "Back", exact: true }).click();
  assert.match(await spoken.page.locator(".sk-preview-message").innerText(), /Back pressed/);
  await spoken.page.getByRole("button", { name: "Return to preview" }).click();
  await spoken.page.getByRole("button", { name: "Start the case" }).click();
  await spoken.page.getByRole("button", { name: "Hear it" }).click();
  await spoken.page.getByRole("button", { name: "Next clue" }).click();
  assert.equal(await spoken.page.evaluate(() => window.__spokenClues.length), 3);
  await spoken.page.getByRole("button", { name: "Back", exact: true }).click();
  assert.match(await spoken.page.locator(".sk-preview-message").innerText(), /Back pressed/);
  await spoken.context.close(); pass("Optional speech auto-reads new clues, Hear it repeats, Back exits");

  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  pass("No browser errors, no HTTP requests during play, no local/session storage writes");
  await writeFile(resolve(output, "verification.json"), JSON.stringify({ viewports: [360, 390, 1280], touch: "Chromium CDP, DPR 2", physicalIPhoneTested: false, report, browserErrors: errors, gameplayHttpRequests: network }, null, 2) + "\n");
} finally { await browser.close(); }
