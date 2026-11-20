import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.SMOKE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.SMOKE_OUTPUT ?? 'scripts/.cache/mascot-motion';
await fs.mkdir(output,{recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH});
try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto(base);
  const host=page.locator('#screen-greeting .aidos-mascot[data-ready="true"]');
  await host.waitFor();
  const performanceData=await host.evaluate(async node=>{
    const gaps=[], boxes=new Set(), blends=new Map();
    const image=node.querySelector('canvas');
    const frames=new Set();
    const shifts=[];
    const observer=new PerformanceObserver(list=>shifts.push(...list.getEntries().map(e=>e.value)));
    observer.observe({type:'layout-shift'});
    const bounds=()=>{const r=node.getBoundingClientRect();return [r.x,r.y,r.width,r.height].join(',');};
    let previous=performance.now();
    const until=previous+1750;
    await new Promise(resolve=>{
      const tick=now=>{
        if(now>previous) gaps.push(now-previous);
        previous=now;
        frames.add(image.dataset.frame);
        boxes.add(bounds());
        if(now<until) requestAnimationFrame(tick);else resolve();
      };
      requestAnimationFrame(tick);
    });
    observer.disconnect();
    // A transition must produce pixels between its two stored endpoint poses.
    let old=image.dataset.frame;
    while(image.dataset.frame===old) await new Promise(r=>requestAnimationFrame(r));
    const start=performance.now();
    while(performance.now()-start<700) {
      const strip=image.getContext('2d').getImageData(205,70,99,23).data;
      let hash=0;
      for(let i=3;i<strip.length;i+=20)hash=(hash*31+strip[i])|0;
      const set=blends.get(image.dataset.frame) ?? new Set();
      set.add(hash);blends.set(image.dataset.frame,set);
      await new Promise(r=>requestAnimationFrame(r));
    }
    const sorted=gaps.slice().sort((a,b)=>a-b);
    return {frames:[...frames], distinctBlendImages:Math.max(...[...blends.values()].map(s=>s.size)), boxes:boxes.size,
      cls:shifts.reduce((a,b)=>a+b,0), fps:1000*gaps.length/gaps.reduce((a,b)=>a+b,0),
      p95Ms:sorted[Math.floor(sorted.length*.95)], maxMs:Math.max(...gaps)};
  });
  assert.equal(performanceData.frames.length,8);
  assert.equal(performanceData.boxes,1);
  assert.equal(performanceData.cls,0);
  assert(performanceData.distinctBlendImages>2);
  assert(performanceData.p95Ms<50,'4x CPU p95 frame interval');
  await host.evaluate(e=>{e.style.transform='translateX(200vw)';});
  await page.waitForFunction(()=>document.querySelector('#screen-greeting [data-running="false"]'));
  const paused=await host.locator('canvas').evaluate(n=>n.toDataURL());
  await page.waitForTimeout(330);
  assert.equal(await host.locator('canvas').evaluate(n=>n.toDataURL()),paused);
  await host.evaluate(e=>{e.style.transform='';});
  await page.waitForFunction(()=>document.querySelector('#screen-greeting [data-running="true"]'));
  // Exercise the visibility listener explicitly in headless Chrome.
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal(await host.getAttribute('data-running'),'false');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('#screen-greeting [data-running="false"]'));
  assert.equal(await host.locator('canvas').evaluate(n=>n.getAnimations().length),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  await page.goto(base+'/404.html');
  await page.locator('main img').evaluate(n=>n.decode());
  assert.deepEqual(errors,[]);
  console.log('PASS CPU x4, crossfade, unchanged bounds, offscreen, visibility, reduced motion, 404',performanceData);
  await fs.writeFile(output+'/performance.json',JSON.stringify(performanceData,null,2));

  await page.addInitScript(()=>{
    const connect=AudioNode.prototype.connect;
    AudioNode.prototype.connect=function(target,...args){
      if (this instanceof GainNode && target instanceof AnalyserNode) window.voiceGain=this;
      return connect.call(this,target,...args);
    };
  });
  await page.goto(base);
  await page.locator('#screen-greeting button').last().click();
  await page.locator('canvas[data-mouth="3"]').first().waitFor();
  const silentCloseMs=await page.evaluate(async()=>{
    const canvas=document.querySelector('canvas[data-mouth]');
    const voice=window.voiceGain;
    const guide=new Image();guide.src='/mascot/frames/guide.webp?v=4';await guide.decode();
    const target=document.createElement('canvas');target.width=51;target.height=31;
    const reference=target.getContext('2d');reference.drawImage(guide,416,496,51,31,0,0,51,31);
    const expected=reference.getImageData(0,0,51,31).data;
    const ctx=canvas.getContext('2d');
    const start=performance.now();voice.gain.value=0;
    while(performance.now()-start<500) {
      await new Promise(r=>requestAnimationFrame(r));
      if(canvas.dataset.mouth!=='0')continue;
      const actual=ctx.getImageData(154,127,51,31).data;
      if(actual.every((v,i)=>Math.abs(v-expected[i])<=1))return performance.now()-start;
    }
    throw Error('Mouth did not finish closing during the clip');
  });
  assert(silentCloseMs<205,'silent release '+silentCloseMs);
  console.log('PASS recorded silence to fully closed lips',Math.round(silentCloseMs),'ms');
  await fs.writeFile(output+'/speech.json',JSON.stringify({silentCloseMs}));
  await page.addInitScript(()=>{
    localStorage.setItem('mission-control.sound','on');
    window.SpeechSynthesisUtterance=class {};
    Object.defineProperty(window,'speechSynthesis',{value:{
      getVoices:()=>[{lang:'kk-KZ'}],speak:u=>{window.utterance=u;},cancel(){}
    }});
  });
  await page.route('**/audio/kk/*.mp3*',r=>r.abort());
  await page.goto(base);
  await page.locator('#screen-greeting button').last().click();
  await page.waitForFunction(()=>Boolean(window.utterance));
  assert.equal(await page.locator('[data-motion="talk"]').count(),0);
  await page.evaluate(()=>window.utterance.onstart());
  await page.waitForFunction(()=>document.querySelector('canvas[data-mouth]:not([data-mouth="0"])'));
  await page.evaluate(()=>window.utterance.onboundary({name:'word'}));
  const pauseMs=await page.evaluate(async()=>{
    const now=performance.now();window.utterance.onpause();
    while(document.querySelector('[data-motion="talk"]')) await new Promise(r=>requestAnimationFrame(r));
    return performance.now()-now;
  });
  assert(pauseMs>=105 && pauseMs<220,'release length '+pauseMs);
  await page.evaluate(()=>window.utterance.onresume());
  await page.locator('[data-motion="talk"]').first().waitFor();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>!document.querySelector('[data-motion="talk"]'));
  await page.getByRole('button',{name:'EN',exact:true}).click();
  await page.evaluate(()=>window.utterance.onend());
  assert.equal(await page.locator('[data-motion="talk"]').count(),0);
  console.log('PASS boundary, pause, resume, reduced motion and late end; release',Math.round(pauseMs),'ms');
  const recovery = await browser.newPage();
  let offline = true;
  let failedRequests = 0;
  await recovery.route('**/mascot/frames/guide.webp*', route => {
    if (!offline) return route.continue();
    failedRequests++;
    return route.abort();
  });
  await recovery.goto(base);
  await recovery.waitForTimeout(1600);
  assert(failedRequests >= 2, 'Retry the first interrupted atlas load');
  const recovered = recovery.locator('#screen-greeting .aidos-mascot');
  assert.equal(await recovered.getAttribute('data-ready'), null);
  offline = false;
  await recovery.evaluate(() => window.dispatchEvent(new Event('online')));
  await recovery.locator('#screen-greeting .aidos-mascot[data-ready="true"]').waitFor();
  console.log('PASS first-load failure, bounded retry, online recovery without reload');
} finally { await browser.close(); }
