import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import kk from '../src/i18n/kk.ts';
const quiz=JSON.parse(await readFile('content/quiz.json','utf8')).filter(q=>q.ageBand==='6-8');
const {clips}=JSON.parse(await readFile('public/audio/kk/manifest.json','utf8'));
const out=process.env.SMOKE_OUTPUT || 'docs/mascot/emotions';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const errors=[], answers=[], requests=[];
try {
  const page=await browser.newPage({viewport:{width:390,height:844},permissions:['microphone']});
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.ok())requests.push(new URL(r.url()).pathname);});
  await page.goto(process.env.SMOKE_URL||'http://127.0.0.1:5191');
  await page.locator('#screen-greeting button').last().click();
  await page.locator('#profileNameInput').fill('Әли');
  await page.locator('[data-age="6-8"]').click();
  await page.locator('.profile-submit').click();
  const btn=key=>page.getByRole('button',{name:kk[key],exact:true});
  await page.locator('#screen-video button').filter({hasText:kk['video.playNow'].replace('{brand}','AIdos')}).click();
  const afterVideo=[];
  for (let i=0;i<3;i++) {
    const stage=page.locator('#screen-mission');
    const caption=await stage.locator('.caption').innerText();
    const q=quiz.find(q=>caption.includes(kk['quiz.'+q.id+'.question']));
    assert(q,caption);
    const right=q.choices.indexOf(q.answer);
    const outcome=i===1?'wrong':'correct';
    await stage.locator('[aria-label="'+kk['missionStage.quickReplies']+'"] button').nth(i===1?(right+1)%q.choices.length:right).click();
    await stage.locator('[data-emotion="'+outcome+'"]').waitFor();
    if(i===1)assert.equal(await stage.locator('.prototype-particle').count(),0);
    afterVideo.push({question:q.id,response:outcome});
    await btn(i===2?'quiz.finishQuiz':'quiz.nextQuestion').click();
  }
  await page.locator('#screen-complete').waitFor();
  await btn('missionSummary.moreGames').click();
  await page.locator('.activity-grid button').filter({hasText:kk['activitySuggestions.quiz']}).first().click();
  const card=page.locator('.quiz-card');
  for(const [i,q] of quiz.entries()) {
    assert.equal(await card.locator('h2').innerText(),kk['quiz.'+q.id+'.question']);
    const right=q.choices.indexOf(q.answer);
    const choice=i%2?(right+1)%q.choices.length:right;
    const expected=choice===right?'correct':'wrong';
    await card.locator('.answer-list button').nth(choice).click();
    await card.locator('[data-emotion="'+expected+'"]').waitFor();
    if(i===0) {
      assert.notEqual(await card.locator('[data-emotion]').getAttribute('data-motion'),'wave');
      await card.locator('[data-emotion="idle"]').waitFor();
    }
    if(i===1) {
      await card.locator('[data-emotion="wrong"] [data-mouth]').waitFor();
      assert(requests.includes(clips.common_quiz_encourage));
    }
    answers.push({question:q.id,response:expected});
    await btn(i===quiz.length-1?'quiz.finishQuiz':'quiz.nextQuestion').click();
  }
  assert(await page.locator('.reward-mascot,[data-emotion="correct"]').first().isVisible() || await page.locator('#screen-complete').count());
  await btn('activityHeader.homeBackToActivities').first().click().catch(async()=>{await btn('missionSummary.moreGames').click();});
  await page.locator('.activity-grid button').filter({hasText:'AIdos'}).filter({hasText:kk['activitySuggestions.ask'].replace('{brand}','AIdos')}).first().click();
  let finishAsk;
  await page.route('**/api/ask',route=>new Promise(resolve=>{finishAsk=async()=>{await route.fulfill({status:200,json:{answer:'Күн – жұлдыз.',source:'faq'}});resolve();};}));
  const mic=page.locator('button.talk-button');await mic.focus();await page.keyboard.down('Space');
  await page.locator('[data-emotion="listening"]').waitFor();await page.keyboard.press('Escape');await page.keyboard.up('Space');
  await page.locator('textarea').fill('Күн деген не?');await btn('ask.ask').click();
  await page.locator('[data-emotion="thinking"]').waitFor();
  await page.waitForTimeout(1400);
  assert(await page.locator('[data-emotion="thinking"]').isVisible());
  await finishAsk();await btn('ask.askAnother').waitFor();
  assert.equal(await page.locator('[data-emotion="thinking"]').count(),0);
  await btn('ask.askAnother').click();
  await page.unroute('**/api/ask');
  // An invalid response takes the real offline path without causing a console HTTP error.
  await page.route('**/api/ask',route=>route.fulfill({json:{}}));
  await page.locator('textarea').fill('Аспан неге көк?');await btn('ask.ask').click();
  await page.locator('[data-emotion="network"]').waitFor();
  assert.deepEqual(errors,[]);
  await writeFile(out+'/quiz.json',JSON.stringify({age:'6–8',afterVideo,answers,retryClip:clips.common_quiz_encourage,ask:['listening','thinking','result','network'],errors},null,2)+'\n');
  console.log('PASS complete quiz',answers.length,'questions, positive/negative feedback, Ask microphone, pending request and offline fallback');
} finally {await browser.close();}
