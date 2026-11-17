import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
const base=process.env.SMOKE_URL??'http://127.0.0.1:5197';
const out='scripts/.cache/3d-audit';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
const page=await browser.newPage({viewport:{width:1100,height:650}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
  localStorage.setItem('mission-control.sound','off');window.webglContexts=0;
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2')window.webglContexts++;return original.call(this,type,...args)};
});
try {
  await page.goto(base+'/privacy');
  await page.evaluate(async()=>{
    const {mountHost}=await import('/src/components/aidos3d/renderer.ts');
    const panel=document.createElement('section');panel.style='position:fixed;inset:0;background:#eef5fa;z-index:99999;display:flex;align-items:center;justify-content:center;gap:20px';document.body.append(panel);
    window.mouthTest=0;
    for(const pose of ['wave','point','tablet','jump']){
      const holder=document.createElement('div');holder.style='text-align:center;color:#223';holder.textContent=pose;
      const c=document.createElement('canvas');c.dataset.pose=pose;c.style='display:block;width:240px;height:360px';holder.append(c);panel.append(holder);
      mountHost(c,()=>({pose,mouth:window.mouthTest}),()=>{});
    }
  });
  await page.waitForFunction(()=>document.querySelectorAll('canvas[data-rendered]').length===4);
  const bounds=await page.locator('canvas[data-pose]').evaluateAll(list=>list.map(c=>{
    const {data}=c.getContext('2d').getImageData(0,0,c.width,c.height);let minX=c.width,minY=c.height,maxX=0,maxY=0;
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    return {pose:c.dataset.pose,minX,minY,maxX,maxY,width:c.width,height:c.height};
  }));
  assert(bounds.every(b=>b.minX>0&&b.minY>0&&b.maxX<b.width-1&&b.maxY<b.height-1),'Pose clipped: '+JSON.stringify(bounds));
  const before=await page.locator('canvas[data-pose="wave"]').evaluate(c=>c.toDataURL());
  await page.waitForTimeout(700);
  assert.notEqual(await page.locator('canvas[data-pose="wave"]').evaluate(c=>c.toDataURL()),before,'Real pose motion');
  await page.evaluate(()=>window.mouthTest=1);await page.waitForTimeout(100);
  await page.screenshot({path:out+'/four-poses.png'});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
  const still=await page.locator('canvas[data-pose="wave"]').evaluate(c=>c.toDataURL());
  await page.waitForTimeout(300);assert.equal(await page.locator('canvas[data-pose="wave"]').evaluate(c=>c.toDataURL()),still);
  assert.equal(await page.evaluate(()=>window.webglContexts),1,'Shared WebGL context');
  assert.equal(errors.length,0,errors.join('\n'));
  const fallback=await browser.newPage();
  await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:get.call(this,type,...args)}});
  await fallback.goto(base);await fallback.getByRole('button',{name:'CONTINUE',exact:true}).waitFor();
  assert.equal(await fallback.locator('[data-3d]').count(),0);assert(await fallback.locator('.aid-sprite').first().evaluate(img=>img.complete&&img.naturalWidth>0));await fallback.close();
  await writeFile(out+'/three-d.json',JSON.stringify({bounds,contexts:1,reducedMotion:true,fallback:true,errors,passed:true},null,2));
  console.log('PASS four real 3D poses, mesh motion, containment, single context, reduced motion, WebGL fallback');
}finally{await browser.close();}
