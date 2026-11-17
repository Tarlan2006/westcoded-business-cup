import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const base=process.env.SMOKE_URL??'http://127.0.0.1:5197';
assert(new URL(base).hostname==='127.0.0.1','Use a local Vite dev server for direct module tests');
const out='scripts/.cache/3d-audit';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
const page=await browser.newPage();const requests=[],errors=[];
page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
  localStorage.setItem('mission-control.sound','off');
  window.audioStarts=[];window.oscillators=0;
  const Original=window.AudioContext;
  window.AudioContext=class extends Original {
    createBufferSource(){const n=super.createBufferSource(),start=n.start.bind(n);n.start=(...args)=>{if(n.buffer?.duration>.1&&!n.loop)window.audioStarts.push(performance.now());return start(...args)};return n;}
    createOscillator(){window.oscillators++;return super.createOscillator();}
  };
});
try {
  await page.goto(base+'/privacy');
  await page.evaluate(async()=>{
    window.engine=await import('/src/audio/engine.ts');
    const b=document.createElement('button');b.id='audit-unlock';b.textContent='Unlock audio';b.onclick=()=>window.engine.unlock();document.body.append(b);
  });
  await page.locator('#audit-unlock').click();
  const repeats=await page.evaluate(async()=>{
    const rows=[];
    for(let i=0;i<3;i++){
      window.engine.stopSpeech();const before=window.audioStarts.length,t=performance.now();
      await window.engine.playQueue(['common_setup_greeting']);
      rows.push({iteration:i+1,startMs:window.audioStarts[before]-t,starts:window.audioStarts.length-before});
    }
    return rows;
  });
  assert(repeats.every(r=>r.starts===1&&r.startMs<1000),JSON.stringify(repeats));
  await page.route('**/common_recall_08.mp3*',async route=>{await new Promise(r=>setTimeout(r,2000));await route.continue();});
  const replacement=await page.evaluate(async()=>{
    const old=window.engine.playQueue(['common_recall_08']);
    await new Promise(r=>setTimeout(r,100));window.engine.stopSpeech();
    const before=window.audioStarts.length,t=performance.now();
    const next=window.engine.playQueue(['common_setup_greeting']);
    await Promise.all([old,next]);
    return {startMs:window.audioStarts[before]-t,starts:window.audioStarts.length-before};
  });
  assert(replacement.startMs<300&&replacement.starts===1,JSON.stringify(replacement));
  await page.evaluate(()=>{for(let i=0;i<10;i++)for(const cue of ['tick','radio','siren'])window.engine.playSfx(cue);});
  assert.equal(await page.evaluate(()=>window.oscillators),0,'No repeated electronic cues');
  assert(!requests.some(url=>/huggingface|safetensors|pocket-tts|onnx/.test(url)),'No live model downloads');
  assert.equal(errors.length,0,errors.join('\n'));
  const catalogue=JSON.parse(await readFile('content/voice/catalog.json','utf8'));
  const lines=[catalogue.find(r=>r.text.includes('cow say')),catalogue.find(r=>r.text.includes('round green mask')),catalogue.find(r=>r.text.startsWith('Yes! 3 balloons')),catalogue.find(r=>r.text.includes('scatter blue'))].map(r=>r.text);
  const gamePlayback=await page.evaluate(async lines=>{const results=[];for(const text of lines){const before=window.audioStarts.length,t=performance.now();await window.engine.speakFallback(text);results.push({text,startMs:window.audioStarts[before]-t,starts:window.audioStarts.length-before});}return results;},lines);
  assert(gamePlayback.every(r=>r.starts===1&&r.startMs<1000),JSON.stringify(gamePlayback));
  assert(!requests.some(url=>url.endsWith('/api/voice')),'Fixed game/FAQ lines must use prepared voice assets');
  const retry=await browser.newPage();let manifestAttempts=0;
  await retry.route('**/audio/manifest.json*',route=>++manifestAttempts===1?route.fulfill({status:503,body:''}):route.continue());
  await retry.goto(base+'/privacy');
  await retry.evaluate(async()=>{window.engine=await import('/src/audio/engine.ts');const b=document.createElement('button');b.id='retry-unlock';b.textContent='Unlock';b.onclick=()=>window.engine.unlock();document.body.append(b)});
  await retry.locator('#retry-unlock').click();await retry.waitForTimeout(150);
  await retry.evaluate(()=>window.engine.playQueue(['common_setup_greeting']));
  assert(manifestAttempts>=2,'Manifest must recover after a transient failure');await retry.close();
  await writeFile(out+'/audio-latency.json',JSON.stringify({repeats,replacement,gamePlayback,manifestAttempts,errors,passed:true},null,2));
  console.log('PASS three actual MP3 plays, cancelled slow fetch, no stale speech, no repeated beeps, no model download',repeats,replacement);
} finally {await browser.close();}
