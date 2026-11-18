// Run against the built site. FFMPEG points to a full ffmpeg binary.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const base = process.env.SMOKE_URL || 'http://127.0.0.1:5191';
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const output = 'docs/mascot/recordings';
const cache = 'scripts/.cache/mascot-motion';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const report = [];
try {
  for (const [width,height] of [[390,844],[360,740],[768,1024],[1280,800]]) {
    for (const lang of ['kk','en']) {
      const name = lang+'-'+width+'x'+height;
      const dir = path.resolve(cache, name);
      await fs.mkdir(dir, {recursive:true});
      const page = await browser.newPage({viewport:{width,height}});
      const errors = [];
      page.on('pageerror', e=>errors.push(e.message));
      page.on('console', m=>{if(m.type()==='error') errors.push(m.text());});
      await page.addInitScript(lang=>{
        localStorage.setItem('mypal.lang', lang);
        localStorage.setItem('mission-control.sound','on');
        const start = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function(...args) {
          if (!this.loop && this.buffer?.duration > .1 && !window.clipStart) {
            window.clipStart = performance.timeOrigin+performance.now();
          }
          return start.apply(this,args);
        };
      },lang);
      await page.goto(base);
      const greeting = page.locator('#screen-greeting [data-ready="true"]');
      await greeting.waitFor();
      const session = await page.context().newCDPSession(page);
      await session.send('Page.enable');
      const frames = [];
      session.on('Page.screencastFrame', ({data,metadata,sessionId})=>{
        frames.push({time:metadata.timestamp, data});
        void session.send('Page.screencastFrameAck',{sessionId}).catch(()=>{});
      });
      await session.send('Page.startScreencast',{format:'jpeg',quality:84,everyNthFrame:1});
      const preview = width === 390;
      await page.evaluate(preview => {
        window.forms = { idle:new Set(),wave:new Set(),talk:new Set() };
        let last = 0;
        let recorder, monitor;
        if (preview) {
          const layer = document.createElement('canvas');
          layer.width=208; layer.height=300;
          monitor=layer.getContext('2d');
          const stream=layer.captureStream(25);
          recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:650000});
          const chunks=[];
          recorder.ondataavailable=e=>chunks.push(e.data);
          window.previewBlob=new Promise(resolve=>{recorder.onstop=()=>resolve(new Blob(chunks));});
          recorder.start();
        }
        const poll = now=>{
          const candidates=[...document.querySelectorAll('.aidos-mascot[data-running="true"]')];
          const host=candidates.find(n=>n.dataset.motion==='talk') || candidates.find(n=>n.classList.contains('video-mascot')) || candidates.at(-1);
          if(host) {
            const image=host.querySelector('canvas');
            window.forms[host.dataset.motion].add(Number(image.dataset.frame));
            if(monitor && now-last>=35) {
              last=now;
              const m=new DOMMatrixReadOnly(getComputedStyle(image).transform);
              monitor.fillStyle='#f8f5ed';monitor.fillRect(0,0,208,300);
              monitor.save();monitor.translate(104,296);
              monitor.scale(m.a,m.d);
              monitor.drawImage(image,-94,-292+m.f*.6,188,292);
              monitor.restore();
            }
          }
          window.auditFrame=requestAnimationFrame(poll);
        };
        window.auditFrame=requestAnimationFrame(poll);
        window.endPreview=()=>{cancelAnimationFrame(window.auditFrame);recorder?.stop();};
      },preview);
      await page.waitForTimeout(2450);
      await page.locator('#screen-greeting button').last().click();
      await page.waitForFunction(()=>window.forms.talk.size >= 3);
      await page.waitForFunction(()=>!document.querySelector('[data-motion="talk"]'));
      await page.locator('#profileNameInput').fill('Ali');
      await page.locator('[data-age="6-8"]').click();
      await page.locator('.profile-submit').click();
      const idle=page.locator('.video-mascot[data-ready="true"]');
      await idle.scrollIntoViewIfNeeded();
      await idle.waitFor();
      await page.waitForTimeout(10300);
      const result=await page.evaluate(()=>{
        window.endPreview();
        return { start:window.clipStart, forms:Object.fromEntries(Object.entries(window.forms).map(([m,s])=>[m,[...s].sort()])) };
      });
      const end = await page.evaluate(()=>Date.now()/1000);
      await session.send('Page.stopScreencast');
      if(preview) {
        const data=await page.evaluate(async()=>Array.from(new Uint8Array(await (await window.previewBlob).arrayBuffer())));
        await fs.writeFile(path.join(cache,lang+'-preview.webm'),Buffer.from(data));
      }
      await page.close();
      assert.deepEqual(errors,[],name);
      assert.equal(result.forms.idle.length,5,name+' eyelids');
      assert.equal(result.forms.wave.length,8,name+' wave');
      assert.deepEqual(result.forms.talk,[0,1,2,3,4],name+' mouth');
      const list=[];
      for(let i=0;i<frames.length;i++) {
        const file=i+'.jpg';
        await fs.writeFile(path.join(dir,file),Buffer.from(frames[i].data,'base64'));
        list.push("file '"+file+"'",'duration '+Math.max(.001,(frames[i+1]?.time ?? end)-frames[i].time).toFixed(4));
      }
      list.push("file '"+(frames.length-1)+".jpg'");
      const concat=path.join(dir,'frames.txt');
      await fs.writeFile(concat,list.join('\n'));
      const offset=Math.max(0,result.start/1000-frames[0].time);
      const manifest=JSON.parse(await fs.readFile('public/audio/'+lang+'/manifest.json','utf8'));
      const clip='public'+manifest.clips.common_setup_greeting;
      execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,
        '-itsoffset',String(offset),'-i',clip,'-map','0:v','-map','1:a','-vf','fps=25','-c:v','libx264',
        '-preset','veryfast','-crf','25','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',output+'/'+name+'.mp4']);
      report.push({name,frames:frames.length,seconds:end-frames[0].time,audioOffset:offset,forms:result.forms,errors});
      await fs.writeFile(path.join(cache,'recordings.json'),JSON.stringify(report,null,2));
      console.log('PASS',name,result.forms,'seconds',(end-frames[0].time).toFixed(1));
    }
  }
  const sequence = [
    '[0:v]trim=start=8:end=11.8,setpts=PTS-STARTPTS[idle]',
    '[0:v]trim=start=0.12:end=2.48,setpts=PTS-STARTPTS[wave]',
    '[0:v]trim=start=2.63:end=5.35,setpts=PTS-STARTPTS[kk]',
    '[1:v]trim=start=2.58:end=5.15,setpts=PTS-STARTPTS[en]',
    '[idle][wave][kk][en]concat=n=4:v=1:a=0,fps=20[v]'
  ].join(';');
  execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',cache+'/kk-preview.webm',
    '-i',cache+'/en-preview.webm','-filter_complex',sequence,'-map','[v]','-an',
    '-c:v','libwebp_anim','-quality','82','-loop','0','docs/mascot/aidos-preview.webp']);
} finally { await browser.close(); }
