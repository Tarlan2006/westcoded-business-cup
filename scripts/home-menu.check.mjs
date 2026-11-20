import assert from "node:assert/strict";
import { chromium } from "playwright";
import kk from "../src/i18n/kk.ts";
import en from "../src/i18n/en.ts";

const base = process.env.SMOKE_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const learn = [
  ["activitySuggestions.quiz", ".quiz-card"],
  ["activitySuggestions.memory", ".memory-grid"],
];
const older = [
  ["activitySuggestions.ask", ".ask-suggestions"],
  ["activitySuggestions.ticTacToe", ".ttt-board"],
  ["sketchGame.sketchArtist", ".sk-title"],
  ["spaceGame.spaceScale", ".sp-button-primary"],
];
let returns = 0;

async function check(ageBand, lang, viewport, location) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.setDefaultTimeout(12000);
    await page.route(/https:\/\/[^/]*(?:youtube|ytimg|googlevideo)[^/]*\//, route => route.fulfill({ body: "" }));
    await page.addInitScript(({ ageBand, lang, location }) => {
      localStorage.setItem("mypal.lang", lang);
      localStorage.setItem("mission-control.sound", "off");
      localStorage.setItem("mission-control.progress", JSON.stringify({ selectedId: "scout", profiles: [{
        id: "scout", codenameId: "scout", ageBand, lang, xp: 12,
        preferences: { nickname: "Aida", location, first: "learn", minutes: 30 },
      }] }));
      const now = Date.now();
      localStorage.setItem("mission-control.session", JSON.stringify({ startedAt: now, sessionEndsAt: now + 1800000 }));
    }, { ageBand, lang, location });
    await page.goto(base);
    const dict = lang === "kk" ? kk : en;
    const label = key => dict[key].replaceAll("{brand}", "AIdos");
    const button = key => page.getByRole("button", { name: label(key), exact: true });
    const tile = key => page.locator(".activity-tile").filter({ has: page.getByText(label(key), { exact: true }) });
    const hub = page.locator(".prototype-hub");
    const leave = page.locator(".flow-leave-dialog[open]");
    const sessionEnd = await page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.session")).sessionEndsAt);
    const moves = location === "car" ? ["content.roadtripSpy"] : ["content.scavengerHunt", "content.floorIsLava"];
    const games = ageBand === "6-8" ? [...learn, ...older] : [...learn, ["app.balloonCount", ".bl-balloon"]];
    const video = "activitySuggestions.videoLibrary";
    const expected = (ageBand === "1-2" ? [video] : [...games.map(([key]) => key), ...moves, video]).map(label).sort();
    async function checkHub() {
      await hub.waitFor();
      assert.deepEqual((await hub.locator(".activity-tile strong").allTextContents()).sort(), expected);
      const saved = await page.evaluate(() => ({
        progress: JSON.parse(localStorage.getItem("mission-control.progress")),
        session: JSON.parse(localStorage.getItem("mission-control.session")),
      }));
      assert.equal(saved.progress.selectedId, "scout");
      assert.equal(saved.progress.profiles[0].ageBand, ageBand);
      assert.equal(saved.session.sessionEndsAt, sessionEnd);
      assert.equal(await page.locator("html").getAttribute("lang"), lang);
    }
    async function home(scope = page) {
      const control = scope.getByRole("button", { name: label("activityHeader.homeBackToActivities"), exact: true });
      await control.scrollIntoViewIfNeeded();
      const box = await control.boundingBox();
      assert.ok(box && box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= viewport.width);
      await control.click();
      await hub.or(leave).waitFor();
      if (await leave.isVisible()) await button("leaveGameDialog.leaveGame").click();
      await checkHub();
      returns++;
    }
    if (ageBand === "1-2") {
      await page.locator("#screen-toddler-cinema").waitFor();
      await home();
      await tile(video).click();
      await button("toddlerCinema.exploreAnimalSoundsWith").click();
      await page.locator("#screen-mission").waitFor();
      await home();
    } else {
      await checkHub();
      for (const key of moves) {
        await tile(key).click();
        await button("setup.startGame").waitFor();
        await home();
        await tile(key).click();
        await button("setup.startGame").click();
        await button("mission.pause").waitFor();
        await home();
      }
      if (location !== "car") {
        await tile("content.scavengerHunt").click();
        await button("setup.startGame").click();
        await button("mission.pause").click();
        await button("mission.endMission").click();
        await page.locator("#screen-complete").waitFor();
        await home();
        await button("home.garage").click();
        await home(page.getByRole("dialog"));
        for (const [key, selector] of games) {
          await tile(key).click();
          await page.locator(selector).first().waitFor();
          await home();
        }
        await tile(video).click();
        await page.locator(".video-frame-content button").click();
        await page.locator('iframe[src*="youtube-nocookie"]').waitFor();
        await home();
        await tile(video).click();
        await page.locator("#screen-video button").filter({ hasText: label("video.playNow") }).click();
        await page.locator("#screen-mission").waitFor();
        await home();
        await tile("activitySuggestions.memory").click();
        const cards = page.locator(".memory-card");
        await cards.first().waitFor();
        const pairs = await cards.locator(".memory-front").evaluateAll(icons =>
          Object.values(Object.groupBy(icons.map((icon, i) => ({ art: icon.innerHTML, i })), card => card.art))
            .map(pair => pair.map(card => card.i)));
        for (const [first, second] of pairs) {
          await cards.nth(first).click();
          await cards.nth(second).click();
          await cards.nth(first).and(page.locator("[data-matched=true]")).waitFor();
        }
        await page.locator(".memory-victory[open]").waitFor();
        const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0].xp);
        const before = await xp();
        await home(page.getByRole("dialog"));
        assert.equal(await xp(), before + 20);
      }
    }
    assert.deepEqual(errors, []);
    console.log(lang, viewport.width, ageBand, location, "OK");
  } finally {
    await context.close();
  }
}

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    for (const lang of ["kk", "en"]) {
      for (const age of ["1-2", "3-5", "6-8"]) {
        await check(age, lang, viewport, "home");
        if (age !== "1-2") await check(age, lang, viewport, "car");
      }
    }
  }
  console.log(returns, "returns to the correct menu");
} finally {
  await browser.close();
}
