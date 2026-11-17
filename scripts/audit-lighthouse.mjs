import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const root = process.env.LIGHTHOUSE_ROOT;
if (!root) throw new Error('Set LIGHTHOUSE_ROOT to the directory containing the installed lighthouse package');
const { snapshot } = await import(pathToFileURL(`${root}/lighthouse/core/index.js`));
const { default: puppeteer } = await import(pathToFileURL(`${root}/puppeteer-core/lib/puppeteer/puppeteer-core.js`));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--remote-debugging-port=9225'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await context.addInitScript(() => localStorage.setItem('mission-control.sound', 'off'));
const page = await context.newPage();
const pup = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9225' });
const output = process.env.AUDIT_OUTPUT ?? 'docs/audit';
await mkdir(output, { recursive: true });
const base = process.env.SMOKE_URL ?? 'http://127.0.0.1:5183';
const scores = [];
async function capture(name) {
  await page.waitForTimeout(500);
  const pp = (await pup.pages()).find(p => p.url().startsWith(base));
  const result = await snapshot(pp, { flags: { onlyCategories: ['accessibility', 'best-practices', 'seo'], logLevel: 'error' } });
  await writeFile(`${output}/after-${name}-snapshot.json`, JSON.stringify(result.lhr));
  scores.push({ screen: name, scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v]) => [k, v.score === null ? null : Math.round(v.score*100)])), failures: Object.values(result.lhr.audits).filter(a=>a.score !== null && a.score < 1).map(a=>({id:a.id,title:a.title,items:a.details?.items})) });
  console.log(name, scores.at(-1).scores);
}
try {
  await page.goto(base);
  await page.getByRole('button', { name: 'CONTINUE', exact: true }).click();
  await page.getByRole('button', { name: /START.*FOR/ }).waitFor();
  await capture('setup');
  await page.getByLabel('What should AIdos call your child? *', {exact:true}).fill('AuditPal');
  await page.getByRole('button', {name:'6–8 yrs',exact:true}).click();
  await page.getByRole('button', {name:/START.*FOR/}).click();
  await page.getByRole('main',{name:'Video library'}).waitFor();
  await capture('video');
  await page.getByRole('button',{name:'Home, back to activities',exact:true}).click();
  await page.getByRole('region',{name:'Start here',exact:true}).waitFor();
  await capture('hub');
  await page.locator('.activity-grid').getByRole('button',{name:/Ask AIdos/}).click();
  await page.getByPlaceholder('Type your question').waitFor();
  await capture('ask');
  await page.getByRole('button',{name:'Home, back to activities',exact:true}).click();
  await page.locator('.activity-grid').getByRole('button',{name:/Sketch Artist/}).click();
  await page.getByRole('button',{name:/Start the case/}).click();
  await page.getByRole('button',{name:/I'm done/}).click();
  await page.getByRole('button',{name:/Save my picture/}).waitFor();
  await capture('sketch-reveal');
} finally {
  await writeFile(`${output}/state-accessibility.json`,JSON.stringify(scores,null,2));
  await pup.disconnect(); await browser.close();
}
