/** Host/module navigation regressions. Reuses the existing external Playwright runtime. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { chromium } = await import(process.env.FLOW_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.FLOW_PLAYWRIGHT_MODULE).href : "playwright");
const browser = await chromium.launch({ headless: true, ...(process.env.FLOW_CHROME ? { executablePath: process.env.FLOW_CHROME } : {}) });
const base = process.env.FLOW_SITE_URL ?? "http://127.0.0.1:5175";
const output = resolve(process.env.FLOW_SCREEN_DIR ?? ".wrangler/design-qa/prototype");
await mkdir(output, { recursive: true });
const errors = [], results = [];
function pass(message) { results.push(message); console.log(`PASS ${message}`); }
async function open(width, age = "6-8") {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600, reducedMotion: "reduce" });
  await context.addInitScript((ageBand) => {
    localStorage.setItem("mission-control.progress", JSON.stringify({ selectedId: "test-agent", profiles: [{
      id: "test-agent", codenameId: "local_codename_comet", ageBand, xp: 12, rank: 0, streak: 0,
      lastPlayedISO: "", loreNote: "", activities: {}, preferences: { location: "home", minutes: 10, first: "learn" },
    }] }));
    Object.defineProperty(window, "speechSynthesis", { value: { speak(u) { setTimeout(() => u.onend?.(), 0); }, cancel() {}, getVoices: () => [] } });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  }, age);
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.getByRole("region", { name: "Start here", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { page, context };
}
function tile(page, name) { return page.locator(".activity-grid").getByRole("button", { name: new RegExp(name) }); }
function back(page) { return page.locator(".activity-header").getByRole("button", { name: "Back", exact: true }).click(); }
function home(page) { return page.getByRole("button", { name: "Home, back to activities", exact: true }).click(); }
async function header(page, title) {
  assert.equal(await page.locator(".activity-header").count(), 1);
  assert.equal(await page.locator(".sk-topbar, .sp-topbar").count(), 0);
  assert.equal(await page.locator(".activity-header-title").innerText(), title);
  assert.equal(await page.getByRole("navigation", { name: "Breadcrumb" }).innerText(), `Learn › ${title}`);
  assert.equal(await page.locator(".activity-header .xp-chip").innerText(), "12 XP");
  assert.equal(await page.getByRole("button", { name: "Back", exact: true }).count(), 1);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const controls = page.locator(".activity-header button");
  for (let i = 0; i < await controls.count(); i++) {
    await controls.nth(i).evaluate((node, index) => node.dataset.headerCheck = String(index), i);
  }
  await page.locator("body").evaluate((node) => { node.tabIndex = -1; node.focus(); });
  const reached = new Set();
  for (let i = 0; i < 20 && reached.size < await controls.count(); i++) {
    await page.keyboard.press("Tab");
    const index = await page.evaluate(() => document.activeElement?.getAttribute("data-header-check"));
    if (index !== null) reached.add(index);
  }
  assert.equal(reached.size, await controls.count(), "header buttons reachable with Tab");
}
async function snapshot(page, name, width) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, `flow-${name}-${width}.png`), fullPage: true });
}
async function finishJourney(page, exploreOnly = false) {
  const stops = page.getByRole("navigation", { name: "Journey stops", exact: true });
  const mobilePicker = stops.getByRole("combobox", { name: "Jump to a stop", exact: true });
  await stops.waitFor();
  if (await mobilePicker.isVisible()) {
    await mobilePicker.selectOption({ label: "8. Betelgeuse" });
  } else {
    await stops.getByRole("button", { name: "Betelgeuse", exact: true }).click();
  }
  await page.getByRole("heading", { name: "Betelgeuse", exact: true }).waitFor();
  await page.getByRole("button", { name: exploreOnly ? "Finish journey" : "Start quiz", exact: true }).click();
}
function seconds(text) { const [m, s] = text.split(":").map(Number); return m * 60 + s; }
async function holdExit(page) {
  await page.getByRole("button", { name: "Hold: Exit", exact: true }).focus();
  await page.keyboard.down("Enter");
  await page.clock.runFor(1450);
  await page.keyboard.up("Enter");
}
const timerState = (page) => page.locator("#sessionClockDisplay").innerText();

try {
  for (const width of [390, 1280]) {
    const { page, context } = await open(width);
    await tile(page, "Memory").click();
    await page.waitForFunction(() => document.activeElement?.matches(".memory-intro h1"));
    await home(page);
    await page.getByRole("region", { name: "Start here", exact: true }).waitFor();
    // The common header must exist even before the lazy game chunk arrives.
    let releaseChunk;
    const chunkGate = new Promise((resolve) => { releaseChunk = resolve; });
    await page.route(/\/assets\/sketch-.*\.js$/, async (route) => { await chunkGate; await route.continue(); });
    await tile(page, "Sketch Artist").click();
    await page.getByText("Opening the case…", { exact: true }).waitFor();
    await header(page, "Sketch Artist");
    await home(page);
    await page.getByRole("region", { name: "Start here", exact: true }).waitFor();
    releaseChunk();
    await tile(page, "Sketch Artist").click();
    await page.getByRole("button", { name: "Start the case" }).waitFor();
    await header(page, "Sketch Artist"); await snapshot(page, "sketch-header", width);
    await page.getByRole("button", { name: "Start the case" }).click();
    await header(page, "Sketch Artist");
    await page.getByRole("button", { name: "I'm done" }).click();
    await page.getByRole("heading", { name: "Comparing...", exact: true }).waitFor();
    assert.equal(await page.locator(".activity-header").count(), 1);
    await page.locator(".sk-match").waitFor(); await header(page, "Sketch Artist");
    await back(page);
    await tile(page, "Space Scale").click();
    await page.getByRole("button", { name: "Start exploring" }).waitFor();
    await header(page, "Space Scale"); await snapshot(page, "space-header", width);
    await page.getByRole("button", { name: "Start exploring" }).click();
    await header(page, "Space Scale");
    await finishJourney(page);
    await page.getByRole("heading", { name: "Which is bigger?", exact: true }).waitFor();
    await header(page, "Space Scale");
    for (let question = 0; question < 5; question++) {
      await page.locator(".sp-choices button").first().click();
      await page.getByRole("button", { name: question === 4 ? "See results" : "Next question" }).click();
    }
    await page.getByRole("heading", { name: "What a journey!" }).waitFor();
    await header(page, "Space Scale"); await home(page);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0].xp), 12);
    await context.close();
    pass(`${width}px: one shared header through all Sketch/Space stages, loading exit, Back/Home, XP and keyboard access`);

    const preschool = await open(width, "3-5");
    await tile(preschool.page, "Space Scale").click();
    await preschool.page.getByRole("button", { name: "Start exploring" }).click();
    await header(preschool.page, "Space Scale"); await finishJourney(preschool.page, true);
    await preschool.page.getByRole("heading", { name: "What a journey!", exact: true }).waitFor();
    assert.equal(await preschool.page.getByRole("heading", { name: "Which is bigger?", exact: true }).count(), 0);
    await header(preschool.page, "Space Scale"); await back(preschool.page);
    await preschool.context.close();
    pass(`${width}px: preschool SpaceViewer keeps the shared header and skips the quiz`);

    for (const mode of ["Scavenger Hunt", "Floor is Lava"]) {
      const mission = await open(width);
      const p = mission.page;
      await p.clock.install();
      await tile(p, mode).click(); await p.getByRole("button", { name: "Start mission", exact: true }).click();
      await p.locator("#screen-mission").waitFor();
      await p.clock.fastForward(5100);
      assert.equal(await p.getByRole("button", { name: "Home, back to activities" }).count(), 0);
      await p.getByRole("button", { name: "Pause", exact: true }).click();
      await p.getByRole("button", { name: "Resume mission", exact: true }).waitFor();
      const frozen = await timerState(p);
      await p.clock.fastForward(30_000);
      assert.equal(await timerState(p), frozen, "session clock stops during a pause");
      await home(p);
      await p.getByRole("button", { name: "Keep playing", exact: true }).click();
      assert.equal(await timerState(p), frozen, "dismissing Home leaves the mission paused");
      if (mode === "Scavenger Hunt") await snapshot(p, "mission-paused", width);
      await p.getByRole("button", { name: "Resume mission", exact: true }).click();
      const remaining = seconds(await timerState(p));
      await p.clock.fastForward(1100);
      const resumed = seconds(await timerState(p));
      assert(remaining - resumed >= 1 && remaining - resumed <= 2, "resume excludes time spent paused");
      await p.getByRole("button", { name: "Hold: Exit", exact: true }).click();
      assert.equal(await p.locator("#screen-profile-setup").count(), 0, "a tap cannot exit a mission");
      await holdExit(p);
      await p.locator("#screen-profile-setup").waitFor();
      assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0].xp), 12);
      await p.getByRole("button", { name: "Back", exact: true }).click();
      await p.getByRole("region", { name: "Start here", exact: true }).waitFor();
      await mission.context.close();
      pass(`${width}px ${mode}: pause/resume, hold exits to Parents without double-awarding XP`);
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, "flow-navigation-completion.json"), JSON.stringify({ viewports: [390, 1280], results, browserErrors: errors }, null, 2) + "\n");
} finally { await browser.close(); }
