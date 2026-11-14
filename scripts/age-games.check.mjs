import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.VIDEO_PLAYWRIGHT).href);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  for (const age of ['6–8 yrs', '3–5 yrs']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript(() => localStorage.setItem('mission-control.sound', 'off'));
    await page.goto(process.env.VIDEO_URL ?? 'http://127.0.0.1:5178');
    await page.getByRole('button', { name: 'CONTINUE', exact: true }).click();
    await page.getByLabel('What should MyPal call your child? *', { exact: true }).fill('Pal');
    await page.getByRole('button', { name: age, exact: true }).click();
    await page.getByRole('button', { name: /^START SESSION FOR/ }).click();
    await page.getByRole('button', { name: 'Home, back to activities', exact: true }).click();
    const older = age === '6–8 yrs';
    for (const title of ['Memory', 'Balloon Count']) {
      assert.equal(await page.locator('.activity-grid').getByRole('button', { name: new RegExp(title) }).count(), older && title === 'Balloon Count' ? 0 : 1);
    }
    if (older) assert.doesNotMatch(await page.getByRole('main').innerText(), /Balloon Count/);
    // Open the existing video -> three-question quiz -> Complete path.
    await page.locator('.activity-grid').getByRole('button', { name: /Video library/ }).click();
    await page.getByRole('button', { name: /Play with MyPal Now/ }).click();
    for (let index = 0; index < 3; index++) {
      await page.locator('[aria-label="Quick replies"]').getByRole('button').first().click();
      await page.getByRole('button', { name: index === 2 ? 'Finish quiz' : 'Next question', exact: true }).click();
    }
    await page.locator('#screen-complete').waitFor();
    if (older) assert.doesNotMatch(await page.getByRole('main').innerText(), /Balloon Count/);
    else assert.equal(await page.getByRole('button', { name: /Memory/ }).count(), 1);
    console.log(`PASS ${age}: Parent Setup, Hub/Start here and Complete recommendations`);
    await page.close();
  }
} finally { await browser.close(); }
