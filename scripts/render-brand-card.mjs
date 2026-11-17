import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
const image = (await readFile('public/mascot/aidos-wave@2x.webp')).toString('base64');
const font = (await readFile('public/fonts/fredoka-latin.woff2')).toString('base64');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>@font-face{font-family:Fredoka;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#140e49;color:#fff;font-family:Fredoka,sans-serif}.card{height:630px;padding:65px 80px;border:12px solid #5946e3;display:flex;align-items:center;justify-content:space-between;background:radial-gradient(ellipse at 90% 40%,#332179,transparent 70%)}h1{font-size:116px;margin:0 0 22px;color:#ffd13b}p{font-size:36px;line-height:1.3;max-width:650px;margin:0}.url{font-size:24px;margin-top:35px;color:#9bdcff}img{height:530px;width:auto;object-fit:contain}</style><div class="card"><section><h1>AIdos</h1><p>Playful adventures.<br>Learning games.<br>Friendly voice guidance.</p><div class="url">aidos.nexcel.kz</div></section><img src="data:image/webp;base64,${image}" alt="AIdos"></div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluate(img => img.decode());
  await page.screenshot({ path: 'public/og-image.png' });
  // Installation and home-screen icons use the same current brand, not legacy art.
  const icon = await readFile('public/aidos-icon.svg', 'utf8');
  for (const [size, file] of [[32, 'favicon.png'], [180, 'apple-touch-icon.png'], [512, 'icon-512.png']]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${icon}`);
    await page.screenshot({ path: `public/${file}` });
  }
} finally { await browser.close(); }
