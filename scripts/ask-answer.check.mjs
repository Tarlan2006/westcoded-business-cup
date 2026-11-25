import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import examples from "../shared/ask-examples-kk.json" with { type: "json" };
import { quickFaqAnswer } from "../shared/ask-faq.ts";
import kk from "../src/i18n/kk.ts";
import en from "../src/i18n/en.ts";

const base = process.env.SMOKE_URL || "http://localhost:5173";
const output = process.env.SMOKE_OUTPUT || "scripts/.cache/ask-answer";
const sizes = [[320, 640], [360, 740], [390, 844], [768, 1024], [844, 390], [1280, 800]];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const errors = [];

async function inspectSizes(page, state, lang) {
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    const mascot = page.locator(".learn-card .aidos-mascot");
    const rect = await mascot.boundingBox();
    assert(rect && rect.height >= 144, lang + " " + state + " mascot at " + width);
    assert(Math.abs(rect.width / rect.height - 320 / 496) < .01, "Sprite proportions at " + width);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Page overflow");
    if (state === "input") continue;
    const bubble = page.locator(".ask-answer");
    const box = await bubble.boundingBox();
    assert(box.x >= 0 && box.x + box.width <= width + 1);
    assert(await bubble.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    if (width <= 560) assert(box.y >= rect.y + rect.height - 1);
    else assert(box.x >= rect.x + rect.width - 1);
    if (state === "answer" && [390, 1280].includes(width)) {
      await page.locator(".ask-host").scrollIntoViewIfNeeded();
      await page.locator(".learn-card").screenshot({ path: output + "/" + lang + "-" + width + ".png" });
    }
  }
}

try {
  for (const [lang, dict] of [["kk", kk], ["en", en]]) {
    const page = await browser.newPage();
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.location().url + " " + m.text()); });
    await page.addInitScript(lang => {
      localStorage.setItem("mypal.lang", lang);
      localStorage.setItem("mission-control.progress", JSON.stringify({ selectedId: "scout", profiles: [{
        id: "scout", codenameId: "scout", ageBand: "6-8", lang, xp: 0,
        preferences: { location: "home", minutes: 30, first: "learn", nickname: "Aida" }
      }] }));
      localStorage.setItem("mission-control.session", JSON.stringify({ startedAt: Date.now(), sessionEndsAt: Date.now() + 1800000 }));
      window.answerStarts = [];
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) {
        if (!this.loop && this.buffer?.duration > 1 && this.buffer.getChannelData(0).some(v => Math.abs(v) > .03))
          window.answerStarts.push(this.buffer.duration);
        return start.apply(this, args);
      };
    }, lang);
    await page.goto(base);
    await page.locator(".activity-grid button").filter({ hasText: dict["activitySuggestions.ask"].replace("{brand}", "AIdos") }).first().click();
    await page.locator(".learn-card .aidos-mascot[data-ready]").waitFor();
    await inspectSizes(page, "input", lang);
    const button = key => page.getByRole("button", { name: dict[key], exact: true });
    const question = lang === "kk" ? examples.space[0].question : "Why is the sky blue?";
    await page.locator("textarea").fill(question);
    const expected = quickFaqAnswer(question, lang).answer;
    const index = await (await page.request.get(base + "/audio/" + lang + "/voice-index.json")).json();
    assert(index.texts[expected]);
    const served = page.waitForResponse(r => new URL(r.url()).pathname === index.texts[expected] && r.ok());
    const answerResponse = page.waitForResponse(r => new URL(r.url()).pathname === "/api/ask");
    await page.evaluate(() => { window.answerStarts.length = 0; });
    await button("ask.ask").click();
    assert((await answerResponse).ok());
    await served;
    await page.waitForFunction(() => window.answerStarts.length > 0);
    assert.equal(await page.locator(".ask-answer").innerText(), expected);
    await page.locator(".ask-host [data-emotion=speaking]").waitFor();
    const before = await page.evaluate(() => window.answerStarts.length);
    await button("ask.hearAnswer").click();
    await page.waitForFunction(n => window.answerStarts.length > n, before);
    await inspectSizes(page, "answer", lang);
    if (lang === "kk") {
      for (const {question} of Object.values(examples).flat()) {
        const response = await page.request.post(base + "/api/ask", { data: { lang, question } });
        const { answer, source } = await response.json();
        assert.equal(source, "faq");
        assert.equal(answer, quickFaqAnswer(question, lang).answer);
        assert(await page.evaluate(async path => {
          const context = new AudioContext();
          try {
            const r = await fetch(path);
            const clip = await context.decodeAudioData(await r.arrayBuffer());
            return r.ok && clip.duration > 1 && clip.getChannelData(0).some(x => Math.abs(x) > .03);
          } finally { await context.close(); }
        }, index.texts[answer]), question);
      }
      await button("ask.askAnother").click();
      await page.evaluate(() => {
        window.answerStarts.length = 0;
        window.systemSpeechCalls = 0;
        Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
          cancel() {}, getVoices: () => [{ name: "Other speaker", lang: "kk-KZ" }],
          speak() { window.systemSpeechCalls++; }
        }});
      });
      const answer = "Сен бүгін қандай жаңалық байқадың? ".repeat(5).trim();
      await page.route("**/api/ask", r => r.fulfill({ json: { answer, source: "llm" } }));
      await page.locator("textarea").fill("Бір сұрағым бар");
      await button("ask.ask").click();
      await page.waitForFunction(() => window.answerStarts.length > 0, undefined, {timeout: 100000});
      await inspectSizes(page, "long-answer", lang);
      const starts = await page.evaluate(() => window.answerStarts.length);
      await button("ask.hearAnswer").click();
      await page.waitForFunction(n => window.answerStarts.length > n, starts);
      assert.equal(await page.evaluate(() => window.systemSpeechCalls), 0);
      assert.equal(await page.getByText(dict["ask.voiceUnavailable"]).count(), 0);
    }
    // On a muted device even a delayed answer must remain silent.
    await page.evaluate(() => localStorage.setItem("mission-control.sound", "off"));
    await page.reload();
    await page.locator(".activity-grid button").filter({ hasText: dict["activitySuggestions.ask"].replace("{brand}", "AIdos") }).first().click();
    await page.unroute("**/api/ask");
    for (const answer of lang === "kk" ? ["Иә!", "Гүлдің жапырағы жарыққа қарай бұрылады. ".repeat(8).trim()]
      : ["Yes!", "A leaf turns towards the light as the plant grows. ".repeat(7).trim()]) {
      await page.route("**/api/ask", async r => {
        await new Promise(done => setTimeout(done, 150));
        await r.fulfill({ json: { answer, source: "llm" } });
      }, { times: 1 });
      await page.locator("textarea").fill(question);
      await button("ask.ask").click();
      await page.getByText(answer, {exact:true}).waitFor();
      await inspectSizes(page, "muted", lang);
      assert.equal(await button("ask.hearAnswer").count(), 0);
      assert.equal(await page.evaluate(() => window.answerStarts.length), 0);
      await button("ask.askAnother").click();
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log("PASS six viewport sizes, both languages, automatic playback, replay, speaking animation, all 14 Kazakh recordings and native fallback");
} finally { await browser.close(); }
