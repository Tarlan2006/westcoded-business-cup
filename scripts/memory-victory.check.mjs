import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, devices } from "playwright";

const base = process.env.SMOKE_URL || "http://127.0.0.1:5173";
const output = process.env.SMOKE_OUTPUT || "scripts/.cache/memory-victory";
const mode = process.env.MEMORY_TEST_MODE || "normal";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });

// Simulate the browser delivering a hidden and a visible record together after opening a dialog.
function delayDialogVisibility() {
  const NativeObserver = window.IntersectionObserver;
  window.IntersectionObserver = class extends NativeObserver {
    constructor(callback, options) {
      super((entries, observer) => {
        const entry = entries.at(-1);
        if (entry.isIntersecting && entry.target.closest(".memory-victory")) {
          const hidden = {
            target: entry.target, time: entry.time - 1, boundingClientRect: entry.boundingClientRect,
            intersectionRect: new DOMRect(), rootBounds: entry.rootBounds, isIntersecting: false,
            intersectionRatio: 0,
          };
          setTimeout(() => callback([hidden, ...entries], observer), 1650);
        } else callback(entries, observer);
      }, options);
    }
  };
}

function monitorVictory() {
  const snapshots = [];
  window.memoryWins = snapshots;
  let current;
  function observe() {
    const dialog = document.querySelector(".memory-victory[open]");
    const host = dialog?.querySelector(".aidos-mascot");
    if (host && host !== current) {
      const samples = [];
      snapshots.push(samples);
      const start = performance.now();
      const canvas = host.querySelector("canvas");
      const thumb = document.createElement("canvas");
      thumb.width = 80;
      thumb.height = 112;
      const ctx = thumb.getContext("2d", { willReadFrequently: true });
      let previous, changeTime = start, last = -Infinity;
      function sample(now) {
        if (!dialog.open || !host.isConnected) return;
        if (now - last >= 40) {
          last = now;
          const css = getComputedStyle(canvas);
          const m = new DOMMatrix(css.transform === "none" ? undefined : css.transform);
          const w = canvas.clientWidth, h = canvas.clientHeight;
          if (w && h) {
            const z = Math.min(thumb.width / w, thumb.height / h);
            const factor = Math.min(w / canvas.width, h / canvas.height);
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fillStyle = "#201740";
            ctx.fillRect(0,0,thumb.width,thumb.height);
            ctx.translate(thumb.width/2,thumb.height);
            ctx.scale(z,z);
            ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);
            ctx.drawImage(canvas, -canvas.width*factor/2, -canvas.height*factor, canvas.width*factor, canvas.height*factor);
            const pixels = ctx.getImageData(0,0,thumb.width,thumb.height).data;
            let changed = 0;
            if (previous) for (let i=0;i<pixels.length;i+=4) {
              if (Math.abs(pixels[i]-previous[i])+Math.abs(pixels[i+1]-previous[i+1])+Math.abs(pixels[i+2]-previous[i+2]) >= 18) changed++;
            }
            samples.push({ t: now-start, state: host.dataset.emotion, lift: -m.f/h, gap: now-changeTime });
            if (!previous || changed >= 32) { previous = pixels; changeTime = now; }
          }
        }
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }
    current = host;
  }
  new MutationObserver(observe).observe(document, { childList:true, subtree:true, attributes:true, attributeFilter:["open"] });
}

