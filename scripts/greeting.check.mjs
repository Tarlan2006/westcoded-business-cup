import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.GREETING_PLAYWRIGHT).href);
const browser=await chromium.launch({executablePath:process.env.GREETING_CHROME});
try { for(const [width,muted,failed] of [[390,false,false],[1280,false,false],[390,true,false],[390,false,true]]) {
 const context=await browser.newContext({viewport:{width,height:844}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(muted=>{if(muted)localStorage.setItem('mission-control.sound','off');window.__voiceStarts=[];const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.__voiceStarts.push(this.buffer?.duration??0);return start.apply(this,args);};},muted);
 let clipRequests=0;page.on('request',r=>{if(r.url().includes('/common_setup_greeting.mp3'))clipRequests++;});
 if(failed)await page.route('**/common_setup_greeting.mp3',r=>r.fulfill({status:404,body:''}));
 await page.goto(process.env.GREETING_URL??'http://127.0.0.1:5178');
 await page.getByRole('heading',{name:'Hey pal! Ready for a screen-free adventure?',exact:true}).waitFor();
 await page.getByRole('button',{name:'CONTINUE',exact:true}).click();
 await page.getByRole('heading',{name:'Tell AIdos About Your Child',exact:true}).waitFor();
 await page.getByLabel("What should AIdos call your child?",{exact:true}).waitFor();
 assert(!(await page.locator('body').innerText()).includes('Bleep'));
 if(!muted&&!failed){await page.waitForFunction(()=>window.__voiceStarts.some(d=>d>1));assert.equal(clipRequests,1);}
 if(muted)assert.equal(clipRequests,0);
 assert.deepEqual(errors,[]);console.log('PASS Greeting -> Parent Setup; '+width+'px; muted='+muted+'; missing clip='+failed);
 await context.close();
 }} finally {await browser.close();}
