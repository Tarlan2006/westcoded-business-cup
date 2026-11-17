import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.VIDEO_PLAYWRIGHT ? pathToFileURL(process.env.VIDEO_PLAYWRIGHT).href : "playwright");
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const base = process.env.VIDEO_URL ?? "http://127.0.0.1:5178";
const output = resolve(process.env.FLOW_SCREEN_DIR ?? "scripts/.cache");
await mkdir(output, { recursive: true });

const button = (page, name) => page.getByRole("button", { name, exact: typeof name === "string" });
const clock = (page) => page.getByRole("timer", { name: "Session time left", exact: true });
const complete = (page) => page.getByRole("heading", { name: "Session complete", exact: true });
const nickname = (page) => page.locator("#profileNameInput");
const interests = (page) => page.locator("#profileNotesInput");
const savedSession = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.session")));
const savedProfile = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0]);
const advance = (page, ms) => page.evaluate((ms) => window.advanceSessionTime(ms), ms);
const start = (page) => button(page, /^START SESSION FOR/).click();
const hub = (page) => page.getByRole("region", { name: "Start here", exact: true });
const home = (page) => button(page, "Home, back to activities").click();

async function fresh(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 390, reducedMotion: "reduce" });
  await context.addInitScript(() => {
    if (window !== window.top) return;
    // Move wall-clock time independently of the animation clock used by hold controls.
    let time = Number(sessionStorage.getItem("test.wall-time")) || Date.now();
    Date.now = () => time;
    window.advanceSessionTime = (ms) => {
      time += ms;
      sessionStorage.setItem("test.wall-time", String(time));
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    };
    Object.defineProperty(navigator, "deviceMemory", { value: 1 });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, "speechSynthesis", { value: {
      getVoices: () => [{ name: "Test voice", lang: "en-US", localService: true, default: true }],
      speak(utterance) {
        if (utterance.text === "Two more minutes, pal!") {
          const count = Number(sessionStorage.getItem("test.session-reminders") ?? 0);
          sessionStorage.setItem("test.session-reminders", String(count + 1));
        }
        if (utterance.text === window.holdTestSpeech) {
          window.finishTestSpeech = () => utterance.onend?.();
          return;
        }
        setTimeout(() => utterance.onend?.(), 0);
      },
      cancel() {},
    } });
  });
  await context.route("**/api/turn", (route) => route.fulfill({ status: 503, json: {} }));
  await context.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ body: "<title>Video fixture</title>", contentType: "text/html" }));
  await context.route("https://i.ytimg.com/**", (route) => route.fulfill({ status: 204 }));
  await context.route("https://www.youtube.com/iframe_api", (route) => route.fulfill({
    contentType: "text/javascript",
    body: `
      window.YT = { Player: function(slot, config) {
        const frame = slot.tagName === "IFRAME" ? slot : document.createElement("iframe");
        if (frame !== slot) slot.replaceWith(frame);
        window.videoState = (data) => config.events.onStateChange({ data, target: this });
        this.playVideo = () => window.videoState(1);
        this.pauseVideo = () => window.videoState(2);
        this.mute = this.unMute = () => {};
        this.destroy = () => frame.remove();
        queueMicrotask(() => config.events.onReady?.({ target: this }));
      } };
      window.onYouTubeIframeAPIReady();
    `,
  }));
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await button(page, "CONTINUE").click();
  await nickname(page).fill("Comet");
  await interests(page).fill("Space and animals");
  return { context, page, errors };
}

async function expectClock(page, value) {
  const timer = clock(page);
  await timer.filter({ hasText: new RegExp(`^${value}$`) }).first().waitFor();
  assert.equal(await timer.first().innerText(), value);
}

async function holdParents(page, label = /^Parents, press and hold/) {
  await button(page, label).focus();
  await page.keyboard.down("Enter");
  const dialog = page.getByRole("dialog", { name: "Session settings", exact: true });
  await dialog.waitFor();
  await page.keyboard.up("Enter");
  return dialog;
}

async function openVideo(page) {
  await button(page, /^Open video:/).click();
  await page.locator("iframe.video-player").waitFor();
  await page.waitForFunction(() => typeof window.videoState === "function");
  await page.evaluate(() => window.videoState(1));
}

async function backToStart(page) {
  const before = await savedProfile(page);
  await button(page, "Back to start").click();
  assert.equal(await savedSession(page), null);
  assert.equal(await nickname(page).inputValue(), "Comet");
  assert.equal(await interests(page).inputValue(), "Space and animals");
  assert.equal(await button(page, "20 min").getAttribute("aria-pressed"), "true");
  assert.deepEqual(await savedProfile(page), before);
}

