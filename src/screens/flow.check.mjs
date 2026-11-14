/** Optional end-to-end flow checks. Uses the existing external Playwright runtime. */
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const { chromium } = await import(process.env.FLOW_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.FLOW_PLAYWRIGHT_MODULE).href : "playwright");
const base = process.env.FLOW_SITE_URL ?? "http://127.0.0.1:5175";
const output = resolve("design/screens");
const questions = JSON.parse(await readFile("content/quiz.json", "utf8"));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.FLOW_CHROME ? { executablePath: process.env.FLOW_CHROME } : {}) });
const results = [], errors = [];
function pass(message) { results.push(message); console.log(`PASS ${message}`); }
async function open(width) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, hasTouch: width < 600, reducedMotion: "reduce" });
  await context.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: {
      speak(utterance) { setTimeout(() => utterance.onend?.(), 0); }, cancel() {}, getVoices: () => [],
    } });
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/ask", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ answer: "Air scatters blue sunlight more than other colors, so the sky looks blue.", source: "faq" }) }));
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<p>Video player test fixture</p>" }));
  await page.goto(base);
  await page.getByRole("heading", { name: "Mission Control", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { page, context };
}
async function layout(page, label, width, screenshot = true) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: no horizontal overflow at ${width}`);
  const missingFocus = await page.locator('button:visible:not(:disabled), a[href]:visible, input:visible:not(:disabled), select:visible, textarea:visible:not(:disabled)').evaluateAll((nodes) => nodes.filter((node) => node.tabIndex < 0 || node.closest('[inert]')).map((node) => node.textContent || node.getAttribute('aria-label')));
  assert.deepEqual(missingFocus, [], `${label}: controls participate in keyboard navigation`);
  const root = await page.locator('dialog[open]').count() ? page.locator('dialog[open]') : page.locator('body');
  const buttons = root.locator('button:visible:not(:disabled), a[href]:visible');
  const total = await buttons.count();
  await buttons.evaluateAll((nodes) => nodes.forEach((node, index) => node.setAttribute('data-flow-focus-check', String(index))));
  await root.evaluate((node) => { node.tabIndex = -1; node.focus(); });
  const reached = new Set();
  for (let step = 0; step < total * 3 + 20 && reached.size < total; step++) {
    await page.keyboard.press('Tab');
    const index = await page.evaluate(() => document.activeElement?.getAttribute('data-flow-focus-check'));
    if (index !== null) reached.add(index);
  }
  assert.equal(reached.size, total, `${label}: every enabled button/link is reachable with Tab`);
  await buttons.evaluateAll((nodes) => nodes.forEach((node) => node.removeAttribute('data-flow-focus-check')));
  await page.mouse.move(1, 1);
  if (screenshot) await page.screenshot({ path: resolve(output, `flow-${label}-${width}.png`), fullPage: true });
}
async function setup(page, age = "6–8", first = "Think & learn", location = "At home") {
  await page.getByRole("radio", { name: new RegExp(age) }).check();
  if (age !== "1–2") {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: location, exact: true }).click();
    await page.getByRole("button", { name: first, exact: true }).click();
  }
  await page.getByRole("button", { name: "See activities", exact: true }).click();
  await page.getByRole("region", { name: "Start here", exact: true }).waitFor();
}
function tile(page, name) { return page.locator('.activity-grid').getByRole("button", { name: new RegExp(name) }); }
async function home(page) { await page.getByRole("button", { name: "Home, back to activities", exact: true }).click(); }
async function finishQuiz(page) {
  for (let turn = 0; turn < 30; turn++) {
    await page.locator(".quiz-card h2").waitFor();
    const text = await page.locator(".quiz-card h2").innerText();
    const question = questions.find((item) => item.question === text);
    assert(question, `known quiz question: ${text}`);
    await page.locator(".answer-list").getByRole("button", { name: question.answer, exact: true }).click();
    const finish = page.getByRole("button", { name: "Finish quiz", exact: true });
    if (await finish.count()) { await finish.click(); break; }
    await page.getByRole("button", { name: "Next question", exact: true }).click();
  }
  await page.getByRole("heading", { name: "Nice work, agent!", exact: true }).waitFor();
}

try {
  if (process.env.FLOW_EXTRA_ONLY === "1") {
    for (const width of [390, 1280]) {
      const { page, context } = await open(width);
      await page.getByRole("radio", { name: /6–8/ }).check();
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await page.getByRole("button", { name: "Think & learn", exact: true }).click();
      await page.getByRole("link", { name: "Privacy", exact: true }).click();
      await page.getByRole("heading", { name: "Privacy", exact: true }).waitFor();
      await layout(page, "privacy", width);
      await page.getByRole("button", { name: "Back", exact: true }).click();
      assert(await page.getByText("Step 2 of 2: where and what first", { exact: true }).isVisible());
      assert.equal(await page.getByRole("button", { name: "Think & learn", exact: true }).getAttribute("aria-pressed"), "true");
      await page.getByRole("button", { name: "See activities", exact: true }).click();
      await page.getByRole("link", { name: "Privacy", exact: true }).scrollIntoViewIfNeeded();
      const y = await page.evaluate(() => scrollY);
      await page.getByRole("link", { name: "Privacy", exact: true }).click();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await page.waitForTimeout(100);
      assert(Math.abs(await page.evaluate(() => scrollY) - y) < 2);
      for (const activity of ["Memory", "Tic-tac-toe"]) {
        await tile(page, activity).click();
        await page.waitForTimeout(5100);
        await home(page);
        await page.getByRole("dialog", { name: "Leave this game?" }).waitFor();
        await page.keyboard.press("Escape");
        assert.equal(await page.getByRole("dialog").count(), 0);
        await home(page);
        await page.getByRole("button", { name: "Leave game", exact: true }).click();
        await page.getByRole("region", { name: "Start here", exact: true }).waitFor();
      }
      await page.reload();
      await page.getByRole("region", { name: "Start here", exact: true }).waitFor();
      await context.close();
      pass(`${width}px: Privacy preserves unfinished form and prior scroll; Memory/Tic-tac-toe Home is guarded; Escape keeps playing; reload returns to saved hub`);
    }
  } else for (const width of [390, 1280]) {
    const { page, context } = await open(width);
    await layout(page, "welcome", width);
    assert(await page.getByText("Progress stays on this device", { exact: true }).isVisible());
    await page.getByRole("radio", { name: /6–8/ }).check();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    assert(await page.getByText("Step 2 of 2: where and what first", { exact: true }).isVisible());
    await page.getByRole("button", { name: "← Back", exact: true }).click();
    assert(await page.getByRole("radio", { name: /6–8/ }).isChecked());
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Think & learn", exact: true }).click();
    await page.getByRole("button", { name: "See activities", exact: true }).click();
    await layout(page, "hub", width);
    const start = page.getByRole("region", { name: "Start here", exact: true });
    assert(await start.getByRole("heading", { name: "Ask Mission Control", exact: true }).isVisible());
    pass(`${width}px: first visit explains the product; two-step setup preserves choices; Learn recommendation is Ask`);

    const grown = page.getByRole("button", { name: "Grown-ups settings, press and hold for one and a half seconds", exact: true });
    await grown.click();
    assert.equal(await page.getByRole("heading", { name: "Parent settings", exact: true }).count(), 0);
    await grown.focus(); await page.keyboard.down("Space"); await page.waitForTimeout(200); await page.keyboard.up("Space");
    assert.equal(await page.getByRole("heading", { name: "Parent settings", exact: true }).count(), 0);
    const bounds = await grown.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); await page.mouse.down();
    await page.waitForTimeout(700);
    await page.screenshot({ path: resolve(output, `flow-hold-${width}.png`), fullPage: true });
    await page.waitForTimeout(900); await page.mouse.up();
    await page.getByRole("heading", { name: "Parent settings", exact: true }).waitFor();
    await layout(page, "settings", width);
    assert(await page.getByText("Changes apply right away", { exact: true }).isVisible());
    await page.getByRole("button", { name: "20 min", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Saved ✓" }).waitFor();
    await page.getByRole("status").filter({ hasText: "Saved ✓" }).waitFor({ state: "detached", timeout: 4000 });
    for (const key of ["Enter", "Space"]) {
      await grown.focus(); await page.keyboard.down(key); await page.waitForTimeout(1600); await page.keyboard.up(key);
      await page.getByRole("heading", { name: "Parent settings", exact: true }).waitFor();
      assert(await page.getByRole("button", { name: "20 min", exact: true }).getAttribute("aria-pressed") === "true");
      await page.getByRole("button", { name: "Back", exact: true }).click();
    }
    pass(`${width}px: short tap/Space do nothing; pointer/Enter/Space hold opens settings; save returns home with a two-second status`);

    await start.getByRole("button", { name: /Start/ }).click();
    await page.getByRole("textbox", { name: "Your question" }).fill("Why is the sky blue?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await page.locator(".ask-answer").waitFor();
    const answer = await page.locator(".ask-answer").innerText();
    await page.getByRole("button", { name: "Quick quiz about this" }).click();
    assert.equal(await page.getByRole("navigation", { name: "Breadcrumb" }).filter({ visible: true }).innerText(), "Learn › Ask Mission Control › Quick quiz");
    await page.waitForTimeout(5100);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("dialog", { name: "Leave this game?" }).waitFor();
    await layout(page, "leave-game", width);
    await page.getByRole("button", { name: "Keep playing", exact: true }).click();
    assert(await page.locator(".quiz-card").isVisible());
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Leave game", exact: true }).click();
    assert.equal(await page.locator(".ask-answer").innerText(), answer);
    await layout(page, "ask-return", width);
    await home(page);
    pass(`${width}px: Ask → topic quiz → confirmed Back restores the same answer; Keep playing leaves the quiz intact`);

    await tile(page, "Quiz").click(); await finishQuiz(page);
    await layout(page, "quiz-reward", width);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0].activities.quiz);
    assert.equal(await page.locator(".flow-next-grid button").count(), 2);
    await page.getByRole("button", { name: "↻ Play again", exact: true }).click();
    assert(await page.getByText(/Question 1 of/).isVisible());
    await page.getByRole("button", { name: "Back", exact: true }).click();
    assert(await page.getByRole("region", { name: "Start here", exact: true }).isVisible());
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0].activities.quiz), before);
    await tile(page, "Quiz").click(); await finishQuiz(page);
    await page.locator(".flow-next-grid").getByRole("button", { name: /Memory/ }).click();
    await page.getByRole("heading", { name: "Memory", exact: true }).waitFor();
    await layout(page, "try-next", width, false);
    await home(page);
    pass(`${width}px: completed quiz offers Play again and two working Try next choices; replay doesn't duplicate XP`);

    await tile(page, "Scavenger Hunt").click();
    await page.getByRole("button", { name: "Start mission", exact: true }).click();
    await page.waitForTimeout(5100);
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Leave game", exact: true }).click();
    await page.getByRole("heading", { name: "Mission setup", exact: true }).waitFor();
    await page.getByRole("button", { name: "Start mission", exact: true }).click();
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page.getByRole("button", { name: "End mission", exact: true }).click();
    await page.getByRole("heading", { name: "Mission complete.", exact: true }).waitFor();
    await layout(page, "mission-results", width);
    await page.getByRole("button", { name: "↻ Play again", exact: true }).click();
    await page.getByRole("region", { name: "Mission", exact: true }).waitFor();
    await home(page);
    pass(`${width}px: Mission Back returns to setup after confirmation; mission results offer a fresh replay`);
    await context.close();

    const toddler = await open(width);
    await setup(toddler.page, "1–2");
    await layout(toddler.page, "toddler", width);
    assert.equal(await toddler.page.getByRole("heading", { name: "Learn", exact: true }).count(), 0);
    assert.equal(await toddler.page.getByRole("heading", { name: "Move", exact: true }).count(), 0);
    await toddler.page.getByRole("region", { name: "Start here", exact: true }).getByRole("button").click();
    await toddler.page.locator(".activity-grid button").first().click();
    await toddler.page.locator("iframe").waitFor();
    await toddler.page.getByRole("button", { name: "Back", exact: true }).click();
    assert(await toddler.page.locator(".activity-grid button").first().isVisible());
    await home(toddler.page); await toddler.context.close();
    pass(`${width}px: ages 1–2 skip step two, only see videos, and can return from player to library to hub`);

    const preschool = await open(width);
    await setup(preschool.page, "3–5", "Watch a video");
    await layout(preschool.page, "preschool-locked", width);
    assert(await preschool.page.getByRole("region", { name: "Start here", exact: true }).getByRole("heading", { name: "Quiz", exact: true }).isVisible());
    assert.equal(await tile(preschool.page, "Ask Mission Control|Tic-tac-toe|Sketch Artist").count(), 0);
    await tile(preschool.page, "Video library").click(); await finishQuiz(preschool.page);
    await layout(preschool.page, "video-reward", width);
    assert.match(await preschool.page.locator(".flow-next-grid button").first().innerText(), /Watch your video reward/);
    await preschool.page.locator(".flow-next-grid button").first().click();
    await preschool.page.locator(".activity-grid button").first().waitFor();
    await home(preschool.page);
    await layout(preschool.page, "preschool-unlocked", width);
    assert(await preschool.page.getByRole("region", { name: "Start here", exact: true }).getByRole("heading", { name: "Video library", exact: true }).isVisible());
    await tile(preschool.page, "Video library").click();
    await preschool.page.getByRole("heading", { name: "Video library", exact: true }).waitFor();
    await preschool.context.close();
    pass(`${width}px: preschool video lock routes to quiz, first reward is video, and video remains unlocked`);

    const car = await open(width);
    await setup(car.page, "6–8", "Move & play", "In the car");
    assert(await car.page.getByRole("region", { name: "Start here", exact: true }).getByRole("heading", { name: "Roadtrip Spy", exact: true }).isVisible());
    await car.context.close();
    pass(`${width}px: In the car + Move recommends Roadtrip Spy`);
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, process.env.FLOW_EXTRA_ONLY === "1" ? "flow-navigation-extra.json" : "flow-verification.json"), JSON.stringify({ viewports: [390, 1280], askApi: "deterministic FAQ fixture; worker unchanged", video: "embedded player fixture; navigation verified", physicalPhoneTested: false, results, browserErrors: errors }, null, 2) + "\n");
  pass("All flow scenarios passed without browser errors");
} finally { await browser.close(); }
