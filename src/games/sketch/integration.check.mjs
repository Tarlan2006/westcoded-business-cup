/** Optional browser check against the built host site. Reuses an existing Playwright installation. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { chromium } = await import(process.env.SKETCH_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.SKETCH_PLAYWRIGHT_MODULE).href : "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.SKETCH_CHROME ? { executablePath: process.env.SKETCH_CHROME } : {}) });
const base = process.env.SKETCH_SITE_URL ?? "http://127.0.0.1:5175";
const output = fileURLToPath(new URL("./screens/", import.meta.url));
await mkdir(output, { recursive: true });
const errors = [], requests = [], results = [];
function pass(message) { results.push(message); console.log(`PASS ${message}`); }

async function open(ageBand, width = 1280) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600, isMobile: width < 600, deviceScaleFactor: width < 600 ? 2 : 1, reducedMotion: "reduce" });
  await context.addInitScript((age) => {
    if (!localStorage.getItem("mission-control.progress")) localStorage.setItem("mission-control.progress", JSON.stringify({
      selectedId: "test-agent", profiles: [{ id: "test-agent", codenameId: "local_codename_comet", ageBand: age, xp: 12, rank: 0, streak: 0, lastPlayedISO: "", loreNote: "", activities: {}, preferences: { location: "home", minutes: 10, first: "learn" } }],
    }));
    window.__speech = { texts: [], cancellations: 0, current: null };
    Object.defineProperty(window, "speechSynthesis", { value: {
      speak(utterance) { window.__speech.texts.push(utterance.text); window.__speech.current = utterance; },
      cancel() { window.__speech.cancellations++; const previous = window.__speech.current; window.__speech.current = null; previous?.onend?.(); },
    } });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  }, ageBand);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const chunks = [];
  page.on("request", (request) => {
    if (/\/assets\/sketch-.*\.(js|css)/.test(request.url())) chunks.push(request.url());
    if (request.url().includes("/api/") || request.method() === "POST") requests.push(request.url());
  });
  await page.goto(base);
  await page.getByRole("button", { name: "Parent settings" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { page, context, chunks };
}

try {
  for (const age of ["1-2", "3-5"]) {
    const { page, context, chunks } = await open(age);
    assert.equal(await page.getByRole("button", { name: /Sketch Artist/ }).count(), 0);
    assert.equal(chunks.length, 0);
    await context.close(); pass(`No Sketch Artist card or game chunk for ages ${age}`);
  }
  for (const width of [1280, 390]) {
    const { page, context, chunks } = await open("6-8", width);
    assert.equal(chunks.length, 0, "game and CSS must remain lazy on the hub");
    const learn = page.getByRole("region", { name: "Learn", exact: true });
    const card = learn.getByRole("button", { name: /Sketch Artist/ });
    await card.scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, `site-hub-${width}.png`), fullPage: true });
    await card.click();
    await page.getByRole("button", { name: "Start the case" }).waitFor();
    assert.equal(chunks.filter((url) => url.endsWith(".js")).length, 1);
    assert.equal(chunks.filter((url) => url.endsWith(".css")).length, 1);
    assert.equal(await page.locator(".sk-host-controls .xp-chip").innerText(), "12 XP");
    await page.getByRole("button", { name: "Start the case" }).click();
    assert((await page.evaluate(() => window.__speech.texts)).some((text) => text.includes("round green mask")));
    const cancellations = await page.evaluate(() => window.__speech.cancellations);
    await page.getByRole("button", { name: "Next clue" }).click();
    assert(await page.evaluate(() => window.__speech.cancellations) > cancellations);
    await page.getByRole("button", { name: "Clue audio on" }).click();
    assert(await page.getByRole("button", { name: "Hear it" }).isDisabled());
    assert(await page.getByText("Text-only mode. Every clue is here to read.").isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const canvas = page.locator(".sk-canvas");
    await canvas.scrollIntoViewIfNeeded();
    const bounds = await canvas.boundingBox();
    await page.mouse.move(bounds.x + bounds.width * .3, bounds.y + bounds.height * .3);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * .6, bounds.y + bounds.height * .5, { steps: 12 });
    await page.mouse.up();
    await page.screenshot({ path: resolve(output, `site-drawing-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "I'm done" }).click();
    await page.locator(".sk-match").waitFor();
    for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
    const points = Number((await page.locator(".sk-xp").innerText()).match(/(\d+) XP/)[1]);
    assert(points > 0 && points <= 28);
    const rawBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")));
    assert.equal(rawBefore.profiles[0].xp, 12);
    await page.getByRole("button", { name: "Done", exact: true }).evaluate((button) => { button.click(); button.click(); });
    await page.getByRole("heading", { name: "Nice work, agent!" }).waitFor();
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")));
    assert.equal(after.profiles[0].xp, 12 + points);
    assert.equal(after.profiles[0].activities.sketch, 1);
    assert(after.lastFinished);
    assert(!JSON.stringify(after).includes("data:image"));
    await page.getByRole("button", { name: "Back to activities" }).click();
    await page.reload();
    await page.getByRole("button", { name: /Sketch Artist/ }).click();
    await page.getByRole("button", { name: "Start the case" }).click();
    const beforeBack = await page.evaluate(() => window.__speech.cancellations);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Parent settings" }).waitFor();
    assert(await page.evaluate(() => window.__speech.cancellations) > beforeBack);
    const afterBack = await page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")));
    assert.equal(afterBack.profiles[0].xp, after.profiles[0].xp);
    assert.equal(afterBack.profiles[0].activities.sketch, 1);
    await context.close();
    pass(`${width}px: Learn card, lazy JS/CSS, speech replacement/mute/cleanup, drawing, Done rewards ${points} XP exactly once, persisted profile, Back without reward`);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  pass("No browser errors, API requests or uploads during the integrated flow");
  await writeFile(resolve(output, "integration-verification.json"), JSON.stringify({ results, errors, apiOrPostRequests: requests, physicalIPhoneTested: false }, null, 2) + "\n");
} finally { await browser.close(); }
