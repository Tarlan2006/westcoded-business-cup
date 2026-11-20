import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const dir=process.env.SMOKE_OUTPUT || 'docs/mascot/emotions';
const cache='scripts/.cache/mascot-emotions';
await mkdir(dir,{recursive:true});
await mkdir(cache,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
const errors=[];
try {
  const page=await browser.newPage({viewport:{width:680,height:610},recordVideo:{dir:cache,size:{width:680,height:610}}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto((process.env.DEV_URL || 'http://127.0.0.1:5188')+'/scripts/mascot-lab/');
  const guide=page.locator('.stage [data-ready]');
  await guide.waitFor();
  // A changing syllable must not postpone the end of the transition to speaking.
  await page.evaluate(async () => {
    const {painter, loadGuide} = await import('/src/components/mascotPainter.ts');
    if (!await loadGuide()) throw Error('Missing mascot atlas');
    function surface() {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 496;
      return canvas;
    }
    const canvas = surface(), reference = surface();
    const draw = painter(canvas);
    draw('idle', 0, 0, true);
    draw('talk', 0, 10, false);
    draw('talk', 1, 36, false);
    draw('talk', 2, 61, false);
    draw('talk', 3, 85, false);
    painter(reference)('talk', 3, 85, true);
    const head = c => c.getContext('2d').getImageData(0, 0, 320, 127).data;
    const expected = head(reference);
    if (head(canvas).some((v,i) => Math.abs(v-expected[i])>1)) {
      throw Error('Speech restarted the whole-body transition');
    }
  });
  const rect=await guide.boundingBox();
  await page.evaluate(()=>{
    const marker=document.createElement('div');
    marker.style='position:fixed;left:0;top:0;width:8px;height:8px;background:#00ff00';
    document.body.append(marker);
    window.samples=[];window.soundStarts=[];window.startMark=performance.now();
    const start=AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...args){
      if(!this.loop && this.buffer?.duration>.2)window.soundStarts.push((performance.now()-window.startMark)/1000);
      return start.apply(this,args);
    };
    const canvas=document.querySelector('.aid-frames');
    window.timer=setInterval(()=>window.samples.push({
      ms:Math.round(performance.now()-window.startMark),state:canvas.parentElement.dataset.emotion,
      art:canvas.parentElement.dataset.motion,frame:+canvas.dataset.frame,transform:canvas.style.transform,
    }),150);
  });
  const expect=state=>page.waitForFunction(s=>document.querySelector('.aidos-mascot').dataset.emotion===s,state);
  async function select(state,ms){
    await page.locator('[data-event="'+state+'"]').click();
    await expect(state);
    await page.waitForTimeout(ms);
  }
  await page.waitForTimeout(30700);
  await select('greeting',2200);
  await select('listening',3700);
  await select('thinking',5100);
  await select('correct',850);
  await select('wrong',1200);
  await expect('idle'); // Let the entire encouragement finish before starting a different clip.
  await select('speaking',500);
  await expect('idle');
  // Repeat the silent playback condition that froze the previous version.
  await page.locator('[data-event="silent"]').click();
  await expect('speaking');
  await page.waitForTimeout(5400);
  await select('network',400);
  await select('thinking',250);
  await select('listening',250);
  await select('correct',200);
  await expect('idle');
  await page.waitForFunction(()=>performance.now()-window.startMark>=61400);
  const log=await page.evaluate(()=>{clearInterval(window.timer);return {rows:window.samples,soundStarts:window.soundStarts};});
  assert.equal(log.rows[0].state,'idle');
  assert(log.rows.filter(r=>r.ms<30000&&r.frame>=7).length>1);
  assert(log.rows.at(-1).ms>61000);
  const states=[...new Set(log.rows.map(r=>r.state))];
  assert.equal(states.length,8);
  const video=page.video();await page.close();await video.saveAs(cache+'/panel.webm');
  await writeFile(dir+'/timeline.csv','ms,state,art,frame,transform\n'+log.rows.map(r=>[r.ms,r.state,r.art,r.frame,'"'+r.transform+'"'].join(',')).join('\n')+'\n');
  await writeFile(cache+'/recording.json',JSON.stringify({rect,soundStarts:log.soundStarts,states,errors},null,2));
  const quiet=await browser.newPage({reducedMotion:'reduce'});
  quiet.on('pageerror',e=>errors.push(e.message));
  quiet.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await quiet.goto((process.env.DEV_URL || 'http://127.0.0.1:5188')+'/scripts/mascot-lab/');
  await quiet.locator('[data-event="correct"]').click();
  const still=quiet.locator('[data-emotion="correct"] canvas');await still.waitFor();
  const a=await still.evaluate(c=>[c.toDataURL(),getComputedStyle(c).transform]);
  await quiet.waitForTimeout(330);
  const b=await still.evaluate(c=>[c.toDataURL(),getComputedStyle(c).transform]);
  assert.equal(a[0],b[0]);assert.equal(b[1],'none');
  await quiet.locator('[data-emotion="idle"]').waitFor();
  await quiet.close();
  assert.deepEqual(errors,[]);
  console.log('PASS 61s real-clock observation',states,rect,log.soundStarts);
} finally {await browser.close();}
