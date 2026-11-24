// Run against a local build with VIDEO_URL and optionally CHROME_PATH.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import kk from "../src/i18n/kk.ts";
import en from "../src/i18n/en.ts";
import questions from "../content/quiz.json" with { type: "json" };
import videos from "../content/videos.json" with { type: "json" };

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
try {
  for (const [language, width] of [["kk", 320], ["kk", 390], ["en", 1280]]) {
    const dict = language === "kk" ? kk : en;
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(lang => {
      localStorage.setItem("mypal.lang", lang);
      localStorage.setItem("mission-control.sound", "off");
    }, language);
    const button = key => page.getByRole("button", { name: dict[key].replaceAll("{brand}", "AIdos"), exact: true });
    const xp = () => page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0].xp);
    await page.route("https://i.ytimg.com/**", route => route.abort());
    await page.route("https://www.youtube-nocookie.com/**", route => route.fulfill({ contentType: "text/html", body: "<p>Player fixture</p>" }));
    await page.route("https://www.youtube.com/iframe_api", route => route.fulfill({ contentType: "text/javascript", body: `
      window.YT = { Player: class {
        constructor(frame, { events }) { this.frame = frame; window.playerEvents = events; events.onReady(); }
        destroy() { this.frame.remove(); }
      }};
      window.onYouTubeIframeAPIReady();` }));
    await page.goto(process.env.VIDEO_URL || "http://127.0.0.1:5173");
    await button("welcome.continue").click();
    await page.locator("#profileNameInput").fill("Әли");
    await page.locator('[data-age="6-8"]').click();
    await page.locator(".profile-submit").click();
    await page.locator(".cinema-poster").waitFor();
    const catalogue = videos.filter(video => video.language === language && video.ageBand === "6-8");
    for (const video of catalogue) {
      assert.equal(await page.locator("#video-title").innerText(), video.title);
      assert.equal(await page.locator(".cinema-actions a").getAttribute("href"), "https://www.youtube.com/watch?v=" + video.id);
      if (catalogue.length > 1) await button("videoCatalog.nextVideo").click();
    }
    const parents = button("grownUpsButton.parentsPressAndHold");
    const home = button("activityHeader.homeBackToActivities");
    const bounds = async () => Promise.all([parents.boundingBox(), home.boundingBox()]);
    await parents.focus();
    const before = await bounds();
    await page.keyboard.down("Space");
    await page.locator(".hold-pressed").waitFor();
    assert.deepEqual(await bounds(), before);
    await page.keyboard.up("Space");
    assert.deepEqual(await bounds(), before);
    await parents.press("Enter", { delay: 1600 });
    await page.getByRole("dialog").waitFor();
    const other = language === "kk" ? "en" : "kk";
    await page.getByRole("button", { name: other === "en" ? "EN" : "KZ", exact: true }).click();
    const otherVideo = videos.find(video => video.language === other && video.ageBand === "6-8");
    await page.waitForFunction(title => document.querySelector("#video-title")?.textContent === title, otherVideo.title);
    await page.getByRole("button", { name: language === "kk" ? "KZ" : "EN", exact: true }).click();
    await button("leaveGameDialog.keepPlaying").click();

    const startingXp = await xp();
    await page.locator(".cinema-poster").click();
    await page.waitForFunction(() => !!window.playerEvents);
    assert.match(await page.locator("iframe").getAttribute("src"), new RegExp(catalogue[0].id + ".*autoplay=1"));
    await page.evaluate(() => window.playerEvents.onError());
    await page.locator(".cinema-poster").waitFor();
    assert.equal(await xp(), startingXp);
    await page.evaluate(() => { window.playerEvents = null; });
    await page.locator(".cinema-poster").click();
    await page.waitForFunction(() => !!window.playerEvents);
    await page.evaluate(() => { window.playerEvents.onStateChange({ data: 1 }); window.playerEvents.onStateChange({ data: 1 }); });
    assert.equal(await xp(), startingXp + 5);
    if (catalogue.length > 1) {
      await page.evaluate(() => window.playerEvents.onStateChange({ data: 0 }));
      await button("videoCatalog.cancelAutoplay").click();
      assert.equal(await page.locator(".cinema-countdown").count(), 0);
      await page.evaluate(() => { window.playerEvents.onStateChange({ data: 1 }); window.playerEvents.onStateChange({ data: 0 }); });
      await page.locator('iframe[title="' + catalogue[1].title + '"]').waitFor();
      assert.equal(await xp(), startingXp + 5);
    }
    await button("video.playNow").click();
    for (let i = 0; i < 3; i++) {
      const prompt = await page.locator("#screen-mission .caption").innerText();
      const q = questions.find(q => q.ageBand === "6-8" && prompt.includes(dict["quiz." + q.id + ".question"]));
      assert.ok(q, prompt);
      const correct = language === "en" && i === 1;
      const index = q.choices.findIndex(choice => (choice === q.answer) === correct);
      await page.locator('[aria-label="' + dict["missionStage.quickReplies"] + '"] button').nth(index).click();
      assert.match(await page.locator("#screen-mission .caption").innerText(), correct ? /10/ : /0/);
      await button(i === 2 ? "quiz.finishQuiz" : "quiz.nextQuestion").click();
    }
    await page.locator("#screen-complete").waitFor();
    assert.equal(await xp(), startingXp + 5 + (language === "en" ? 10 : 0));
    assert.deepEqual(errors, []);
    await context.close();
    console.log(language, width, "catalogue, language switching, stable controls, player events and persisted quiz XP passed");
  }
} finally { await browser.close(); }