try {
  for (const [width, height] of [[390, 844], [1280, 800]]) {
    const { context, page, errors } = await fresh(width, height);
    assert.deepEqual(await page.locator("[data-min]").allTextContents(), ["10 min", "20 min", "30 min", "60 min"]);
    assert.equal(await button(page, "20 min").getAttribute("aria-pressed"), "true");
    assert.equal(await savedSession(page), null);
    await button(page, "10 min").click();
    await start(page);
    await expectClock(page, "10:00 left");
    const first = await savedSession(page);
    assert.equal(first.sessionEndsAt - first.startedAt, 600_000);
    assert.equal((await savedProfile(page)).preferences.minutes, 10);
    await openVideo(page);
    await advance(page, 240_000);
    await page.reload();
    await hub(page).waitFor();
    await expectClock(page, "6:00 left");
    assert.deepEqual(await savedSession(page), first);
    await page.locator(".activity-grid").getByRole("button", { name: /^Memory/ }).click();
    await page.waitForFunction(() => document.activeElement?.matches(".memory-intro h1"));
    await expectClock(page, "6:00 left");
    await holdParents(page);
    await button(page, "+5 min").click();
    await expectClock(page, "11:00 left");
    assert.equal((await savedSession(page)).sessionEndsAt, first.sessionEndsAt + 300_000);
    assert.equal((await savedProfile(page)).preferences.minutes, 10);
    await home(page);
    await hub(page).waitFor();
    await expectClock(page, "11:00 left");

    await advance(page, 540_000);
    await expectClock(page, "2:00 left");
    await page.waitForFunction(() => sessionStorage.getItem("test.session-reminders") === "1");
    await page.reload();
    await hub(page).waitFor();
    await page.waitForFunction(() => document.activeElement?.matches(".flow-start h1"));
    await expectClock(page, "2:00 left");
    await advance(page, 1000);
    await expectClock(page, "1:59 left");
    assert.equal(await page.evaluate(() => sessionStorage.getItem("test.session-reminders")), "1");
    await holdParents(page);
    await button(page, "End session now").click();
    await complete(page).waitFor();
    await page.getByText("Great job, Comet! See you next time!", { exact: true }).waitFor();
    await backToStart(page);

    // Keep the shipped presets and exercise a five-minute session in local QA.
    await page.getByLabel("Custom minutes").fill("5");
    await start(page);
    await expectClock(page, "5:00 left");
    await openVideo(page);
    await advance(page, 253_000);
    await page.reload();
    await hub(page).waitFor();
    await expectClock(page, "0:47 left");
    await page.locator(".activity-grid").getByRole("button", { name: /^Video library/ }).click();
    await openVideo(page);
    await advance(page, 47_000);
    await expectClock(page, "0:00 left");
    assert.equal(await page.locator("iframe.video-player").count(), 1);
    await button(page, "Next video").waitFor();
    assert(await button(page, "Next video").isDisabled());
    assert(await button(page, /Play with AIdos/).isDisabled());
    assert.equal(await complete(page).count(), 0);
    if (width === 390) {
      await advance(page, 10_000);
      await page.evaluate(() => window.videoState(0));
    } else {
      await advance(page, 29_999);
      assert.equal(await complete(page).count(), 0);
      await advance(page, 1);
    }
    await complete(page).waitFor();
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await page.locator(".session-complete").evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(255, 255, 255)");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: resolve(output, `session-complete-${width}.png`) });
    await page.reload();
    await complete(page).waitFor();
    assert.equal(await page.locator("#screen-greeting").count(), 0);
    await backToStart(page);

    // A reload after the deadline shows the result even if grace had not finished before reload.
    await page.getByLabel("Custom minutes").fill("5");
    await start(page);
    await openVideo(page);
    await advance(page, 300_001);
    await expectClock(page, "0:00 left");
    await page.reload();
    await complete(page).waitFor();
    await backToStart(page);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width}×${height}: presets, shared and persisted timer, one spoken reminder, +5 min, early end, five-minute video, grace, expired reload and retained profile`);
  }

  const { context, page, errors } = await fresh(390, 844);
  await page.getByLabel("Custom minutes").fill("5");
  await start(page);
  await home(page);
  await hub(page).waitFor();
  await advance(page, 299_000);
  await page.locator(".activity-grid").getByRole("button", { name: /^Scavenger Hunt/ }).click();
  await button(page, "Start game").click();
  await expectClock(page, "0:01 left");
  await advance(page, 1000);
  await expectClock(page, "0:00 left");
  await button(page, "I DID IT!").click();
  const before = (await savedProfile(page)).xp;
  // Let the current answer resolve, then advance past its normal feedback window.
  await page.locator("#roundSecondsBadge").filter({ hasText: "✦" }).waitFor();
  await advance(page, 3000);
  await complete(page).waitFor();
  assert((await savedProfile(page)).xp > before);
  assert.deepEqual(errors, []);
  await context.close();
  console.log("PASS Scavenger Hunt: finish and score the current round without starting another");

  const ask = await fresh(390, 844);
  const answer = "The sky looks blue because of the air.";
  await button(ask.page, "6–8 yrs").click();
  await ask.page.getByLabel("Custom minutes").fill("5");
  await start(ask.page);
  await home(ask.page);
  await ask.page.locator(".activity-grid").getByRole("button", { name: /^Ask AIdos/ }).click();
  let releaseAnswer;
  const answerGate = new Promise((resolve) => { releaseAnswer = resolve; });
  await ask.page.route("**/api/ask", async (route) => {
    await answerGate;
    await route.fulfill({ json: { answer, source: "faq" } });
  });
  await ask.page.evaluate((answer) => { window.holdTestSpeech = answer; }, answer);
  await advance(ask.page, 299_000);
  await ask.page.getByRole("textbox", { name: "Your question" }).fill("Why is the sky blue?");
  await button(ask.page, "Ask").click();
  await button(ask.page, "Thinking…").waitFor();
  await advance(ask.page, 1000);
  await expectClock(ask.page, "0:00 left");
  releaseAnswer();
  await ask.page.waitForFunction(() => typeof window.finishTestSpeech === "function");
  assert.equal(await complete(ask.page).count(), 0);
  await ask.page.evaluate(() => window.finishTestSpeech());
  await complete(ask.page).waitFor();
  assert.equal((await savedProfile(ask.page)).xp, 5);
  assert.deepEqual(ask.errors, []);
  await ask.context.close();
  console.log("PASS Ask: the last answer and its speech finish before the session closes");
} finally { await browser.close(); }