async function run(lang, width) {
  const height = width === 390 ? 844 : 800;
  const folder = output + "/" + mode + "-" + lang + "-" + width;
  await mkdir(folder, { recursive:true });
  const context = await browser.newContext({
    ...(width === 390 ? devices["Pixel 7"] : {}), viewport:{width,height}, deviceScaleFactor:1,
    reducedMotion:mode === "reduced" ? "reduce" : "no-preference",
    ...(process.env.MEMORY_VIDEO ? {recordVideo:{dir:folder, size:{width,height}}} : {}),
  });
  const errors = [], results = [];
  try {
    await context.addInitScript(({lang}) => {
      const id = "scout";
      if (localStorage.getItem("mission-control.progress")) return;
      localStorage.setItem("mypal.lang",lang);
      localStorage.setItem("mission-control.progress", JSON.stringify({selectedId:id,profiles:[{
        id, codenameId:id, ageBand:"6-8", xp:0, lang, preferences:{location:"home", minutes:30, first:"learn", nickname:"Aida"},
      }]}));
      const now=Date.now();
      localStorage.setItem("mission-control.session",JSON.stringify({startedAt:now,sessionEndsAt:now+1800000}));
    }, {lang});
    if (mode === "race") await context.addInitScript(delayDialogVisibility);
    await context.addInitScript(monitorVictory);
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(base);
    await page.locator(".activity-grid").first().waitFor().catch(async error => {
      throw new Error([lang, width, error.message, ...errors, await page.locator("body").innerText()].join("\n"));
    });
    assert.equal(await page.locator("html").getAttribute("lang"),lang);
    await page.locator(".activity-grid button").filter({hasText:lang === "kk" ? "Сыңарын тап" : "Memory"}).first().click();
    const wins = mode === "normal" ? 3 : 1;
    for (let n=0;n<wins;n++) {
      const cards = page.locator(".memory-card");
      await cards.first().waitFor();
      const pairs = await cards.locator(".memory-front").evaluateAll(icons => {
        const groups = new Map();
        icons.forEach((icon,i) => groups.set(icon.innerHTML,[...(groups.get(icon.innerHTML) || []),i]));
        return [...groups.values()];
      });
      assert.equal(pairs.length,8);
      for (const pair of pairs) {
        assert.equal(pair.length,2);
        for (const i of pair) await cards.nth(i).click();
        await cards.nth(pair[0]).and(page.locator("[data-matched=true]")).waitFor();
      }
      const dialog = page.locator(".memory-victory[open]");
      await dialog.waitFor();
      const verify = async () => {
        await page.waitForFunction(index => window.memoryWins[index]?.at(-1)?.t > 6500, results.length, {timeout:14000});
        const frames = await page.evaluate(() => window.memoryWins.at(-1));
        const cheer = frames.filter(f=>f.state==="correct");
        const idle = frames.filter(f=>f.state==="idle");
        assert.ok(cheer.length, "Victory never appeared; states: "+[...new Set(frames.map(f=>f.state))].join(",")+"; errors: "+errors.join(","));
        assert.ok(idle.length && frames.at(-1).state==="idle", "Victory did not return to idle");
        assert.ok(idle[0].t-cheer[0].t >= 1100 && idle[0].t-cheer[0].t < 1800, "Incomplete celebration");
        const lift = Math.max(...cheer.map(f=>f.lift));
        const maxGap = Math.max(...frames.map(f=>f.gap));
        if (mode === "reduced") assert.equal(Math.abs(lift),0);
        else {
          assert.ok(lift > .035, "No visible jump");
          assert.ok(maxGap < (mode === "race" ? 2400 : 1500), "Still frame: "+maxGap);
        }
        results.push({cheerMs:Math.round(cheer[0].t),idleMs:Math.round(idle[0].t),maxGapMs:Math.round(maxGap),jumpPercent:+(100*lift).toFixed(1)});
      };
      await verify();
      if (!n && mode !== "race") {
        await page.keyboard.press("Escape");
        await page.locator(".memory-show-result").click();
        await verify();
      }
      if (n+1 < wins) await dialog.locator(".memory-play-again").click();
    }
    assert.deepEqual(errors,[]);
    const video = page.video();
    await context.close();
    await writeFile(folder+"/result.json",JSON.stringify({lang,width,height,wins,results,video:video ? await video.path() : null},null,2));
    console.log("PASS",mode,lang,width,wins,"wins",JSON.stringify(results));
  } finally { await context.close(); }
}

try {
  if (mode === "normal") {
    for (const lang of ["en","kk"]) {
      for (const width of [390,1280]) await run(lang,width);
    }
  } else await run("en",1280);
} finally { await browser.close(); }
