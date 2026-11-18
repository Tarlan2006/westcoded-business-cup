import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
const base=process.env.SMOKE_URL??'http://127.0.0.1:5201';
const out=process.env.SMOKE_OUTPUT??'scripts/.cache/unified-voice/browser';await mkdir(out,{recursive:true});
const voice='aidos-luna-v1';
const manifest=await(await fetch(base+'/audio/en/manifest.json')).json();assert.equal(manifest.voice,voice);
assert.equal((await(await fetch(base+'/audio/en/voice-index.json')).json()).voice,voice);
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[],requests=[];let voiceRequests=0;
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.addInitScript(()=>{
 localStorage.setItem('mypal.lang','en');localStorage.setItem('mission-control.sound','on');window.voiceStarts=[];window.voiceActive=0;window.deviceSpeech=0;window.beepCount=0;
 Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak(){window.deviceSpeech++;throw new Error('Device voice must never run')},cancel(){},getVoices(){return []},addEventListener(){}}});
 const Original=AudioContext;window.AudioContext=class extends Original{
  createBufferSource(){const n=super.createBufferSource(),start=n.start.bind(n);n.start=(...args)=>{if(n.buffer?.duration>.1&&!n.loop){window.voiceStarts.push({at:performance.now(),duration:n.buffer.duration});window.voiceActive++;n.addEventListener('ended',()=>window.voiceActive--,{once:true});}return start(...args)};return n;}
  createOscillator(){window.beepCount++;return super.createOscillator();}
 };
});
const sample=await readFile('public'+manifest.clips.common_setup_greeting);
await page.route('**/api/ask',r=>r.fulfill({json:{answer:'Wheels turn to help things move.',source:'llm'}}));
await page.route('**/api/voice',r=>{voiceRequests++;return r.fulfill({contentType:'audio/mpeg',headers:{'X-AIdos-Voice':voice},body:sample});});
try{
 await page.goto(base);await page.getByRole('button',{name:'CONTINUE',exact:true}).waitFor();await page.locator('.aid-frames').evaluate(async node=>{const image=new Image();image.src=node.getAttribute('href');await image.decode()});
 await page.screenshot({path:out+'/exact-reference.png'});
 await page.getByRole('button',{name:'CONTINUE',exact:true}).click();await page.waitForFunction(()=>window.voiceStarts.length>0);await page.waitForFunction(()=>window.voiceActive===0);
 await page.getByLabel('What should AIdos call your child? *',{exact:true}).fill('Pal');await page.getByRole('button',{name:'6–8 yrs',exact:true}).click();await page.getByRole('button',{name:/START.*FOR/}).click();
 await page.getByRole('button',{name:'Home, back to activities',exact:true}).click();await page.locator('.activity-grid').getByRole('button',{name:/Ask AIdos/}).click();
 await page.getByPlaceholder('Type your question').fill('How do wheels work?');await page.getByRole('button',{name:'Ask',exact:true}).click();await page.waitForFunction(()=>window.voiceStarts.length>=2);await page.waitForFunction(()=>window.voiceActive===0);
 for(let i=0;i<3;i++){const count=await page.evaluate(()=>window.voiceStarts.length);await page.getByRole('button',{name:'Hear answer',exact:true}).click();await page.waitForFunction(n=>window.voiceStarts.length>n,count);await page.waitForFunction(()=>window.voiceActive===0);}
 assert.equal(voiceRequests,1,'Repeated answer uses decoded cache');assert.equal(await page.evaluate(()=>window.deviceSpeech),0);assert.equal(await page.evaluate(()=>window.beepCount),0);
 assert(!requests.some(p=>/renderer-|guide.glb|pocket-tts|huggingface/.test(p)));
 assert(await page.locator('.aid-frames').evaluateAll(images=>images.length>0 && images.every(i=>i.getAttribute('href')==='/mascot/frames/guide.webp')));
 assert.equal(errors.length,0,errors.join('\n'));
 await page.screenshot({path:out+'/ask.png',fullPage:true});
 await writeFile(out+'/unified-voice.json',JSON.stringify({base,voice,voiceRequests,replays:3,deviceVoiceCalls:0,beeps:0,errors,passed:true},null,2));
 console.log('PASS guide frames, one voice, three Ask replays, decoded cache, no device speech, no beeps or heavy models');
}finally{await browser.close();}
