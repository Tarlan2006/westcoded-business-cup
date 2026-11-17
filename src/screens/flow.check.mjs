import { APP_NAME } from "../brand.ts";
/** Run against a built app with FLOW_SITE_URL and the existing Playwright runtime. */
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.FLOW_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.FLOW_PLAYWRIGHT_MODULE).href : "playwright");
const base = process.env.FLOW_SITE_URL ?? "http://127.0.0.1:5175";
const output = resolve(process.env.FLOW_SCREEN_DIR ?? ".wrangler/design-qa/prototype");
const bank = JSON.parse(await readFile(new URL("../../content/quiz.json", import.meta.url), "utf8"));
const browser = await chromium.launch({ ...(process.env.FLOW_CHROME ? { executablePath: process.env.FLOW_CHROME } : {}) });
await mkdir(output, { recursive: true });

const button = (page, name) => page.getByRole("button", { name, exact: typeof name === "string" });
const complete = (page) => page.locator("#screen-complete");
const hub = (page) => page.getByRole("region", { name: "Start here", exact: true });
const storage = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress"))?.profiles[0]);
async function hold(page, name) {
  await button(page, name).focus();
  await page.keyboard.down("Enter");
  await page.waitForTimeout(1580);
  await page.keyboard.up("Enter");
}
async function shot(page, name) {
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal overflow`);
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  const { width } = page.viewportSize();
  await page.screenshot({ path: resolve(output, `react-${name}-${width}.png`), fullPage: true, animations: "disabled" });
}

async function fresh(width, height, captures = false) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 600, reducedMotion: "reduce" });
  const page = await context.newPage();
  const sent = [], errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (request.url().includes("/api/")) sent.push(request.postData() ?? ""); });
  await page.route("**/api/turn", (route) => route.fulfill({ status: 503, json: {} }));
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ body: "<p>Video player fixture</p>", contentType: "text/html" }));
  await page.goto(base);
  const splash = page.getByRole("main", { name: `Loading ${APP_NAME}`, exact: true });
  await splash.waitFor();
  if (captures) await shot(page, "splash");
  await page.locator("#screen-greeting").waitFor();
  if (captures) await shot(page, "greeting");
  await button(page, "Sound").click();
  await button(page, "CONTINUE").click();
  await page.getByRole("heading", { name: "Tell AIdos About Your Child", exact: true }).waitFor();
  await page.getByLabel("What should AIdos call your child?", { exact: true }).fill("CometQA");
  await page.getByLabel(/Child's Interests/).fill("PRIVATE_CONTEXT_EXAMPLE");
  if (captures) await shot(page, "profile-setup");
  return { context, page, sent, errors };
}

async function educational(width, height) {
  const { context, page, sent, errors } = await fresh(width, height, true);
  await button(page, "60m").click();
  await button(page, /START FOR COMETQA/).click();
  await page.locator("#screen-video").waitFor();
  await shot(page, "video");
  assert.equal(await page.locator("iframe").count(), 0, "load the player after a tap");
  await button(page, /^Open video:/).click();
  const player = page.locator("iframe.video-player");
  const src = await player.getAttribute("src");
  assert.match(src, /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
  assert(!src.includes("autoplay"));
  assert((await player.boundingBox()).height >= 200);
  await button(page, "Play with AIdos Now!").click();
  await page.getByRole("heading", { name: "Quiz", exact: true }).waitFor();
  assert.match(await page.locator("#sessionClockDisplay").innerText(), /^59:|^60:/);
  for (let i = 0; i < 3; i++) {
    const prompt = await page.locator(".caption").innerText();
    const current = bank.find((item) => item.ageBand === "3-5" && prompt.startsWith(item.question));
    assert(current, `known age-appropriate question: ${prompt}`);
    await button(page, current.answer).click();
    await page.getByText("Correct! +10 XP", { exact: true }).waitFor();
    await button(page, i === 2 ? "Finish quiz" : "Next question").click();
  }
  await complete(page).waitFor();
  await button(page, /^Open Spaceship Garage/).click();
  await page.getByRole("dialog", { name: "CometQA's Spaceship Garage" }).waitFor();
  await button(page, "AWESOME!").click();
  await shot(page, "complete");
  assert.equal((await storage(page)).xp, 35);
  await button(page, "More games").click();
  await hub(page).waitFor();
  assert.equal(await page.getByRole("button", { name: /^Ask AIdos/ }).count(), 0);
  await page.reload();
  await hub(page).waitFor();
  assert.equal(await page.locator("#screen-greeting").count(), 0);
  await hold(page, /^Parents, press and hold/);
  await page.locator("#screen-profile-setup").waitFor();
  assert.equal(await page.getByLabel(/Child's Interests/).inputValue(), "PRIVATE_CONTEXT_EXAMPLE");
  assert.equal(await button(page, "60m").getAttribute("aria-pressed"), "true");
  await button(page, /START FOR/).click();
  await hub(page).waitFor();
  assert(!sent.join().includes("PRIVATE_CONTEXT_EXAMPLE"));
  assert(!sent.join().includes("CometQA"));
  assert.deepEqual(errors, []);
  await context.close();
}

async function active(width, height) {
  const { context, page, sent, errors } = await fresh(width, height);
  await button(page, "6–8 yrs").click();
  await button(page, /Move and play/).click();
  await button(page, /START FOR/).click();
  await page.locator("#screen-mission").waitFor();
  await shot(page, "mission");
  await button(page, "Tickle AIdos").click();
  await page.getByText("Hee-hee-hee! That tickles! 😂", { exact: true }).waitFor();
  for (let round = 1; round <= 3; round++) {
    await page.locator(`#starProgressContainer[aria-label="Round ${round}"]`).waitFor();
    await button(page, "I DID IT!").click();
  }
  await complete(page).waitFor();
  assert.equal((await storage(page)).xp, 30);
  assert.equal(sent.length, 3);
  assert(!sent.join().includes("PRIVATE_CONTEXT_EXAMPLE"));
  assert(!sent.join().includes("CometQA"));
  await button(page, /PLAY NEXT ADVENTURE/).click();
  await page.locator('#starProgressContainer[aria-label="Round 1"]').waitFor();
  await hold(page, "Hold: Exit");
  await page.locator("#screen-profile-setup").waitFor();
  await button(page, "Back").click();
  await hub(page).waitFor();
  for (const name of ["Ask AIdos", "Space Scale", "Sketch Artist", "Tic-tac-toe", "Memory", "Balloon Count"]) {
    assert(await page.locator(".activity-grid").getByRole("button", { name: new RegExp(`^${name}`) }).isVisible());
  }
  await page.locator(".activity-grid").getByRole("button", { name: /^Balloon Count/ }).click();
  await page.locator(".bl-balloon").first().waitFor();
  await button(page, "Home, back to activities").click();
  if (await button(page, "Leave game").isVisible()) await button(page, "Leave game").click();
  await hub(page).waitFor();
  assert.deepEqual(errors, []);
  await context.close();
}

