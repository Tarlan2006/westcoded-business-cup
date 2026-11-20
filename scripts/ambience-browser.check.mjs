import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.SMOKE_URL??'http://127.0.0.1:5192';
const output=process.env.SMOKE_OUTPUT??'docs/audit-2026-11-17';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'no-preference'});const checks=[];
await page.addInitScript(()=>{
 localStorage.setItem('mypal.lang','en');
 localStorage.setItem('mission-control.sound','off');
 Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true}});
 const Native=window.AudioContext;
 window.AudioContext=class extends Native { constructor(...args){super(...args);this.auditGains=0;}
 createBufferSource(){const source=super.createBufferSource();const start=source.start.bind(source);
 source.start=(...args)=>{if(source.loop && source.buffer?.duration>5)window.auditLoops=(window.auditLoops||0)+1;return start(...args);};return source;}
 createGain(){const gain=super.createGain(),index=this.auditGains++;if(index===1){for(const method of ['setTargetAtTime','setValueAtTime']){const original=gain.gain[method].bind(gain.gain);gain.gain[method]=(...args)=>{window.auditMusicGain=args[0];return original(...args);};}}return gain;} };
});
try {
 await page.goto(base);await page.getByRole('button',{name:'CONTINUE',exact:true}).click();
 await page.getByLabel('What should AIdos call your child? *',{exact:true}).fill('Pal');await page.getByRole('button',{name:'6–8 yrs',exact:true}).click();await page.getByRole('button',{name:/START.*FOR/}).click();
 assert.equal(await page.locator('.amb-controls').count(),0,'No competing soundtrack in video');checks.push('video has no music');
 await page.getByRole('button',{name:'Home, back to activities',exact:true}).click();await page.getByRole('region',{name:'Start here',exact:true}).waitFor();
 assert.equal(await page.locator('.prototype').getAttribute('data-ambience'),'calm');assert(await page.locator('.amb-music-button').isDisabled());
 await page.getByRole('button',{name:'Sound off',exact:true}).click();await page.waitForFunction(()=>window.auditMusicGain>0);await page.waitForFunction(()=>window.auditLoops===1);checks.push('starts only after Sound gesture');
 await page.locator('.amb-music-button').click();await page.waitForFunction(()=>window.auditMusicGain===0);assert.equal(await page.evaluate(()=>localStorage.getItem('mypal.music')),'off');checks.push('independent music mute persists');
 await page.locator('.amb-music-button').click();await page.waitForFunction(()=>window.auditMusicGain>0);
 await page.getByRole('button',{name:'Parents, press and hold',exact:true}).press('Enter',{delay:1600});await page.getByRole('dialog').waitFor();await page.waitForFunction(()=>window.auditMusicGain===0);checks.push('parent dialog pauses');await page.getByRole('button',{name:'Keep playing',exact:true}).click();await page.waitForFunction(()=>window.auditMusicGain>0);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>window.auditMusicGain===0);checks.push('hidden tab pauses');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>window.auditMusicGain>0);
 for(const [title,theme]of [['Memory','patterns'],['Space Scale','cosmic'],['Sketch Artist','studio'],['Ask AIdos','curious']]){
  const before=await page.evaluate(()=>window.auditLoops);
  await page.locator('.activity-grid').getByRole('button',{name:new RegExp(title)}).click();await page.waitForFunction(t=>document.querySelector('.prototype')?.dataset.ambience===t,theme);
  await page.waitForFunction(previous=>window.auditLoops>previous,before);assert.equal(await page.locator('.amb-mark').count(),4);
  if(theme==='cosmic')await page.screenshot({path:output+'/cosmic-mobile.png',fullPage:true});
  if(title==='Ask AIdos'){
    await page.getByPlaceholder('Type your question').waitFor();
    await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=()=>new Promise((_,reject)=>setTimeout(()=>reject(new DOMException('Denied','NotAllowedError')),1000));});
    await page.locator('button.talk-button').focus();await page.keyboard.down('Space');await page.waitForFunction(()=>window.auditMusicGain===0);checks.push('microphone opening pauses music');await page.keyboard.up('Space');await page.waitForTimeout(1200);
  }
  await page.getByRole('button',{name:'Home, back to activities',exact:true}).first().click();const leave=page.getByRole('button',{name:'Leave game',exact:true});if(await leave.isVisible())await leave.click();await page.getByRole('region',{name:'Start here',exact:true}).waitFor();checks.push(title+' theme');
 }
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.amb-mark').first().evaluate(el=>getComputedStyle(el).animationName),'none');checks.push('reduced motion disables drift');
 await page.getByRole('button',{name:'Sound on',exact:true}).click();await page.waitForFunction(()=>window.auditMusicGain===0);checks.push('master Sound disables music');
 await writeFile(output+'/ambience-browser.json',JSON.stringify({base,checks,passed:true},null,2));console.log('PASS ambience browser controls, themes, microphone, visibility and reduced motion');
}finally{await browser.close()}
