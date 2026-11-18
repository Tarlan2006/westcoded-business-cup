import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { checkRenderedFonts } from "./font-rendering.mjs";
import en from "../src/i18n/en.ts";
import kk from "../src/i18n/kk.ts";

const base = process.env.I18N_URL || "http://localhost:5173";
const output = process.env.I18N_SCREENS || "docs/screens";
const sizes = [[360,740],[390,844],[768,1024],[1280,800]];
const browser = await chromium.launch({ headless: true, args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"], executablePath: process.env.CHROME_PATH || undefined });
const findings = new Set();
const rows = [];
async function journey(lang) {
  const dict = lang === "kk" ? kk : en;
  const label = (key) => dict[key].replaceAll("{brand}", "AIdos");
  const context = await browser.newContext({ viewport: { width:390, height:844 }, reducedMotion:"reduce" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  page.setDefaultTimeout(12000);
  const btn = key => page.getByRole("button", { name: label(key), exact: true });
  const tile = key => page.locator(".activity-grid").getByRole("button").filter({hasText:label(key)}).first().click();
  const directory = output + "/" + lang;
  await fs.mkdir(directory, {recursive:true});
  page.on("pageerror", e => findings.add(lang + " page error: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !m.text().includes("404 (Not Found)")) findings.add(lang + " console: " + m.text()); });
  page.on("response", r => { if (r.url().startsWith(base) && r.status() >= 400 && !r.url().endsWith("/i18n-missing-page")) findings.add(r.status() + " " + r.url()); });
  page.on("request", r => {
    if (r.resourceType() === "font" && new URL(r.url()).origin !== new URL(base).origin)
      findings.add("External font request: " + r.url());
    if (r.url().endsWith("/api/ask")) {
      const body = r.postDataJSON();
      if (Object.keys(body).sort().join() !== "lang,question" || body.lang !== lang) findings.add("Ask request fields or language");
    }
  });
  // Third-party video streams are outside the local build. Retain the real iframe URL.
  await context.route(/https:\/\/[^/]*(?:youtube|ytimg|googlevideo)[^/]*\//, route => route.fulfill({contentType:"text/html",body:""}));
  async function shot(name) {
    await page.evaluate(() => document.fonts.ready);
    for (const [width,height] of sizes) {
      await page.setViewportSize({width,height});
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      if (width === 390 || width === 1280) {
        try { await checkRenderedFonts(page, cdp); }
        catch (error) { throw Error(lang + " " + name + " " + width + ": " + error.message, { cause: error }); }
      }
      const info = await page.evaluate(() => {
        const visible = e => e.getClientRects().length && !e.closest("[hidden],[aria-hidden=true]");
        const labels = [...document.querySelectorAll("button,input,textarea,main,nav,[role=group],img")].filter(visible)
          .flatMap(e => ["aria-label","alt","title","placeholder"].map(a => e.getAttribute(a) || ""));
        const empty = [...document.querySelectorAll("button")].filter(visible).filter(e => !e.textContent.trim() && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby") && !e.querySelector("[aria-label],img[alt],title")).length;
        const cut = [];
        for (const button of [...document.querySelectorAll("button")].filter(visible)) {
          const bounds = button.getBoundingClientRect();
          const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
          while(walker.nextNode()) {
            const node = walker.currentNode;
            if(!node.textContent.trim() || node.parentElement.closest("svg,.sr-only,[aria-hidden=true]")) continue;
            const range = document.createRange(); range.selectNodeContents(node);
            const checkHeight = button.matches(".need-chip,.profile-submit");
            if ([...range.getClientRects()].some(rect => rect.width > 0 &&
              (rect.left < bounds.left-2 || rect.right > bounds.right+2 ||
               (checkHeight && (rect.top < bounds.top-2 || rect.bottom > bounds.bottom+2))))) cut.push(node.textContent.trim());
          }
        }
        return { text: [document.body.innerText,...labels].join(" "), empty, cut, width: document.documentElement.scrollWidth };
      });
      if (info.width > width + 1) findings.add(lang+" "+name+" overflow "+width+" -> "+info.width);
      if (info.cut.length) findings.add(lang+" "+name+" button overflow at "+width+": "+info.cut.join(", "));
      if (info.empty) findings.add(lang+" "+name+" unnamed buttons: "+info.empty);
      if (/undefined|\[object/.test(info.text)) findings.add(lang+" "+name+" invalid text");
      if (lang === "kk") {
        const latin = info.text.replace(/AIdos|KZ|EN|XP|YouTube|NASA Space Place|GUS ADVENTURES|Super Simple Songs|Joy Nest Kids|Cloudflare Workers AI|Groq|JavaScript/gi,"").match(/[a-z]+/gi);
        if (latin) findings.add(name+" English: "+[...new Set(latin)].join(" "));
      }
      if (width===390 || width===1280) await page.screenshot({path:directory+"/"+name+"-"+width+"x"+height+".png",fullPage:true,animations:"disabled"});
    }
    console.log(lang, name);
    rows.push(lang+"/"+name);
    await page.setViewportSize({width:390,height:844});
  }
  async function home() {
    const more = btn("missionSummary.moreGames");
    if (await more.isVisible()) await more.click();
    else await btn("activityHeader.homeBackToActivities").first().click();
    const leave = btn("leaveGameDialog.leaveGame");
    if (await leave.isVisible()) { if (!rows.includes(lang+"/leave-game")) await shot("leave-game"); await leave.click(); }
    await page.locator("#flow-start-title").waitFor();
  }
  async function parents() {
    await btn("grownUpsButton.parentsPressAndHold").press("Enter",{delay:1650});
    await page.getByRole("dialog").waitFor();
  }
  async function setup(age) {
    await page.locator("#profileNameInput").fill("Әлихан");
    await page.locator('[data-age="'+age+'"]').click();
    await page.locator(".profile-submit").click();
  }
  async function endSession() {
    await parents();
    await btn("sessionControls.endSessionNow").click();
    await btn("sessionComplete.backToStart").click();
  }
  try {
    await page.goto(base);
    await page.locator("#screen-greeting").waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"),"kk");
    assert.equal(await page.locator("#screen-greeting h1").innerText(),kk["welcome.heyPalReadyForAScreenFree"]);
    if (lang === "en") await page.getByRole("button",{name:"EN",exact:true}).click();
    await btn("welcome.continue").waitFor();
    await page.reload();
    await page.locator("#screen-splash").waitFor(); await shot("splash");
    await btn("welcome.continue").waitFor();
    // Disable sound through the actual greeting control while navigating.
    const sound=page.locator("#screen-greeting button[aria-pressed]").last();
    if(await sound.getAttribute("aria-pressed")==="true") await sound.click();
    await shot("greeting");
    await btn("welcome.continue").click();
    await page.locator("#profileNameInput").fill("Әбдірахманмұхаммед");
    await page.locator("#profileNotesInput").fill("құпия жазба");
    await page.getByRole("button",{name:lang==="kk"?"EN":"KZ",exact:true}).click();
    await page.getByRole("button",{name:lang==="kk"?"KZ":"EN",exact:true}).click();
    assert.equal(await page.locator("#profileNotesInput").inputValue(),"құпия жазба");
    assert.equal(await page.locator("#profileNameInput").inputValue(),"Әбдірахманмұхаммед");
    await page.locator("#profileNotesInput").fill("");
    await shot("setup");
    await page.locator("#modeCardTurbo").click(); await shot("setup-active"); await page.locator("#modeCardBrain").click();
    await setup("6-8");
    await page.locator("#screen-video").waitFor();
    await shot("video");
    await page.locator(".video-frame-content button").click();
    assert.match(await page.locator("iframe").getAttribute("src"),/youtube-nocookie/);
    await page.locator("#screen-video button").filter({hasText:label("video.playNow")}).click();
    for(let i=0;i<3;i++) {
      
      const choice=page.locator('[aria-label="'+label("missionStage.quickReplies")+'"] button').first();
      await choice.waitFor();
      if(!i)await shot("video-quiz");
      await choice.click();
      await btn(i===2?"quiz.finishQuiz":"quiz.nextQuestion").click();
    }
    await page.locator("#screen-complete").waitFor();
    await shot("complete");
    await home();
    await shot("hub");
    await page.getByRole("button",{name:label("home.garage"),exact:false}).click();
    await shot("garage");
    await btn("garage.awesome").click();
    await parents();
    await shot("parents");
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0].xp);
    await page.getByRole("button",{name:lang==="kk"?"EN":"KZ",exact:true}).click();
    await page.getByRole("button",{name:lang==="kk"?"KZ":"EN",exact:true}).click();
    await btn("leaveGameDialog.keepPlaying").click();
    await page.reload();
    await page.locator("#flow-start-title").waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"),lang);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("mission-control.progress")).profiles[0].xp),before);
    for(const [key,name,selector] of [
      ["activitySuggestions.memory","memory",".memory-grid"],["activitySuggestions.ticTacToe","tic-tac-toe",".ttt-board"],
      ["sketchGame.sketchArtist","sketch",".sk-title"],["spaceGame.spaceScale","space",".sp-button-primary"],
      ["activitySuggestions.quiz","quiz",".quiz-card"],["premium.dinoDig","plans",".plan-card"]
    ]) {
      await tile(key); await page.locator(selector).first().waitFor(); await shot(name);
      // The live navigation guard intentionally waits five seconds before confirming an exit.
      if(name==="tic-tac-toe") await page.waitForTimeout(5050);
      if(name==="memory") {
        const pairs=await page.locator(".memory-card .memory-front").evaluateAll(nodes=>{const groups=new Map();nodes.forEach((n,i)=>{const art=n.innerHTML;groups.set(art,[...(groups.get(art)||[]),i])});return [...groups.values()]});
        for(const pair of pairs) {assert.equal(pair.length,2);for(const i of pair) await page.locator(".memory-card").nth(i).click(); await page.locator(".memory-card").nth(pair[0]).and(page.locator("[data-matched=true]")).waitFor();}
        await page.getByRole("dialog").waitFor(); await shot("memory-result");
        await btn("memory.trySomethingElse").click(); await page.locator(".recon-reward").waitFor();
      }
      if(name==="sketch") {
        await btn("sketchGame.startTheCase").click(); await shot("sketch-canvas");
        await btn("sketchGame.iMDone").click(); await btn("sketchGame.saveMyPicture").waitFor(); await shot("sketch-result");
      }
      if(name==="space") { await btn("spaceGame.startExploring").click(); await shot("space-journey");
        const picker=page.locator(".sp-stop-picker select");
        if(await picker.isVisible()) await picker.selectOption("7"); else await page.locator(".sp-stop").last().click();
        await btn("journey.startQuiz").click(); await shot("space-quiz");
        for(let i=0;i<5;i++){await page.locator(".sp-choice").first().click(); await page.locator(".sp-quiz-feedback + button, .sp-quiz button.sp-button-primary").last().click();}
        await page.locator(".sp-result").waitFor(); await shot("space-result");
        await page.locator(".sp-result button").click(); await page.locator(".recon-reward").waitFor(); await shot("reward"); }
      await home();
    }
    await tile("content.scavengerHunt"); await btn("setup.startGame").waitFor(); await shot("mission-setup");
    await btn("setup.startGame").click(); await btn("mission.pause").waitFor(); await shot("mission");
    await page.getByRole("button").filter({hasText:label("mission.iDidIt")}).click();
    await btn("mission.pause").click(); await shot("mission-paused");
    await btn("mission.endMission").click(); await btn("missionSummary.moreGames").waitFor(); await shot("mission-result"); await home();
    for (const [mode, key] of [["lava","content.floorIsLava"], ["roadtrip","content.roadtripSpy"]]) {
      if (mode === "roadtrip") {await tile("content.scavengerHunt"); await btn("profileSetup.inTheCar").click();} else await tile(key);
      await btn("setup.startGame").click(); await btn("mission.pause").waitFor(); await shot(mode);
      await btn("mission.pause").click(); await btn("mission.endMission").click(); await btn("missionSummary.moreGames").waitFor(); await home();
    }
    await tile("activitySuggestions.ask"); await page.locator(".ask-suggestions").waitFor(); await shot("ask");
    await context.grantPermissions(["microphone"]);
    const transcript=lang==="kk"?"мысық туралы":"tell me about cats";
    await page.route("**/api/stt?*", route=>{ assert.equal(new URL(route.request().url()).searchParams.get("lang"),lang); return route.fulfill({json:{text:transcript}}); });
    const mic=page.locator("button.talk-button"); await mic.focus(); await page.keyboard.down("Space");
    await page.locator("button.talk-button[data-recording=true]").waitFor(); await page.waitForTimeout(650); await page.keyboard.up("Space");
    await page.waitForFunction(value=>document.querySelector("textarea")?.value===value,transcript); await shot("ask-transcript");
    await page.unroute("**/api/stt?*");
    await page.getByRole("textbox").fill(lang==="kk"?"Аспан неге көгілдір?":"Why is the sky blue?");
    await btn("ask.ask").click(); await btn("ask.askAnother").waitFor(); await shot("ask-answer"); await home();
    await endSession(); await setup("3-5"); await page.locator("#screen-video").waitFor(); await home();
    await tile("app.balloonCount"); await page.locator(".bl-balloon").first().waitFor(); await shot("balloons");
    for(let round=0;round<5;round++) {
      await btn("balloonsGame.iCounted").click(); await page.locator(".bl-answer").first().waitFor();
      if(!round) await shot("balloons-answer");
      await page.locator(".bl-answer").first().click();
      if(!round) await shot("balloons-feedback");
      await btn("balloonsGame.nextRound").click();
    }
    await page.locator(".bl-final").waitFor(); await shot("balloons-result");
    await page.locator(".bl-final").getByRole("button").first().click(); await home();
    await endSession();
    // Deliver player events in local tests without contacting the third-party player.
    await page.evaluate(()=>{window.YT={Player:class {
      constructor(_,opts){this.events=opts.events;window.playerTestEvents=this.events;queueMicrotask(()=>this.events.onReady({target:this}));}
      playVideo(){this.events.onStateChange({data:1});} pauseVideo(){this.events.onStateChange({data:2});} mute(){} unMute(){} destroy(){}
    }}});
    await setup("1-2"); await page.locator("#screen-toddler-cinema").waitFor(); await shot("toddler-cinema");
    await page.evaluate(()=>window.playerTestEvents.onError()); await shot("toddler-video-error");
    await btn("toddlerCinema.tryAgain").click(); await page.waitForFunction(()=>!!document.querySelector(".toddler-player") || !!window.playerTestEvents);
    await page.evaluate(()=>window.playerTestEvents.onStateChange({data:0})); await page.locator(".animal-sounds").first().waitFor(); await shot("animal-sounds");
    await page.locator(".toddler-card").nth(1).click(); await shot("toddler-break");
    await btn("toddlerCinema.stayOnABreak").click(); await shot("toddler-rest");
    await btn("toddlerCinema.exploreAnimalSoundsWith").click(); await page.locator('[aria-label="'+label("missionStage.quickReplies")+'"] button').first().waitFor(); await shot("animal-quiz");
    await page.clock.install(); await page.clock.fastForward(22*60*1000);
    await btn("sessionComplete.backToStart").waitFor(); await shot("session-end");
    await page.clock.resume();
    await page.goto(base+"/privacy"); await page.getByRole("heading",{name:label("app.privacy"),exact:true}).waitFor(); await shot("privacy");
    await page.goto(base+"/i18n-missing-page"); await page.getByRole("link").waitFor(); await shot("404");
    const clips=await page.evaluate(async lang=>{
      const response=await fetch("/audio/"+lang+"/manifest.json"); if(!response.ok)throw Error("manifest");
      const {clips}=await response.json(), audio=new AudioContext();
      try { for(const file of new Set(Object.values(clips))){const r=await fetch(file);if(r.status!==200 || (await audio.decodeAudioData(await r.arrayBuffer())).duration<=0)throw Error(file);} }
      finally {await audio.close();}
      return Object.keys(clips);
    },lang);
    const catalog=JSON.parse(await fs.readFile("content/voice/catalog.json","utf8"));
    for(const {id} of catalog)assert(clips.includes(id),id);
    console.log(lang,clips.length,"clip IDs verified");
  } finally {await context.close();}
}
try {
  for(const lang of (process.env.I18N_LANGS || "kk,en").split(",")) await journey(lang);
  assert.deepEqual([...findings],[]);
} finally { if(findings.size) console.error([...findings].join("\n")); await browser.close(); }
console.log(rows.length+" screens checked at four sizes");