async function toddler(width, height) {
  const { context, page, sent } = await fresh(width, height);
  await button(page, "1–2 yrs").click();
  assert.equal(await page.locator("#parentModeSelectorWrapper").count(), 0);
  await page.locator("#toddlerAutoNotice").waitFor();
  await button(page, /START FOR/).click();
  await button(page, "Next Video in Catalog").click();
  assert.match(await page.locator("#screen-video header").innerText(), /Episode 2 of 2/);
  await button(page, "Play with AIdos Now!").click();
  for (const word of ["CLAP!", "PEEK-A-BOO", "MOOO!"]) {
    await page.locator("#actionDemoBadge").getByText(word, { exact: true }).waitFor();
    await button(page, "I DID IT!").click();
  }
  await complete(page).waitFor();
  assert.equal((await storage(page)).xp, 15);
  assert.deepEqual(sent, []);
  await button(page, "More games").click();
  assert.deepEqual(await page.locator(".activity-section h2").allTextContents(), ["Watch"]);
  await context.close();
}

async function roadtrip(width, height) {
  const { context, page, sent } = await fresh(width, height);
  await button(page, "6–8 yrs").click();
  await button(page, /Move and play/).click();
  await page.getByLabel("Where are you playing?").selectOption("car");
  await button(page, /START FOR/).click();
  await page.getByRole("heading", { name: "Roadtrip Spy", exact: true }).waitFor();
  assert.equal(await page.locator(".talk-button").count(), 0);
  await button(page, "Player 1 spotted it!").click();
  await page.getByText("Player 1: 1 · Player 2: 0", { exact: true }).waitFor();
  assert.equal((await storage(page)).preferences.location, "car");
  assert.deepEqual(sent, []);
  await context.close();
}

async function educationalTimeout(age, firstRoundSeconds) {
  const { context, page } = await fresh(390, 844);
  await button(page, `${age} yrs`).click();
  await button(page, /START FOR/).click();
  await page.clock.install();
  await button(page, "Play with AIdos Now!").click();
  await page.getByRole("heading", { name: "Quiz", exact: true }).waitFor();
  assert.equal(await page.locator("#roundSecondsBadge").innerText(), `${firstRoundSeconds}s`);
  for (let round = 1; round <= 3; round++) {
    await page.locator(`#starProgressContainer[aria-label="Round ${round}"]`).waitFor();
    await page.clock.fastForward((round === 1 ? firstRoundSeconds + 1 : 36) * 1000);
  }
  await complete(page).waitFor();
  assert.equal((await storage(page)).xp, 0, "let the quiz finish without penalty for skipped questions");
  await context.close();
}

try {
  for (const [width, height] of [[390, 844], [1280, 720]]) {
    await educational(width, height);
    await active(width, height);
    await toddler(width, height);
    await roadtrip(width, height);
    console.log(`PASS ${width}×${height}: first/repeat visit, all tracks, replay, XP, parents, garage, catalog and games`);
  }
  await educationalTimeout("3–5", 35);
  await educationalTimeout("6–8", 40);
  console.log("PASS video quiz round countdown and penalty-free advance for both ages");
} finally { await browser.close(); }
