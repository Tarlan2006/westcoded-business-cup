import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";
import { gradientContrast } from "./design-contrast.mjs";

const browser = process.env.DESIGN_BROWSER === "webkit"
  ? await webkit.launch()
  : await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const base = process.env.I18N_URL || "http://localhost:5173";

try {
  for (const lang of ["kk", "en"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await context.route(/https:\/\/[^/]*(?:youtube|ytimg|googlevideo)[^/]*\//, route => route.fulfill({ contentType: "text/html", body: "" }));
    await context.addInitScript(lang => localStorage.setItem("mypal.lang", lang), lang);
    const page = await context.newPage();
    await page.goto(base);
    const start = page.locator("#screen-greeting .btn-lime");
    await start.waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"), lang);
    const greetingRatio = await start.evaluate(gradientContrast);
    for (let i = 0; i < 12 && !(await start.evaluate(e => e === document.activeElement)); i++) await page.keyboard.press("Tab");
    assert(await start.evaluate(e => e.matches(":focus-visible") && parseFloat(getComputedStyle(e).outlineWidth) >= 2));
    await page.keyboard.press("Enter");
    await page.locator("#screen-profile-setup h1:focus").waitFor();
    const nickname = page.locator("#profileNameInput");
    await nickname.click();
    await page.keyboard.insertText("Әбдірахманмұхаммед");
    assert.equal(await nickname.inputValue(), "Әбдірахманмұхаммед");
    const submit = page.locator(".profile-submit:enabled");
    await submit.waitFor();
    const setupRatio = await submit.evaluate(gradientContrast);
    assert(greetingRatio >= 4.5 && setupRatio >= 4.5);
    await page.locator(".profile-custom-time input").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    assert(await page.locator(".profile-custom-time").evaluate(e =>
      e.contains(document.activeElement) && parseFloat(getComputedStyle(e).outlineWidth) >= 2));
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await page.evaluate(() => document.fonts.ready);
    const bounds = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth, viewport: innerWidth,
      controls: [...document.querySelectorAll(".profile-setup button,.profile-field")].filter(element =>
        element.getClientRects().length && element.getBoundingClientRect().right > innerWidth + 1
      ).map(element => element.textContent.trim()),
    }));
    assert(bounds.page <= bounds.viewport + 1 && !bounds.controls.length, JSON.stringify(bounds));
    await page.evaluate(() => document.documentElement.style.removeProperty("font-size"));
    await page.setViewportSize({ width: 320, height: 740 });
    await page.locator('[data-age="1-2"]').click();
    await submit.click();
    const autoplay = page.locator(".toddler-autoplay");
    await autoplay.waitFor();
    const fits = await autoplay.evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const box = element.getBoundingClientRect();
      return document.documentElement.scrollWidth === innerWidth && [...range.getClientRects()].every(rect =>
        rect.left >= box.left - 1 && rect.right <= box.right + 1);
    });
    assert(fits, "Autoplay label exceeds its touch region");
    await autoplay.click();
    assert.equal(await autoplay.getAttribute("aria-checked"), "false");
    if (lang === "kk" && process.env.DESIGN_PROOF) await page.locator(".toddler-queue").screenshot({ path: process.env.DESIGN_PROOF });
    console.log(lang, "keyboard, 200% setup and 320px autoplay passed; lowest contrast", greetingRatio.toFixed(2), setupRatio.toFixed(2));
    await context.close();
  }
} finally {
  await browser.close();
}
